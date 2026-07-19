import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── POST /api/alerts  [PATIENT] ──────────────────────────────────────────────
export const createAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = req.user!.userId;
  const { medicineName, dosage, frequency, scheduledTime } = req.body;

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
export const updateAlertStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { alertId } = req.params;
  const { status } = req.body;
  const patientId = req.user!.userId;

  if (!['ACTIVE', 'SUSPENDED', 'ARCHIVED'].includes(status)) {
    throw new AppError('Invalid status value', 422);
  }

  const [alert] = await query(
    `UPDATE medication_alerts SET status = $1 WHERE alert_id = $2 AND patient_id = $3
     RETURNING alert_id AS "alertId", medicine_name AS "medicineName", status`,
    [status, alertId, patientId]
  );

  if (!alert) throw new AppError('Alert not found', 404);

  res.json({ success: true, message: 'Alert status updated', data: alert, timestamp: new Date().toISOString() });
};

// ─── DELETE /api/alerts/:alertId  [PATIENT] ──────────────────────────────────
export const deleteAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  const { alertId } = req.params;
  const patientId = req.user!.userId;

  await query('DELETE FROM medication_alerts WHERE alert_id = $1 AND patient_id = $2', [alertId, patientId]);

  res.json({ success: true, message: 'Alert deleted', timestamp: new Date().toISOString() });
};
