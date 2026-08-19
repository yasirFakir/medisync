import { Response } from 'express';
import { logger } from '../config/logger';
import crypto from 'crypto';

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotificationType =
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_REQUEST'
  | 'EHR_RECORD_ADDED'
  | 'MEDICATION_REMINDER'
  | 'LOW_STOCK_ALERT'
  | 'NEW_USER_REGISTERED'
  | 'NEW_PHARMACY_REGISTERED'
  | 'GENERAL';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

// ─── SSE Connection Registry ──────────────────────────────────────────────────
// Map: userId → Response (SSE stream)
const clients = new Map<string, Response>();

/**
 * Registers an SSE stream for a user.
 * Sets necessary headers and flushes the connection-open comment.
 */
export const registerClient = (userId: string, res: Response): void => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Heartbeat every 25 seconds to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': heartbeat\n\n');
    } else {
      clearInterval(heartbeat);
    }
  }, 25000);

  clients.set(userId, res);
  logger.info(`SSE: client connected [userId=${userId}] — total=${clients.size}`);

  res.write(': connected\n\n');

  res.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(userId);
    logger.info(`SSE: client disconnected [userId=${userId}] — total=${clients.size}`);
  });
};

/**
 * Sends a notification to a specific user via SSE.
 * Silently succeeds if the user is not connected.
 */
export const sendNotification = (userId: string, notification: Omit<Notification, 'id' | 'createdAt'>): void => {
  const res = clients.get(userId);
  if (!res || res.writableEnded) return;

  const payload: Notification = {
    ...notification,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  try {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    logger.debug(`SSE: notification dispatched to [userId=${userId}] type=${notification.type}`);
  } catch (err) {
    logger.warn(`SSE: failed to write to [userId=${userId}]: ${err}`);
    clients.delete(userId);
  }
};

/**
 * Broadcasts a notification to all connected users with a specific role.
 * `roleMap` is a Map of userId → role string.
 */
export const broadcastToRole = (
  roleMap: Map<string, string>,
  targetRole: string,
  notification: Omit<Notification, 'id' | 'createdAt'>
): void => {
  for (const [userId, role] of roleMap.entries()) {
    if (role === targetRole) {
      sendNotification(userId, notification);
    }
  }
};

/**
 * Returns the number of currently connected SSE clients.
 */
export const connectedClientCount = (): number => clients.size;
