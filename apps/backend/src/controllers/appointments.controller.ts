import { Response } from 'express';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

export const getDoctors = async (req: AuthRequest, res: Response): Promise<void> => {
  const { city, designation, area, date, search, minFee, maxFee, page = '1', limit = '12' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  let queryStr = `
    SELECT 
      u.user_id AS "doctorId", u.full_name AS "fullName",
      COALESCE(dp.designation, 'General Physician') AS designation,
      COALESCE(dp.specialization, 'General Medicine') AS specialization,
      COALESCE(dp.consultation_fee, 500) AS "consultationFee",
      COALESCE(dp.experience_years, 5) AS "experienceYears", 
      COALESCE(dp.area, 'Dhanmondi') AS area,
      COALESCE(dp.city, 'Dhaka') AS city,
      dp.avatar_url AS "avatarUrl",
      COALESCE(dp.rating, 5.0) AS rating,
      COALESCE(dp.total_reviews, 0) AS "totalReviews",
      COALESCE(
        json_agg(
          json_build_object(
            'slotId', da.slot_id,
            'locationName', da.location_name,
            'dayOfWeek', da.day_of_week,
            'specificDates', da.specific_dates,
            'startTime', da.start_time,
            'endTime', da.end_time
          )
        ) FILTER (WHERE da.slot_id IS NOT NULL), '[]'
      ) AS "slots"
    FROM users u
    LEFT JOIN doctor_profiles dp ON dp.doctor_id = u.user_id
    LEFT JOIN doctor_availability da ON da.doctor_id = u.user_id AND da.is_active = true
    WHERE u.role = 'DOCTOR' AND COALESCE(dp.is_available, true) = true
  `;
  
  const params: any[] = [];
  let paramIdx = 1;

  if (city) {
    queryStr += ` AND LOWER(dp.city) = $${paramIdx++}`;
    params.push((city as string).toLowerCase());
  }
  if (designation) {
    queryStr += ` AND LOWER(dp.designation) = $${paramIdx++}`;
    params.push((designation as string).toLowerCase());
  }
  if (area) {
    queryStr += ` AND LOWER(dp.area) = $${paramIdx++}`;
    params.push((area as string).toLowerCase());
  }
  if (minFee) {
    queryStr += ` AND dp.consultation_fee >= $${paramIdx++}`;
    params.push(parseFloat(minFee as string));
  }
  if (maxFee) {
    queryStr += ` AND dp.consultation_fee <= $${paramIdx++}`;
    params.push(parseFloat(maxFee as string));
  }
  if (search) {
    queryStr += ` AND (LOWER(u.full_name) LIKE $${paramIdx} OR LOWER(dp.specialization) LIKE $${paramIdx})`;
    params.push(`%${(search as string).toLowerCase()}%`);
    paramIdx++;
  }
  // Date filtering logic can be complex in SQL, skipping complex dayOfWeek match for now

  queryStr += ` GROUP BY u.user_id, dp.doctor_id ORDER BY COALESCE(dp.rating, 5.0) DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(parseInt(limit as string), offset);

  const doctors = await query<any>(queryStr, params);
  const formatted = doctors.map(d => ({
    ...d,
    consultationFee: Number(d.consultationFee || 0),
    experienceYears: Number(d.experienceYears || 0),
    rating: Number(d.rating || 5.0),
    totalReviews: Number(d.totalReviews || 0),
  }));

  res.json({ success: true, message: 'Doctors retrieved', data: formatted, timestamp: new Date().toISOString() });
};

export const getDoctorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { doctorId } = req.params;
  
  const doctor = await queryOne<any>(`
    SELECT 
      dp.doctor_id AS "doctorId", u.full_name AS "fullName", dp.designation, dp.specialization,
      dp.qualifications, dp.bio, dp.consultation_fee AS "consultationFee", 
      dp.experience_years AS "experienceYears", dp.area, dp.city, dp.avatar_url AS "avatarUrl", 
      dp.rating, dp.total_reviews AS "totalReviews", dp.languages,
      COALESCE(
        json_agg(
          json_build_object(
            'slotId', da.slot_id,
            'locationName', da.location_name,
            'address', da.address,
            'dayOfWeek', da.day_of_week,
            'specificDates', da.specific_dates,
            'startTime', da.start_time,
            'endTime', da.end_time,
            'maxPatients', da.max_patients
          )
        ) FILTER (WHERE da.slot_id IS NOT NULL), '[]'
      ) AS "slots"
    FROM doctor_profiles dp
    JOIN users u ON u.user_id = dp.doctor_id
    LEFT JOIN doctor_availability da ON da.doctor_id = dp.doctor_id AND da.is_active = true
    WHERE dp.doctor_id = $1
    GROUP BY dp.doctor_id, u.full_name
  `, [doctorId]);

  if (!doctor) throw new AppError('Doctor not found', 404);

  const formatted = {
    ...doctor,
    consultationFee: Number(doctor.consultationFee || 0),
    experienceYears: Number(doctor.experienceYears || 0),
    rating: Number(doctor.rating || 5.0),
    totalReviews: Number(doctor.totalReviews || 0),
  };

  res.json({ success: true, message: 'Doctor profile retrieved', data: formatted, timestamp: new Date().toISOString() });
};

export const getAvailableSlots = async (req: AuthRequest, res: Response): Promise<void> => {
  const { doctorId } = req.params;
  const { date } = req.query; // YYYY-MM-DD
  
  if (!date) throw new AppError('Date is required', 400);

  // Extract day of week from date (0=Sun, 1=Mon, ...)
  const dateObj = new Date(date as string);
  const dayOfWeek = dateObj.getDay();

  const slots = await query(`
    SELECT 
      slot_id AS "slotId", location_name AS "locationName", address,
      start_time AS "startTime", end_time AS "endTime", max_patients AS "maxPatients"
    FROM doctor_availability
    WHERE doctor_id = $1 AND is_active = true
    AND (day_of_week @> ARRAY[$2]::integer[] OR specific_dates @> ARRAY[$3]::date[] OR (day_of_week IS NULL AND specific_dates IS NULL))
  `, [doctorId, dayOfWeek, date]);

  const bookedAppointments = await query(`
    SELECT start_time AS "startTime", end_time AS "endTime"
    FROM appointments
    WHERE doctor_id = $1 AND appointment_date = $2 AND status IN ('PENDING', 'CONFIRMED')
  `, [doctorId, date]);

  res.json({ 
    success: true, 
    message: 'Available slots retrieved', 
    data: { slots, bookedAppointments }, 
    timestamp: new Date().toISOString() 
  });
};

export const bookAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = req.user!.userId;
  const { doctorId, slotId, appointmentDate, startTime, endTime, reason } = req.body;

  // Validate slot
  const slot = await queryOne(`SELECT location_name, address FROM doctor_availability WHERE slot_id = $1 AND doctor_id = $2`, [slotId, doctorId]);
  if (!slot) throw new AppError('Invalid slot or doctor', 400);

  // Check overlap
  const overlap = await queryOne(`
    SELECT appointment_id FROM appointments 
    WHERE doctor_id = $1 AND appointment_date = $2 
    AND status IN ('PENDING', 'CONFIRMED')
    AND start_time < $4 AND end_time > $3
  `, [doctorId, appointmentDate, startTime, endTime]);

  if (overlap) throw new AppError('Time slot overlaps with an existing appointment', 409);

  const [appointment] = await query(`
    INSERT INTO appointments (appointment_id, patient_id, doctor_id, slot_id, appointment_date, start_time, end_time, location_name, address, reason, status, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', 'PATIENT')
    RETURNING appointment_id AS "appointmentId", patient_id AS "patientId", doctor_id AS "doctorId", slot_id AS "slotId", 
              appointment_date AS "appointmentDate", start_time AS "startTime", end_time AS "endTime", status
  `, [uuidv4(), patientId, doctorId, slotId, appointmentDate, startTime, endTime, slot.location_name, slot.address, reason]);

  res.status(201).json({ success: true, message: 'Appointment booked successfully', data: appointment, timestamp: new Date().toISOString() });
};

export const getMyAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const role = req.user!.role;
  const { status, page = '1', limit = '10' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  let queryStr = `
    SELECT 
      a.appointment_id AS "appointmentId", a.appointment_date AS "appointmentDate", a.start_time AS "startTime", 
      a.end_time AS "endTime", a.location_name AS "locationName", a.status, a.reason,
      p.full_name AS "patientName", d.full_name AS "doctorName", dp.designation, dp.specialization
    FROM appointments a
    JOIN users p ON p.user_id = a.patient_id
    JOIN users d ON d.user_id = a.doctor_id
    LEFT JOIN doctor_profiles dp ON dp.doctor_id = a.doctor_id
  `;
  
  const params: any[] = [];
  let paramIdx = 1;

  if (role === 'PATIENT') {
    queryStr += ` WHERE a.patient_id = $${paramIdx++}`;
    params.push(userId);
  } else if (role === 'DOCTOR') {
    queryStr += ` WHERE a.doctor_id = $${paramIdx++}`;
    params.push(userId);
  } else {
    throw new AppError('Unauthorized', 403);
  }

  if (status) {
    queryStr += ` AND a.status = $${paramIdx++}`;
    params.push(status);
  }

  queryStr += ` ORDER BY a.appointment_date DESC, a.start_time DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(parseInt(limit as string), offset);

  const appointments = await query(queryStr, params);

  res.json({ success: true, message: 'Appointments retrieved', data: appointments, timestamp: new Date().toISOString() });
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { appointmentId } = req.params;
  const { status, notes } = req.body;
  const userId = req.user!.userId;
  const role = req.user!.role;

  const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
  if (!validStatuses.includes(status)) throw new AppError('Invalid status', 400);

  const appt = await queryOne(`SELECT patient_id, doctor_id FROM appointments WHERE appointment_id = $1`, [appointmentId]);
  if (!appt) throw new AppError('Appointment not found', 404);

  if (role === 'PATIENT' && appt.patient_id !== userId) throw new AppError('Unauthorized', 403);
  if (role === 'DOCTOR' && appt.doctor_id !== userId) throw new AppError('Unauthorized', 403);

  if (role === 'PATIENT' && status !== 'CANCELLED') throw new AppError('Patients can only cancel appointments', 403);

  let queryStr = `UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP`;
  const params: any[] = [status];
  let paramIdx = 2;

  if (notes !== undefined) {
    queryStr += `, notes = $${paramIdx++}`;
    params.push(notes);
  }

  queryStr += ` WHERE appointment_id = $${paramIdx} RETURNING appointment_id AS "appointmentId", status`;
  params.push(appointmentId);

  const [updated] = await query(queryStr, params);

  res.json({ success: true, message: 'Appointment status updated', data: updated, timestamp: new Date().toISOString() });
};

export const createDoctorAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = req.user!.userId;
  const { patientId, patientName, phone, slotId, appointmentDate, startTime, endTime, reason, notes } = req.body;

  let actualPatientId = patientId;
  if (!actualPatientId) throw new AppError('patientId is required', 400);

  let locationName = 'Doctor Consultation Suite';
  let address = 'Main Clinic';

  if (slotId) {
    const slot = await queryOne<{ location_name: string; address: string }>(
      `SELECT location_name, address FROM doctor_availability WHERE slot_id = $1 AND doctor_id = $2`,
      [slotId, doctorId]
    );
    if (slot) {
      locationName = slot.location_name;
      address = slot.address;
    }
  } else {
    const firstSlot = await queryOne<{ location_name: string; address: string }>(
      `SELECT location_name, address FROM doctor_availability WHERE doctor_id = $1 AND is_active = true LIMIT 1`,
      [doctorId]
    );
    if (firstSlot) {
      locationName = firstSlot.location_name;
      address = firstSlot.address;
    }
  }

  const overlap = await queryOne(`
    SELECT appointment_id FROM appointments 
    WHERE doctor_id = $1 AND appointment_date = $2 
    AND status IN ('PENDING', 'CONFIRMED')
    AND start_time < $4 AND end_time > $3
  `, [doctorId, appointmentDate, startTime, endTime]);

  if (overlap) throw new AppError('Time slot overlaps with an existing appointment', 409);

  const [appointment] = await query(`
    INSERT INTO appointments (appointment_id, patient_id, doctor_id, slot_id, appointment_date, start_time, end_time, location_name, address, reason, notes, status, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'CONFIRMED', 'DOCTOR')
    RETURNING appointment_id AS "appointmentId", status
  `, [uuidv4(), actualPatientId, doctorId, slotId || null, appointmentDate, startTime, endTime, locationName, address, reason, notes]);

  res.status(201).json({ success: true, message: 'Appointment created successfully', data: appointment, timestamp: new Date().toISOString() });
};

export const getDoctorAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = req.user!.userId;
  const slots = await query(`
    SELECT 
      slot_id AS "slotId", location_name AS "locationName", address, day_of_week AS "dayOfWeek",
      specific_dates AS "specificDates", start_time AS "startTime", end_time AS "endTime", max_patients AS "maxPatients"
    FROM doctor_availability
    WHERE doctor_id = $1 AND is_active = true
  `, [doctorId]);

  res.json({ success: true, message: 'Availability retrieved', data: slots, timestamp: new Date().toISOString() });
};

