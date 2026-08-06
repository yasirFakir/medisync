import { Router } from 'express';
import * as alternativesController from '../controllers/alternatives.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateQuery } from '../middleware/validate.middleware';
import Joi from 'joi';

const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────
const alternativesQuerySchema = Joi.object({
  budget:     Joi.number().positive().optional(),
  dosageForm: Joi.string().max(100).optional(),
  strength:   Joi.string().max(50).optional(),
  limit:      Joi.number().integer().min(1).max(50).optional(),
});

const compareQuerySchema = Joi.object({
  ids: Joi.string()
    .pattern(/^[0-9a-fA-F-]+(,[0-9a-fA-F-]+)+$/)
    .required()
    .messages({
      'string.pattern.base': '"ids" must be comma-separated UUIDs (at least 2)',
    }),
});

// ─── Routes ────────────────────────────────────────────────────────────────────

// GET /api/alternatives/compare?ids=uuid1,uuid2 — side-by-side comparison
// NOTE: Must be registered BEFORE /:drugId to avoid "compare" matching as a param
router.get(
  '/compare',
  authenticate,
  validateQuery(compareQuerySchema),
  alternativesController.compareDrugs
);

// GET /api/alternatives/:drugId — find ranked alternatives for a drug
router.get(
  '/:drugId',
  authenticate,
  validateQuery(alternativesQuerySchema),
  alternativesController.getAlternatives
);

export default router;
