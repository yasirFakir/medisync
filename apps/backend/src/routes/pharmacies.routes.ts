import { Router } from 'express';
import * as pharmaciesController from '../controllers/pharmacies.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateQuery } from '../middleware/validate.middleware';
import Joi from 'joi';

const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────
const listQuerySchema = Joi.object({
  page:     Joi.number().integer().min(1).optional(),
  limit:    Joi.number().integer().min(1).max(50).optional(),
  city:     Joi.string().max(100).optional(),
  verified: Joi.string().valid('true', 'false').optional(),
});

const searchQuerySchema = Joi.object({
  q:     Joi.string().min(1).required(),
  page:  Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
});

// ─── Routes ────────────────────────────────────────────────────────────────────

// GET /api/pharmacies/search?q=  — must be before /:pharmacyId
router.get(
  '/search',
  authenticate,
  validateQuery(searchQuerySchema),
  pharmaciesController.searchPharmacies
);

// GET /api/pharmacies — list with optional filters
router.get(
  '/',
  authenticate,
  validateQuery(listQuerySchema),
  pharmaciesController.listPharmacies
);

// GET /api/pharmacies/:pharmacyId — single pharmacy detail
router.get(
  '/:pharmacyId',
  authenticate,
  pharmaciesController.getPharmacyById
);

export default router;
