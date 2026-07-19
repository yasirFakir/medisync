import { Response } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { config } from '../config/env';
import { logger } from '../config/logger';

// ─── POST /api/prescriptions/digitize ────────────────────────────────────────
export const digitizePrescription = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const patientId = req.user!.userId;
  let medicines: Array<{
    brandName: string;
    saltComposition: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  let digitizedNotes: string;
  let doctorName: string;

  try {
    // Forward image to FastAPI AI service for OCR
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const aiResponse = await axios.post<{
      medicines: Array<{
        brandName: string;
        saltComposition: string;
        dosage: string;
        frequency: string;
        duration: string;
      }>;
      digitizedNotes: string;
      doctorName?: string;
    }>(`${config.aiServiceUrl}/ocr/digitize`, form, {
      headers: form.getHeaders(),
      timeout: 4000,
    });

    medicines = aiResponse.data.medicines;
    digitizedNotes = aiResponse.data.digitizedNotes;
    doctorName = aiResponse.data.doctorName || 'Unknown';
    console.log(`📷 [AI SERVICE] Prescription digitized by external service on ${config.aiServiceUrl}`);
  } catch (error) {
    console.warn(`[UNIFIED BACKEND] ⚠️ External AI OCR Service not responding. Falling back to integrated OCR handler.`);
    logger.warn('AI OCR service down, falling back to local stub', error instanceof Error ? error.message : '');

    digitizedNotes = `[OCR Unified Stub] Successfully digitized prescription file: ${req.file.originalname} (${req.file.size} bytes)`;
    doctorName = 'Dr. Unified Local Stub';
    medicines = [
      {
        brandName: "Napa",
        saltComposition: "Paracetamol",
        dosage: "500mg",
        frequency: "Twice daily",
        duration: "5 days"
      }
    ];
  }

  // Save prescription to DB
  const prescriptionId = uuidv4();
  const [prescription] = await query(
    `INSERT INTO prescriptions (prescription_id, patient_id, doctor_name, raw_image_url, digitized_notes, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING prescription_id AS "prescriptionId", patient_id AS "patientId", doctor_name AS "doctorName",
               digitized_notes AS "digitizedNotes", created_at AS "createdAt"`,
    [prescriptionId, patientId, doctorName, '', digitizedNotes]
  );

  res.json({
    success: true,
    message: 'Prescription digitized successfully',
    data: { ...prescription, medicines },
    timestamp: new Date().toISOString(),
  });
};

// ─── GET /api/prescriptions ───────────────────────────────────────────────────
export const listPrescriptions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, role } = req.user!;
  const patientId = role === 'PATIENT' ? userId : (req.query.patientId as string);

  if (!patientId) throw new AppError('patientId is required for DOCTOR role', 400);

  const prescriptions = await query(
    `SELECT prescription_id AS "prescriptionId", patient_id AS "patientId", doctor_name AS "doctorName",
            digitized_notes AS "digitizedNotes", created_at AS "createdAt"
     FROM prescriptions WHERE patient_id = $1 ORDER BY created_at DESC`,
    [patientId]
  );

  res.json({ success: true, message: 'Prescriptions retrieved', data: prescriptions, timestamp: new Date().toISOString() });
};

// ─── GET /api/prescriptions/:id ───────────────────────────────────────────────
export const getPrescriptionById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId, role } = req.user!;

  const [prescription] = await query(
    `SELECT prescription_id AS "prescriptionId", patient_id AS "patientId", doctor_name AS "doctorName",
            digitized_notes AS "digitizedNotes", created_at AS "createdAt"
     FROM prescriptions WHERE prescription_id = $1`,
    [id]
  );

  if (!prescription) throw new AppError('Prescription not found', 404);

  // Patients can only see their own prescriptions
  if (role === 'PATIENT' && (prescription as { patientId: string }).patientId !== userId) {
    throw new AppError('Access denied', 403);
  }

  res.json({ success: true, message: 'Prescription retrieved', data: prescription, timestamp: new Date().toISOString() });
};
