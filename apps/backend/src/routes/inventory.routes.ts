import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import Joi from 'joi';

const router = Router();

const updateSchema = Joi.object({
  drugId: Joi.string().uuid().required(),
  inStock: Joi.boolean().required(),
  price: Joi.number().positive().required(),
});

const locateQuerySchema = Joi.object({
  drugId: Joi.string().uuid().optional(),
  saltComposition: Joi.string().optional(),
  city: Joi.string().optional(),
}).or('drugId', 'saltComposition');

// POST /api/inventory/update  [PHARMACY only]
router.post(
  '/update',
  authenticate,
  authorize('PHARMACY'),
  validateBody(updateSchema),
  inventoryController.updateInventory
);

// GET /api/inventory/locate  [PATIENT, DOCTOR]
router.get(
  '/locate',
  authenticate,
  authorize('PATIENT', 'DOCTOR'),
  validateQuery(locateQuerySchema),
  inventoryController.locateMedicine
);

// GET /api/inventory/my-stock  [PHARMACY]
router.get(
  '/my-stock',
  authenticate,
  authorize('PHARMACY'),
  inventoryController.getMyStock
);

export default router;
