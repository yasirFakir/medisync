import { Router } from 'express';
import * as alertsController from '../controllers/alerts.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import Joi from 'joi';

const router = Router();

const createAlertSchema = Joi.object({
  medicineName: Joi.string().optional(),
  dosage: Joi.string().optional(),
  frequency: Joi.string().optional(),
  scheduledTime: Joi.string().optional(),
  alerts: Joi.array().items(
    Joi.object({
      medicineName: Joi.string().required(),
      dosage: Joi.string().allow('', null).optional(),
      frequency: Joi.string().allow('', null).optional(),
      scheduledTime: Joi.string().allow('', null).optional(),
    })
  ).optional(),
}).or('medicineName', 'alerts');

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

// GET /api/alerts/dose-logs  [PATIENT]  — MUST be before /:alertId routes
router.get('/dose-logs', authenticate, authorize('PATIENT'), alertsController.getDoseLogs);

// POST /api/alerts/:alertId/taken  [PATIENT]
router.post('/:alertId/taken', authenticate, authorize('PATIENT'), alertsController.markDoseTaken);

// PATCH /api/alerts/:alertId  — Update fields & status [PATIENT]
router.patch('/:alertId', authenticate, authorize('PATIENT'), alertsController.updateAlert);

// DELETE /api/alerts/:alertId  [PATIENT]
router.delete('/:alertId', authenticate, authorize('PATIENT'), alertsController.deleteAlert);

export default router;
