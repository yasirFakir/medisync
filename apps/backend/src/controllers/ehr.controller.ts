import { Response } from 'express';
import speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

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

  // In production: send OTP via SMS/email — here we return it directly for dev
  res.json({
    success: true,
    message: 'OTP generated successfully. Share this with your doctor.',
    data: { otp, validFor: '5 minutes' },
    timestamp: new Date().toISOString(),
  });
};

// ─── POST /api/ehr/request-access  [DOCTOR] ──────────────────────────────────
export const requestAccess = async (req: AuthRequest, res: Response): Promise<void> => {
  const { patientId, otpToken } = req.body;

  const secretRow = await queryOne<{ totp_secret: string }>(
    'SELECT totp_secret FROM patient_totp_secrets WHERE patient_id = $1',
    [patientId]
  );

  if (!secretRow) throw new AppError('Patient has not generated an OTP yet', 404);

  const isValid = speakeasy.totp.verify({
    secret: secretRow.totp_secret,
    encoding: 'base32',
    token: otpToken,
    step: 300,
    window: 1,
  });

  if (!isValid) throw new AppError('Invalid or expired OTP token', 401);

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
