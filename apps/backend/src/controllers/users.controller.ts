import { Response } from 'express';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── GET /api/users/me ────────────────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await queryOne(
    `SELECT user_id AS id, full_name AS "fullName", email, role, phone_number AS "phoneNumber", created_at AS "createdAt"
     FROM users WHERE user_id = $1`,
    [req.user!.userId]
  );

  if (!user) throw new AppError('User not found', 404);

  res.json({ success: true, message: 'User profile retrieved', data: user, timestamp: new Date().toISOString() });
};

// ─── PATCH /api/users/me ──────────────────────────────────────────────────────
export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const { fullName, phoneNumber } = req.body;

  const user = await queryOne(
    `UPDATE users SET full_name = COALESCE($1, full_name), phone_number = COALESCE($2, phone_number)
     WHERE user_id = $3
     RETURNING user_id AS id, full_name AS "fullName", email, role, phone_number AS "phoneNumber", created_at AS "createdAt"`,
    [fullName || null, phoneNumber || null, req.user!.userId]
  );

  res.json({ success: true, message: 'Profile updated', data: user, timestamp: new Date().toISOString() });
};

// ─── GET /api/users  [ADMIN] ──────────────────────────────────────────────────
export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '20', 10);
  const offset = (page - 1) * limit;

  const users = await query(
    `SELECT user_id AS id, full_name AS "fullName", email, role, phone_number AS "phoneNumber", created_at AS "createdAt"
     FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const [{ count }] = await query<{ count: string }>('SELECT COUNT(*) FROM users');

  res.json({
    success: true,
    message: 'Users retrieved',
    data: users,
    pagination: { page, limit, total: parseInt(count), totalPages: Math.ceil(parseInt(count) / limit) },
    timestamp: new Date().toISOString(),
  });
};

// ─── DELETE /api/users/:userId  [ADMIN] ────────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  await query('DELETE FROM users WHERE user_id = $1', [userId]);
  res.json({ success: true, message: 'User deleted', timestamp: new Date().toISOString() });
};
