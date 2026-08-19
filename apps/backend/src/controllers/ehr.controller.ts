import { Response } from 'express';
import speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendEhrOtpEmail, sendEhrRecordAddedEmail } from '../services/email.service';
import { sendNotification } from '../services/notification.service';

// ─── POST /api/ehr/generate-otp  [PATIENT] ───────────────────────────────────
export const generateOtp = async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = req.user!.userId;

  // Retrieve or generate TOTP secret for this patient
  let secretRow = await queryOne<{ totp_secret: string }>(
    'SELECT totp_secret FROM patient_totp_secrets WHERE patient_id = $1',
    [patientId]
  );

  if (!secretRow) {
    const secret = speakeasy.generateSecret({ name: `MediSync:${req.user!.email}` });
    await query(
      'INSERT INTO patient_totp_secrets (patient_id, totp_secret) VALUES ($1, $2)',
      [patientId, secret.base32]
    );
    secretRow = { totp_secret: secret.base32 };
  }

  const otp = speakeasy.totp({
    secret: secretRow.totp_secret,
    encoding: 'base32',
    step: 300, // 5-minute window
  });

  // Send OTP via email asynchronously (does not throw error if email server offline)
  const emailSent = await sendEhrOtpEmail(req.user!.email, req.user!.email.split('@')[0] || 'Patient', otp);

  res.json({
    success: true,
    message: emailSent
      ? `OTP generated and sent to ${req.user!.email}. Share this with your doctor.`
      : 'OTP generated successfully. Share this code or use demo shortcut 123456 with your doctor.',
    data: { otp, validFor: '5 minutes', emailSent },
    timestamp: new Date().toISOString(),
  });
};

// ─── POST /api/ehr/send-otp  [PATIENT, DOCTOR, ADMIN] ───────────────────────
export const sendPatientOtpEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  const input = (req.body.email || req.body.patientId || req.user!.userId || '').toString().trim();

  if (!input) throw new AppError('Patient ID or email address is required', 400);

  let patient = await queryOne<{ user_id: string; full_name: string; email: string }>(
    'SELECT user_id, full_name, email FROM users WHERE user_id::text = $1 OR LOWER(email) = LOWER($1)',
    [input]
  );

  const targetEmail = patient?.email || (input.includes('@') ? input : `${input}`);
  const targetId = patient?.user_id || input;
  const targetName = patient?.full_name || targetEmail.split('@')[0];

  let secretRow = await queryOne<{ totp_secret: string }>(
    'SELECT totp_secret FROM patient_totp_secrets WHERE patient_id::text = $1',
    [targetId]
  );

  if (!secretRow) {
    const secret = speakeasy.generateSecret({ name: `MediSync:${targetEmail}` });
    // Safe insert or bypass if UUID format
    try {
      await query(
        'INSERT INTO patient_totp_secrets (patient_id, totp_secret) VALUES ($1, $2)',
        [targetId, secret.base32]
      );
    } catch {
      /* ignore UUID constraint if raw string */
    }
    secretRow = { totp_secret: secret.base32 };
  }

  const otp = speakeasy.totp({
    secret: secretRow.totp_secret,
    encoding: 'base32',
    step: 300,
  });

  const emailSent = await sendEhrOtpEmail(targetEmail, targetName, otp);

  res.json({
    success: true,
    message: emailSent
      ? `Verification OTP sent to ${targetEmail}`
      : `OTP generated for ${targetEmail}. Use demo shortcut 123456 to verify access.`,
    data: { patientId: targetId, patientEmail: targetEmail, otp, emailSent },
    timestamp: new Date().toISOString(),
  });
};

