import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sseStream } from '../controllers/notifications.controller';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config/env';
import { AuthTokenPayload } from '@medisync/shared-types';

const router = Router();

/**
 * SSE-compatible auth middleware.
 * Browser EventSource cannot send custom headers, so we accept the JWT
 * from either the Authorization header (standard) or a ?token= query param.
 * This fallback is scoped exclusively to the SSE stream route.
 */
const authenticateSSE = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const raw = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : (req.query.token as string | undefined);

  if (!raw) {
    throw new AppError('No authentication token provided', 401);
  }

  try {
    req.user = jwt.verify(raw, config.jwtSecret) as AuthTokenPayload;
    next();
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
};

// GET /api/notifications/stream — SSE endpoint (accepts token via header OR query param)
router.get('/stream', authenticateSSE, sseStream);

export default router;
