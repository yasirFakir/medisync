import { Router } from 'express';
import * as availabilityController from '../controllers/availability.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateQuery } from '../middleware/validate.middleware';
import Joi from 'joi';

const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────
const batchCheckSchema = Joi.object({
  drugIds: Joi.string()
    .pattern(/^[0-9a-fA-F-]+(,[0-9a-fA-F-]+)*$/)
    .required()
    .messages({
      'string.pattern.base': '"drugIds" must be comma-separated UUIDs',
    }),
});

// ─── Routes ────────────────────────────────────────────────────────────────────

// GET /api/availability/check?drugIds=uuid1,uuid2 — batch check (before /:drugId)
router.get(
  '/check',
  authenticate,
  validateQuery(batchCheckSchema),
  availabilityController.batchCheckAvailability
);

// POST /api/availability/search-prescription — prescription & multi-drug matching across pharmacies
router.post(
  '/search-prescription',
  authenticate,
  availabilityController.searchPrescriptionAvailability
);

// GET /api/availability/:drugId — detailed availability for a single drug
router.get(
  '/:drugId',
  authenticate,
  availabilityController.getAvailability
);

export default router;
