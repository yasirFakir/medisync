import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

import multer from 'multer';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed for avatars'));
      return;
    }
    cb(null, true);
  },
});

// GET /api/users/me
router.get('/me', authenticate, usersController.getMe);

// PATCH /api/users/me
router.patch('/me', authenticate, usersController.updateMe);

// POST /api/users/me/avatar
router.post('/me/avatar', authenticate, upload.single('avatar'), usersController.uploadAvatar);

// GET /api/users  [ADMIN, DOCTOR]
router.get('/', authenticate, authorize('ADMIN', 'DOCTOR'), usersController.listUsers);

// DELETE /api/users/:userId  [ADMIN only]
router.delete('/:userId', authenticate, authorize('ADMIN'), usersController.deleteUser);

export default router;
