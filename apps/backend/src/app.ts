import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { config } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

import path from 'path';
import http from 'http';

// ─── Route Imports ────────────────────────────────────────────────────────────
import authRouter from './routes/auth.routes';
import drugsRouter from './routes/drugs.routes';
import inventoryRouter from './routes/inventory.routes';
import prescriptionsRouter from './routes/prescriptions.routes';
import ehrRouter from './routes/ehr.routes';
import triageRouter from './routes/triage.routes';
import alertsRouter from './routes/alerts.routes';
import usersRouter from './routes/users.routes';
import alternativesRouter from './routes/alternatives.routes';
import pharmaciesRouter from './routes/pharmacies.routes';
import availabilityRouter from './routes/availability.routes';
import appointmentsRouter from './routes/appointments.routes';
import pharmacyRouter from './routes/pharmacy.routes';
import adminRouter from './routes/admin.routes';

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development ports 3000, 3100, 3101, 3102, 3103, etc.
      if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.nodeEnv === 'development',
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
morgan.token('remote-port', (req) => {
  return req.socket.remotePort?.toString() || '';
});
morgan.token('status-text', (_req, res) => {
  return http.STATUS_CODES[res.statusCode] || '';
});

app.use(
  morgan(
    'INFO:     :remote-addr::remote-port - ":method :url HTTP/:http-version" :status :status-text'
  )
);

// ─── Serve React Static Files ─────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'MediSync AI Backend is operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/drugs', drugsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/alternatives', alternativesRouter);
app.use('/api/pharmacies', pharmaciesRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/ehr', ehrRouter);
app.use('/api/triage', triageRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/pharmacy', pharmacyRouter);
app.use('/api/admin', adminRouter);

// ─── SPA Route Fallback ───────────────────────────────────────────────────────
app.get('*', (req, res, next) => {
  // If the request points to /api, pass it to notFound error middlewares
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
