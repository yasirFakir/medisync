import { Router } from 'express';
import * as pharmacyController from '../controllers/pharmacy.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import Joi from 'joi';

const router = Router();

const otpVerifySchema = Joi.object({
  patientId: Joi.string().uuid().optional(),
  patientEmail: Joi.string().email().optional(),
  otpToken: Joi.string().length(6).optional(),
  otp: Joi.string().length(6).optional(),
}).or('patientId', 'patientEmail').or('otpToken', 'otp');

const createSaleSchema = Joi.object({
  patientId: Joi.string().uuid().optional(),
  prescriptionId: Joi.string().uuid().optional(),
  customerName: Joi.string().max(150).optional(),
  paymentMethod: Joi.string().valid('CASH', 'CARD', 'BKASH', 'NAGAD', 'ROCKET').required(),
  discountAmount: Joi.number().min(0).optional(),
  taxAmount: Joi.number().min(0).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        inventoryId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required(),
        durationDays: Joi.number().integer().min(1).optional(),
        dosageSchedule: Joi.string().max(20).optional(),
      })
    )
    .min(1)
    .required(),
});

// POST /api/pharmacy/verify-prescription-otp  [PHARMACY]
router.post(
  '/verify-prescription-otp',
  authenticate,
  authorize('PHARMACY'),
  validateBody(otpVerifySchema),
  pharmacyController.verifyPrescriptionOtp
);

// GET /api/pharmacy/prescriptions/:patientId  [PHARMACY]
router.get(
  '/prescriptions/:patientId',
  authenticate,
  authorize('PHARMACY'),
  pharmacyController.getPatientPrescriptions
);

// POST /api/pharmacy/sales  [PHARMACY]
router.post(
  '/sales',
  authenticate,
  authorize('PHARMACY'),
  validateBody(createSaleSchema),
  pharmacyController.createSale
);

// GET /api/pharmacy/sales  [PHARMACY]
router.get(
  '/sales',
  authenticate,
  authorize('PHARMACY'),
  pharmacyController.listSales
);

// GET /api/pharmacy/sales/summary  [PHARMACY]
router.get(
  '/sales/summary',
  authenticate,
  authorize('PHARMACY'),
  pharmacyController.getSalesSummary
);

// GET /api/pharmacy/sales/analytics  [PHARMACY]
router.get(
  '/sales/analytics',
  authenticate,
  authorize('PHARMACY'),
  pharmacyController.getSalesAnalytics
);

// GET /api/pharmacy/sales/:saleId  [PHARMACY]
router.get(
  '/sales/:saleId',
  authenticate,
  authorize('PHARMACY'),
  pharmacyController.getSaleById
);

export default router;
