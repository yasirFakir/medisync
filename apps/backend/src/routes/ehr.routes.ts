import { Router } from 'express';
import * as ehrController from '../controllers/ehr.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import Joi from 'joi';

const router = Router();

const otpRequestSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  otpToken: Joi.string().length(6).required(),
});

const createRecordSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  diagnosis: Joi.string().required(),
  observations: Joi.string().required(),
  followUpDate: Joi.string().isoDate().optional(),
  prescriptionId: Joi.string().uuid().optional(),
});

// POST /api/ehr/request-access  — Doctor requests OTP-gated access [DOCTOR]
router.post(
  '/request-access',
  authenticate,
  authorize('DOCTOR'),
  validateBody(otpRequestSchema),
  ehrController.requestAccess
);

// POST /api/ehr/records  — Doctor creates EHR entry [DOCTOR]
router.post(
  '/records',
  authenticate,
  authorize('DOCTOR'),
  validateBody(createRecordSchema),
  ehrController.createRecord
);

// GET /api/ehr/records/:patientId  — Get patient's EHR [PATIENT, DOCTOR, ADMIN]
router.get(
  '/records/:patientId',
  authenticate,
  authorize('PATIENT', 'DOCTOR', 'ADMIN'),
  ehrController.getPatientRecords
);

// POST /api/ehr/generate-otp  — Patient generates OTP token [PATIENT]
router.post(
  '/generate-otp',
  authenticate,
  authorize('PATIENT'),
  ehrController.generateOtp
);

export default router;
