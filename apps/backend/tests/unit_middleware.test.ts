import { describe, test, expect } from './runner';
import { authenticate, authorize, AuthRequest } from '../src/middleware/auth.middleware';
import { AppError } from '../src/middleware/errorHandler';
import { validateBody, validateQuery } from '../src/middleware/validate.middleware';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';
import Joi from 'joi';

export async function runMiddlewareTests() {
  await describe('Middleware & Security Layer (Unit Tests)', async () => {
    await test('authenticate middleware throws 401 if header is missing', () => {
      const req: any = { headers: {} };
      const res: any = {};
      const next: any = () => {};

      expect(() => authenticate(req, res, next)).toThrow('No authentication token provided');
    });

    await test('authenticate middleware throws 401 if token is invalid or expired', () => {
      const req: any = { headers: { authorization: 'Bearer invalid.token.value' } };
      const res: any = {};
      const next: any = () => {};

      expect(() => authenticate(req, res, next)).toThrow('Invalid or expired token');
    });

    await test('authenticate middleware attaches decoded user on valid token', () => {
      const token = jwt.sign(
        { userId: 'u-123', role: 'DOCTOR', email: 'doc@example.com' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );
      const req: any = { headers: { authorization: `Bearer ${token}` } };
      const res: any = {};
      let nextCalled = false;
      const next: any = () => { nextCalled = true; };

      authenticate(req, res, next);
      expect(nextCalled).toBe(true);
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('u-123');
      expect(req.user.role).toBe('DOCTOR');
    });

    await test('authorize middleware rejects unauthorized roles with 403', () => {
      const authDoctor = authorize('DOCTOR', 'ADMIN');
      const req: any = { user: { userId: 'u-patient', role: 'PATIENT' } };
      const res: any = {};
      const next: any = () => {};

      expect(() => authDoctor(req, res, next)).toThrow('Access denied');
    });

    await test('authorize middleware permits authorized roles', () => {
      const authDoctor = authorize('DOCTOR', 'ADMIN');
      const req: any = { user: { userId: 'u-admin', role: 'ADMIN' } };
      const res: any = {};
      let nextCalled = false;
      const next: any = () => { nextCalled = true; };

      authDoctor(req, res, next);
      expect(nextCalled).toBe(true);
    });

    await test('validateBody strips unknown properties and validates required schemas', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().min(0).required(),
      });
      const validator = validateBody(schema);
      const req: any = { body: { name: 'Alice', age: 25, extraIgnored: true } };
      const res: any = {};
      let nextCalled = false;
      const next: any = () => { nextCalled = true; };

      validator(req, res, next);
      expect(nextCalled).toBe(true);
      expect(req.body.name).toBe('Alice');
      expect(req.body.age).toBe(25);
      expect(req.body.extraIgnored).toBeUndefined(); // stripped
    });

    await test('validateBody rejects invalid body payload with 422', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
      });
      const validator = validateBody(schema);
      const req: any = { body: { email: 'not-an-email' } };
      const res: any = {};
      const next: any = () => {};

      expect(() => validator(req, res, next)).toThrow('Validation error');
    });
  });
}
