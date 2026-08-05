import { Router } from 'express';
import * as triageController from '../controllers/triage.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import Joi from 'joi';

const router = Router();

const chatSchema = Joi.object({
  sessionId: Joi.string().uuid().optional(),
  symptoms: Joi.array().items(Joi.string()).min(1).required(),
  additionalNotes: Joi.string().optional(),
  conversationHistory: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid('user', 'assistant').required(),
        content: Joi.string().required(),
        timestamp: Joi.string().required(),
      })
    )
    .optional(),
});

// POST /api/triage/chat  [PATIENT]
router.post(
  '/chat',
  authenticate,
  authorize('PATIENT'),
  validateBody(chatSchema),
  triageController.chat
);

// GET /api/triage/sessions  — Patient's chat history [PATIENT]
router.get(
  '/sessions',
  authenticate,
  authorize('PATIENT'),
  triageController.getSessions
);

// DELETE /api/triage/sessions/:sessionId  — Delete triage session history [PATIENT]
router.delete(
  '/sessions/:sessionId',
  authenticate,
  authorize('PATIENT'),
  triageController.deleteSession
);

export default router;
