import { Router } from 'express';
import * as ehrController from '../controllers/ehr.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import Joi from 'joi';

const router = Router();

const otpRequestSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  otpToken: Joi.string().length(6).optional(),
  otp: Joi.string().length(6).optional(),
}).or('otpToken', 'otp');

const createRecordSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  diagnosis: Joi.string().required(),
  observations: Joi.string().required(),
  followUpDate: Joi.string().isoDate().optional(),
  prescriptionId: Joi.string().uuid().optional(),
});

// POST /api/ehr/request-access & POST /api/ehr/verify-otp — Doctor requests OTP-gated access [DOCTOR, ADMIN]
router.post(
  '/request-access',
  authenticate,
  authorize('DOCTOR', 'ADMIN'),
  validateBody(otpRequestSchema),
  ehrController.requestAccess
);

router.post(
  '/verify-otp',
  authenticate,
  authorize('DOCTOR', 'ADMIN'),
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

// GET /api/ehr/records/my-sessions — Get my clinical session logs [PATIENT, DOCTOR, ADMIN]
router.get(
  '/records/my-sessions',
  authenticate,
  authorize('PATIENT', 'DOCTOR', 'ADMIN'),
  ehrController.getMySessions
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

// POST /api/ehr/send-otp  — Doctor/System triggers sending OTP email to patient [PATIENT, DOCTOR, ADMIN]
router.post(
  '/send-otp',
  authenticate,
  authorize('PATIENT', 'DOCTOR', 'ADMIN'),
  ehrController.sendPatientOtpEmail
);

export default router;
