import { Router } from 'express';
import * as drugsController from '../controllers/drugs.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import Joi from 'joi';

const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────
const createDrugSchema = Joi.object({
  brandName:            Joi.string().min(1).max(255).required(),
  saltComposition:      Joi.string().min(1).max(255).required(),
  strength:             Joi.string().min(1).max(50).required(),
  dosageForm:           Joi.string().max(100).optional(),
  manufacturer:         Joi.string().max(255).optional(),
  uses:                 Joi.string().optional(),
  sideEffects:          Joi.string().optional(),
  contraindications:    Joi.string().optional(),
  drugInteractions:     Joi.string().optional(),
  storageInstructions:  Joi.string().optional(),
  prescriptionRequired: Joi.boolean().optional(),
  estimatedPrice:       Joi.number().positive().required(),
  isGeneric:            Joi.boolean().optional(),
  trustRating:          Joi.number().min(0).max(5).optional(),
});

const updateDrugSchema = Joi.object({
  brandName:            Joi.string().min(1).max(255).optional(),
  saltComposition:      Joi.string().min(1).max(255).optional(),
  strength:             Joi.string().min(1).max(50).optional(),
  dosageForm:           Joi.string().max(100).optional(),
  manufacturer:         Joi.string().max(255).optional(),
  uses:                 Joi.string().optional(),
  sideEffects:          Joi.string().optional(),
  contraindications:    Joi.string().optional(),
  drugInteractions:     Joi.string().optional(),
  storageInstructions:  Joi.string().optional(),
  prescriptionRequired: Joi.boolean().optional(),
  estimatedPrice:       Joi.number().positive().optional(),
  isGeneric:            Joi.boolean().optional(),
  trustRating:          Joi.number().min(0).max(5).optional(),
}).min(1);

const substituteQuerySchema = Joi.object({
  saltComposition: Joi.string().required(),
  budget:          Joi.number().optional(),
});

const searchQuerySchema = Joi.object({
  q:     Joi.string().min(1).required(),
  page:  Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
});

// ─── Routes ────────────────────────────────────────────────────────────────────
// GET /api/drugs/search?q=paracetamol  — must be before /:drugId
router.get('/search', authenticate, validateQuery(searchQuerySchema), drugsController.searchDrugs);

// GET /api/drugs/substitutes?saltComposition=Paracetamol
router.get('/substitutes', authenticate, validateQuery(substituteQuerySchema), drugsController.getSubstitutes);

// GET /api/drugs — list with optional ?search=
router.get('/', authenticate, drugsController.listDrugs);

// GET /api/drugs/:drugId
router.get('/:drugId', authenticate, drugsController.getDrugById);

// POST /api/drugs  [ADMIN only]
router.post('/', authenticate, authorize('ADMIN'), validateBody(createDrugSchema), drugsController.createDrug);

// PUT /api/drugs/:drugId  [ADMIN only]
router.put('/:drugId', authenticate, authorize('ADMIN'), validateBody(updateDrugSchema), drugsController.updateDrug);

// DELETE /api/drugs/:drugId  [ADMIN only]
router.delete('/:drugId', authenticate, authorize('ADMIN'), drugsController.deleteDrug);

export default router;
