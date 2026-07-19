import { Pool } from 'pg';
import { config } from './env';
import { logger } from './logger';

export const db = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

db.on('error', (err) => {
  logger.error('Unexpected DB pool error', err);
});

export const connectDB = async (): Promise<void> => {
  const client = await db.connect();
  client.release();
  logger.info('✅ PostgreSQL connection established');
};

/**
 * Execute a query with optional parameters.
 * @param text SQL query string
 * @param params Query parameters
 */
export const query = async <T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> => {
  const start = Date.now();
  const result = await db.query(text, params);
  const duration = Date.now() - start;
  logger.debug(`Query executed in ${duration}ms: ${text.substring(0, 80)}`);
  return result.rows as T[];
};

export const queryOne = async <T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> => {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
};
