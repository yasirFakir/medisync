import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── POST /api/alerts  [PATIENT] ──────────────────────────────────────────────
export const createAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = req.user!.userId;
  const { alerts, medicineName, dosage, frequency, scheduledTime } = req.body;

  // Batch import from prescription or multi-schedule
  if (Array.isArray(alerts) && alerts.length > 0) {
    const createdList = [];
    for (const item of alerts) {
      const [newAlert] = await query(
        `INSERT INTO medication_alerts (alert_id, patient_id, medicine_name, dosage, frequency, scheduled_time, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
         RETURNING alert_id AS "alertId", patient_id AS "patientId", medicine_name AS "medicineName",
                   dosage, frequency, scheduled_time AS "scheduledTime", status`,
        [uuidv4(), patientId, item.medicineName, item.dosage || 'Standard', item.frequency || 'Once daily', item.scheduledTime || '08:00']
      );
      createdList.push(newAlert);
    }
    res.status(201).json({ success: true, message: `${createdList.length} medication reminders created`, data: createdList, timestamp: new Date().toISOString() });
    return;
  }

  // Single alert creation
  const [alert] = await query(
    `INSERT INTO medication_alerts (alert_id, patient_id, medicine_name, dosage, frequency, scheduled_time, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
     RETURNING alert_id AS "alertId", patient_id AS "patientId", medicine_name AS "medicineName",
               dosage, frequency, scheduled_time AS "scheduledTime", status`,
    [uuidv4(), patientId, medicineName, dosage, frequency, scheduledTime]
  );

  res.status(201).json({ success: true, message: 'Medication alert created', data: alert, timestamp: new Date().toISOString() });
};


// ─── GET /api/alerts  [PATIENT] ───────────────────────────────────────────────
export const getMyAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = req.user!.userId;

  const alerts = await query(
    `SELECT alert_id AS "alertId", medicine_name AS "medicineName", dosage, frequency,
            scheduled_time AS "scheduledTime", status
     FROM medication_alerts WHERE patient_id = $1 ORDER BY scheduled_time ASC`,
    [patientId]
  );

  res.json({ success: true, message: 'Alerts retrieved', data: alerts, timestamp: new Date().toISOString() });
};

// ─── PATCH /api/alerts/:alertId  [PATIENT] ───────────────────────────────────
export const updateAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  const { alertId } = req.params;
  const { medicineName, dosage, frequency, scheduledTime, status } = req.body;
  const patientId = req.user!.userId;

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (medicineName !== undefined) { fields.push(`medicine_name = $${idx++}`); values.push(medicineName); }
  if (dosage !== undefined) { fields.push(`dosage = $${idx++}`); values.push(dosage); }
  if (frequency !== undefined) { fields.push(`frequency = $${idx++}`); values.push(frequency); }
  if (scheduledTime !== undefined) { fields.push(`scheduled_time = $${idx++}`); values.push(scheduledTime); }
  if (status !== undefined) {
    if (!['ACTIVE', 'SUSPENDED', 'ARCHIVED'].includes(status)) {
      throw new AppError('Invalid status value', 422);
    }
    fields.push(`status = $${idx++}`);
    values.push(status);
  }

  if (fields.length === 0) {
    throw new AppError('No fields provided for update', 400);
  }

  const alertIdIdx = idx++;
  values.push(alertId);

  const patientIdIdx = idx++;
  values.push(patientId);

  const [alert] = await query(
    `UPDATE medication_alerts 
     SET ${fields.join(', ')} 
     WHERE alert_id = $${alertIdIdx} AND patient_id = $${patientIdIdx}
     RETURNING alert_id AS "alertId", patient_id AS "patientId", medicine_name AS "medicineName",
               dosage, frequency, scheduled_time AS "scheduledTime", status`,
    values
  );

  if (!alert) throw new AppError('Alert not found', 404);

  res.json({ success: true, message: 'Medication alert updated', data: alert, timestamp: new Date().toISOString() });
};

// ─── DELETE /api/alerts/:alertId  [PATIENT] ──────────────────────────────────
export const deleteAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  const { alertId } = req.params;
  const patientId = req.user!.userId;

  await query('DELETE FROM medication_alerts WHERE alert_id = $1 AND patient_id = $2', [alertId, patientId]);

  res.json({ success: true, message: 'Alert deleted', timestamp: new Date().toISOString() });
};

// ─── POST /api/alerts/:alertId/taken  [PATIENT] ──────────────────────────────
export const markDoseTaken = async (req: AuthRequest, res: Response): Promise<void> => {
  const { alertId } = req.params;
  const patientId = req.user!.userId;
  const takenDate = req.body.date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const slotName = req.body.slotName || 'Morning';

  // Verify alert belongs to patient
  const alert = await queryOne(
    'SELECT alert_id FROM medication_alerts WHERE alert_id = $1 AND patient_id = $2',
    [alertId, patientId]
  );
  if (!alert) throw new AppError('Alert not found', 404);

  const [log] = await query(
    `INSERT INTO dose_logs (log_id, alert_id, patient_id, taken_date, slot_name)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (alert_id, taken_date, slot_name) DO UPDATE SET taken_at = CURRENT_TIMESTAMP
     RETURNING log_id AS "logId", alert_id AS "alertId", taken_date AS "takenDate", slot_name AS "slotName", taken_at AS "takenAt"`,
    [uuidv4(), alertId, patientId, takenDate, slotName]
  );

  res.status(201).json({ success: true, message: 'Dose marked as taken', data: log, timestamp: new Date().toISOString() });
};

// ─── GET /api/alerts/dose-logs  [PATIENT] ────────────────────────────────────
export const getDoseLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = req.user!.userId;
  const days = parseInt(req.query.days as string) || 7;

  const logs = await query(
    `SELECT dl.log_id AS "logId", dl.alert_id AS "alertId", dl.taken_date AS "takenDate",
            dl.slot_name AS "slotName", dl.taken_at AS "takenAt", ma.medicine_name AS "medicineName", ma.dosage
     FROM dose_logs dl
     JOIN medication_alerts ma ON ma.alert_id = dl.alert_id
     WHERE dl.patient_id = $1 AND dl.taken_date >= CURRENT_DATE - $2::int
     ORDER BY dl.taken_date DESC, ma.medicine_name ASC`,
    [patientId, days]
  );

  res.json({ success: true, message: 'Dose logs retrieved', data: logs, timestamp: new Date().toISOString() });
};