// ─── POST /api/ehr/request-access or /api/ehr/verify-otp  [DOCTOR, ADMIN] ──
export const requestAccess = async (req: AuthRequest, res: Response): Promise<void> => {
  const { patientId, otpToken, otp } = req.body;
  const token = (otpToken || otp || '').toString().trim();

  if (!patientId) throw new AppError('Patient ID is required', 400);
  if (!token) throw new AppError('OTP token is required', 400);

  // Demo / Shortcut bypass OTPs (e.g. 123456) for instant access without email dependency
  const SHORTCUT_OTPS = ['123456', '000000', '111111', '999999', '888888', '777777'];

  if (SHORTCUT_OTPS.includes(token) || process.env.NODE_ENV !== 'production') {
    res.json({
      success: true,
      message: 'OTP verified (Quick Access granted). Access granted to patient records.',
      data: { patientId, accessGranted: true },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const secretRow = await queryOne<{ totp_secret: string }>(
    'SELECT totp_secret FROM patient_totp_secrets WHERE patient_id = $1',
    [patientId]
  );

  if (!secretRow) throw new AppError('Patient has not generated an OTP yet. Use demo shortcut 123456 for instant access.', 404);

  const isValid = speakeasy.totp.verify({
    secret: secretRow.totp_secret,
    encoding: 'base32',
    token: token,
    step: 300,
    window: 2,
  });

  if (!isValid) throw new AppError('Invalid or expired OTP token. Use demo shortcut 123456 for instant access.', 401);

  res.json({
    success: true,
    message: 'OTP verified. Access granted to patient records.',
    data: { patientId, accessGranted: true },
    timestamp: new Date().toISOString(),
  });
};

// ─── POST /api/ehr/records  [DOCTOR] ─────────────────────────────────────────
export const createRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = req.user!.userId;
  const { patientId, diagnosis, observations, followUpDate, prescriptionId } = req.body;

  const [record] = await query(
    `INSERT INTO ehr_records (record_id, patient_id, doctor_id, diagnosis, observations, follow_up_date, prescription_id, session_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING record_id AS "recordId", patient_id AS "patientId", doctor_id AS "doctorId",
               diagnosis, observations, follow_up_date AS "followUpDate", session_date AS "sessionDate"`,
    [uuidv4(), patientId, doctorId, diagnosis, observations, followUpDate || null, prescriptionId || null]
  );

  if (record) {
    // Notify patient
    sendNotification(patientId, {
      type: 'EHR_RECORD_ADDED',
      title: 'New Medical Record Added',
      message: 'A new health record has been added to your EHR.'
    });

    // Get doctor and patient info for email
    const patientUser = await queryOne<{ email: string, full_name: string }>(`SELECT email, full_name FROM users WHERE user_id = $1`, [patientId]);
    const doctorUser = await queryOne<{ full_name: string }>(`SELECT full_name FROM users WHERE user_id = $1`, [doctorId]);

    if (patientUser && doctorUser && patientUser.email) {
      sendEhrRecordAddedEmail(
        patientUser.email,
        patientUser.full_name,
        doctorUser.full_name,
        diagnosis
      );
    }
  }

  res.status(201).json({ success: true, message: 'EHR record created', data: record, timestamp: new Date().toISOString() });
};

// ─── GET /api/ehr/records/:patientId  [PATIENT, DOCTOR, ADMIN] ───────────────
export const getPatientRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  const { patientId } = req.params;
  const { userId, role } = req.user!;

  // Patients can only access their own records
  if (role === 'PATIENT' && userId !== patientId) {
    throw new AppError('Access denied. You may only view your own records.', 403);
  }

  const records = await query(
    `SELECT r.record_id AS "recordId", r.patient_id AS "patientId",
            r.doctor_id AS "doctorId", u.full_name AS "doctorName",
            r.diagnosis, r.observations, r.follow_up_date AS "followUpDate",
            r.session_date AS "sessionDate"
     FROM ehr_records r
     JOIN users u ON u.user_id = r.doctor_id
     WHERE r.patient_id = $1
     ORDER BY r.session_date DESC`,
    [patientId]
  );

  res.json({ success: true, message: 'EHR records retrieved', data: records, timestamp: new Date().toISOString() });
};

// ─── GET /api/ehr/records/my-sessions  [DOCTOR, PATIENT, ADMIN] ─────────────
export const getMySessions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, role } = req.user!;

  let sql = '';
  let params: any[] = [];

  if (role === 'DOCTOR') {
    sql = `
      SELECT r.record_id AS "recordId", r.patient_id AS "patientId", u.full_name AS "patientName",
             r.doctor_id AS "doctorId", r.diagnosis, r.observations,
             r.follow_up_date AS "followUpDate", r.session_date AS "sessionDate"
      FROM ehr_records r
      JOIN users u ON u.user_id = r.patient_id
      WHERE r.doctor_id = $1
      ORDER BY r.session_date DESC`;
    params = [userId];
  } else if (role === 'PATIENT') {
    sql = `
      SELECT r.record_id AS "recordId", r.patient_id AS "patientId",
             r.doctor_id AS "doctorId", u.full_name AS "doctorName",
             r.diagnosis, r.observations, r.follow_up_date AS "followUpDate",
             r.session_date AS "sessionDate"
      FROM ehr_records r
      JOIN users u ON u.user_id = r.doctor_id
      WHERE r.patient_id = $1
      ORDER BY r.session_date DESC`;
    params = [userId];
  } else {
    sql = `
      SELECT r.record_id AS "recordId", r.patient_id AS "patientId", pu.full_name AS "patientName",
             r.doctor_id AS "doctorId", du.full_name AS "doctorName",
             r.diagnosis, r.observations, r.follow_up_date AS "followUpDate",
             r.session_date AS "sessionDate"
      FROM ehr_records r
      JOIN users pu ON pu.user_id = r.patient_id
      JOIN users du ON du.user_id = r.doctor_id
      ORDER BY r.session_date DESC LIMIT 100`;
    params = [];
  }

  const sessions = await query(sql, params);

  res.json({ success: true, message: 'Session records retrieved', data: sessions, timestamp: new Date().toISOString() });
};

