import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate.middleware';
import Joi from 'joi';

const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('PATIENT', 'DOCTOR', 'PHARMACY', 'ADMIN').default('PATIENT'),
  phoneNumber: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// ─── Routes ────────────────────────────────────────────────────────────────────
// POST /api/auth/register
router.post('/register', validateBody(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), authController.login);

// POST /api/auth/refresh
router.post('/refresh', validateBody(refreshSchema), authController.refreshToken);

// POST /api/auth/logout
router.post('/logout', authController.logout);

export default router;
