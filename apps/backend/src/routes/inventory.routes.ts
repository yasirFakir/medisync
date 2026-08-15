import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import Joi from 'joi';

const router = Router();

const updateSchema = Joi.object({
  drugId: Joi.string().uuid().required(),
  inStock: Joi.boolean().optional(),
  price: Joi.number().positive().required(),
  costPrice: Joi.number().min(0).optional(),
  quantity: Joi.number().integer().min(0).optional(),
  batchNumber: Joi.string().max(50).allow('', null).optional(),
  expiryDate: Joi.string().isoDate().allow('', null).optional(),
  rackLocation: Joi.string().max(50).allow('', null).optional(),
  supplierName: Joi.string().max(100).allow('', null).optional(),
});

const bulkUpdateSchema = Joi.object({
  items: Joi.array().items(updateSchema).min(1).required(),
});

const locateQuerySchema = Joi.object({
  drugId: Joi.string().uuid().optional(),
  saltComposition: Joi.string().optional(),
  city: Joi.string().optional(),
}).or('drugId', 'saltComposition');

// POST /api/inventory/update  [PHARMACY]
router.post(
  '/update',
  authenticate,
  authorize('PHARMACY'),
  validateBody(updateSchema),
  inventoryController.updateInventory
);

// POST /api/inventory/bulk-update  [PHARMACY]
router.post(
  '/bulk-update',
  authenticate,
  authorize('PHARMACY'),
  validateBody(bulkUpdateSchema),
  inventoryController.bulkUpdateInventory
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

// GET /api/inventory/expiring-soon  [PHARMACY]
router.get(
  '/expiring-soon',
  authenticate,
  authorize('PHARMACY'),
  inventoryController.getExpiringSoon
);

// GET /api/inventory/low-stock  [PHARMACY]
router.get(
  '/low-stock',
  authenticate,
  authorize('PHARMACY'),
  inventoryController.getLowStock
);

// DELETE /api/inventory/:inventoryId  [PHARMACY]
router.delete(
  '/:inventoryId',
  authenticate,
  authorize('PHARMACY'),
  inventoryController.deleteInventoryItem
);

export default router;
