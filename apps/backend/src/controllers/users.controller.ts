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

// ─── GET /api/users  [ADMIN / DOCTOR] ─────────────────────────────────────────
export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);
  const roleFilter = req.query.role as string | undefined;
  const search = req.query.search as string | undefined;
  const offset = (page - 1) * limit;

  let queryStr = `
    SELECT 
      u.user_id AS id, 
      u.full_name AS "fullName", 
      u.email, 
      u.role, 
      u.phone_number AS "phoneNumber", 
      u.created_at AS "createdAt",
      (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = u.user_id) AS "totalAppointments",
      (SELECT diagnosis FROM ehr_records r WHERE r.patient_id = u.user_id ORDER BY r.session_date DESC LIMIT 1) AS "lastDiagnosis"
    FROM users u
  `;

  const whereClauses: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (roleFilter) {
    whereClauses.push(`u.role = $${paramIdx++}`);
    params.push(roleFilter);
  }

  if (search) {
    whereClauses.push(`(LOWER(u.full_name) LIKE $${paramIdx} OR LOWER(u.email) LIKE $${paramIdx} OR LOWER(COALESCE(u.phone_number, '')) LIKE $${paramIdx})`);
    params.push(`%${search.toLowerCase()}%`);
    paramIdx++;
  }

  if (whereClauses.length > 0) {
    queryStr += ` WHERE ` + whereClauses.join(' AND ');
  }

  queryStr += ` ORDER BY u.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(limit, offset);

  const users = await query(queryStr, params);

  // Count total matching
  let countQuery = `SELECT COUNT(*) FROM users u`;
  if (whereClauses.length > 0) {
    countQuery += ` WHERE ` + whereClauses.join(' AND ');
  }
  const countParams = params.slice(0, paramIdx - 3);
  const [{ count }] = await query<{ count: string }>(countQuery, countParams);

  res.json({
    success: true,
    message: 'Users retrieved',
    data: users.map(u => ({
      ...u,
      totalAppointments: Number(u.totalAppointments || 0)
    })),
    pagination: { page, limit, total: parseInt(count || '0', 10), totalPages: Math.ceil(parseInt(count || '0', 10) / limit) },
    timestamp: new Date().toISOString(),
  });
};

// ─── DELETE /api/users/:userId  [ADMIN] ────────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  await query('DELETE FROM users WHERE user_id = $1', [userId]);
  res.json({ success: true, message: 'User deleted', timestamp: new Date().toISOString() });
};
