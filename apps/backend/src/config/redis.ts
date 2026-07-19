import IORedis from 'ioredis';
import { config } from './env';
import { logger } from './logger';

let redis: IORedis | null = null;

export const connectRedis = (): IORedis | null => {
  if (!config.redisUrl) {
    logger.warn('⚠️  REDIS_URL not configured — Redis features disabled');
    return null;
  }

  redis = new IORedis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableAutoPipelining: true,
  });

  redis.on('connect', () => logger.info('✅ Redis connection established'));
  redis.on('error', (err) => logger.error('Redis error:', err));

  return redis;
};

export const getRedis = (): IORedis | null => redis;

export const setCache = async (key: string, value: unknown, ttlSeconds = 300): Promise<void> => {
  if (!redis) return;
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  if (!redis) return null;
  const value = await redis.get(key);
  return value ? (JSON.parse(value) as T) : null;
};

export const deleteCache = async (key: string): Promise<void> => {
  if (!redis) return;
  await redis.del(key);
};
