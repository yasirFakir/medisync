import { Router } from 'express';
import * as drugsController from '../controllers/drugs.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateQuery } from '../middleware/validate.middleware';
import Joi from 'joi';

const router = Router();

const substituteQuerySchema = Joi.object({
  saltComposition: Joi.string().required(),
  budget: Joi.number().optional(),
});

// GET /api/drugs/substitutes?saltComposition=Paracetamol
router.get(
  '/substitutes',
  authenticate,
  validateQuery(substituteQuerySchema),
  drugsController.getSubstitutes
);

// GET /api/drugs — list master drug catalogue
router.get('/', authenticate, drugsController.listDrugs);

// GET /api/drugs/:drugId
router.get('/:drugId', authenticate, drugsController.getDrugById);

export default router;
