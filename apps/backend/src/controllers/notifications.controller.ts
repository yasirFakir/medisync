import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { registerClient } from '../services/notification.service';
import { logger } from '../config/logger';

/**
 * GET /api/notifications/stream
 * Opens a persistent SSE channel for the authenticated user.
 * The client must include a valid Authorization header (JWT).
 */
export const sseStream = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  logger.info(`SSE stream requested by userId=${userId}`);
  registerClient(userId, res);
  // Connection stays open — do not call res.end() here
};
