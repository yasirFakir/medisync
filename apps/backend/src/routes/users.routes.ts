import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// GET /api/users/me
router.get('/me', authenticate, usersController.getMe);

// PATCH /api/users/me
router.patch('/me', authenticate, usersController.updateMe);

// GET /api/users  [ADMIN, DOCTOR]
router.get('/', authenticate, authorize('ADMIN', 'DOCTOR'), usersController.listUsers);

// DELETE /api/users/:userId  [ADMIN only]
router.delete('/:userId', authenticate, authorize('ADMIN'), usersController.deleteUser);

export default router;
