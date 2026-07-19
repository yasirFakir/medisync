import { Router } from 'express';
import * as alertsController from '../controllers/alerts.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import Joi from 'joi';

const router = Router();

const createAlertSchema = Joi.object({
  medicineName: Joi.string().required(),
  dosage: Joi.string().required(),
  frequency: Joi.string().required(),
  scheduledTime: Joi.string().required(), // HH:mm format
});

// POST /api/alerts  [PATIENT]
router.post(
  '/',
  authenticate,
  authorize('PATIENT'),
  validateBody(createAlertSchema),
  alertsController.createAlert
);

// GET /api/alerts  [PATIENT]
router.get('/', authenticate, authorize('PATIENT'), alertsController.getMyAlerts);

// PATCH /api/alerts/:alertId  — Update status [PATIENT]
router.patch('/:alertId', authenticate, authorize('PATIENT'), alertsController.updateAlertStatus);

// DELETE /api/alerts/:alertId  [PATIENT]
router.delete('/:alertId', authenticate, authorize('PATIENT'), alertsController.deleteAlert);

export default router;
