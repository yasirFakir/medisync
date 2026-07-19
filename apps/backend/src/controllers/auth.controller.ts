import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { setCache, getCache, deleteCache } from '../config/redis';
import { AuthTokenPayload, UserProfile } from '@medisync/shared-types';
import { logger } from '../config/logger';

const SALT_ROUNDS = 12;

const signTokens = (payload: Omit<AuthTokenPayload, 'iat' | 'exp'>) => {
  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign({ userId: payload.userId }, config.jwtSecret, {
    expiresIn: config.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
  return { accessToken, refreshToken };
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  const { fullName, email, password, role, phoneNumber } = req.body;

  console.log(`[BACKEND AUTH] 📝 Registration attempt received for email: ${email} [Role: ${role}]`);
  logger.info(`📝 Registration attempt received for email: ${email} [Role: ${role}]`);

  // Check duplicate email
  const existing = await queryOne('SELECT user_id FROM users WHERE email = $1', [email]);
  if (existing) {
    console.warn(`[BACKEND AUTH] ❌ Registration failed: ${email} is already registered`);
    logger.warn(`❌ Registration failed: ${email} is already registered`);
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await query<UserProfile & { user_id: string }>(
    `INSERT INTO users (user_id, email, password_hash, role, full_name, phone_number)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING user_id AS id, full_name AS "fullName", email, role, phone_number AS "phoneNumber", created_at AS "createdAt"`,
    [uuidv4(), email, passwordHash, role, fullName, phoneNumber || null]
  );

  const { accessToken, refreshToken } = signTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Cache refresh token
  await setCache(`refresh:${user.id}`, refreshToken, 30 * 24 * 60 * 60);

  console.log(`[BACKEND AUTH] ✅ Registration successful for user: ${email} [Role: ${role}]`);
  logger.info(`✅ Registration successful for user: ${email} [Role: ${role}]`);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { accessToken, refreshToken, user },
    timestamp: new Date().toISOString(),
  });
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  console.log(`[BACKEND AUTH] 🔑 Login attempt received for email: ${email}`);
  logger.info(`🔑 Login attempt received for email: ${email}`);

  const user = await queryOne<{
    user_id: string;
    email: string;
    password_hash: string;
    role: string;
    full_name: string;
    phone_number: string;
    created_at: string;
  }>('SELECT * FROM users WHERE email = $1', [email]);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    console.warn(`[BACKEND AUTH] ❌ Login failed for email: ${email} - Invalid credentials`);
    logger.warn(`❌ Login failed for email: ${email} - Invalid credentials`);
    throw new AppError('Invalid email or password', 401);
  }

  const payload: Omit<AuthTokenPayload, 'iat' | 'exp'> = {
    userId: user.user_id,
    email: user.email,
    role: user.role as AuthTokenPayload['role'],
  };

  const { accessToken, refreshToken } = signTokens(payload);
  await setCache(`refresh:${user.user_id}`, refreshToken, 30 * 24 * 60 * 60);

  console.log(`[BACKEND AUTH] ✅ Login successful for email: ${email} [Role: ${user.role}]`);
  logger.info(`✅ Login successful for email: ${email} [Role: ${user.role}]`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phone_number,
        createdAt: user.created_at,
      },
    },
    timestamp: new Date().toISOString(),
  });
};

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken: token } = req.body;

  let decoded: { userId: string };
  try {
    decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const cached = await getCache<string>(`refresh:${decoded.userId}`);
  if (!cached || cached !== token) {
    throw new AppError('Refresh token has been revoked', 401);
  }

  const user = await queryOne<{
    user_id: string;
    email: string;
    role: string;
  }>('SELECT user_id, email, role FROM users WHERE user_id = $1', [decoded.userId]);

  if (!user) throw new AppError('User not found', 404);

  const { accessToken, refreshToken: newRefresh } = signTokens({
    userId: user.user_id,
    email: user.email,
    role: user.role as AuthTokenPayload['role'],
  });

  await setCache(`refresh:${user.user_id}`, newRefresh, 30 * 24 * 60 * 60);

  res.json({
    success: true,
    message: 'Token refreshed',
    data: { accessToken, refreshToken: newRefresh },
    timestamp: new Date().toISOString(),
  });
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
      await deleteCache(`refresh:${decoded.userId}`);
    } catch {
      // Silently fail — token already expired or invalid
    }
  }
  res.json({ success: true, message: 'Logged out successfully', timestamp: new Date().toISOString() });
};