export const upsertDoctorAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = req.user!.userId;
  const { slots } = req.body;

  if (!Array.isArray(slots)) throw new AppError('Slots must be an array', 400);

  const result = [];
  for (const s of slots) {
    if (s.slotId) {
      const [updated] = await query(`
        UPDATE doctor_availability 
        SET location_name=$1, address=$2, day_of_week=$3, specific_dates=$4, start_time=$5, end_time=$6, max_patients=$7
        WHERE slot_id=$8 AND doctor_id=$9
        RETURNING slot_id AS "slotId"
      `, [s.locationName, s.address, s.dayOfWeek, s.specificDates, s.startTime, s.endTime, s.maxPatients, s.slotId, doctorId]);
      if (updated) result.push(updated);
    } else {
      const [inserted] = await query(`
        INSERT INTO doctor_availability (slot_id, doctor_id, location_name, address, day_of_week, specific_dates, start_time, end_time, max_patients)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING slot_id AS "slotId"
      `, [uuidv4(), doctorId, s.locationName, s.address, s.dayOfWeek, s.specificDates, s.startTime, s.endTime, s.maxPatients]);
      result.push(inserted);
    }
  }

  res.json({ success: true, message: 'Availability updated', data: result, timestamp: new Date().toISOString() });
};

export const deleteDoctorAvailabilitySlot = async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = req.user!.userId;
  const { slotId } = req.params;

  await query(`DELETE FROM doctor_availability WHERE slot_id = $1 AND doctor_id = $2`, [slotId, doctorId]);

  res.json({ success: true, message: 'Slot deleted', timestamp: new Date().toISOString() });
};
