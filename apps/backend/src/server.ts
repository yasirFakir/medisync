import app from './app';
import { config } from './config/env';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './config/logger';

const bootstrap = async (): Promise<void> => {
  try {
    // Connect to databases
    await connectDB();
    connectRedis();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 MediSync Backend running on port ${config.port} [${config.nodeEnv}]`);
      logger.info(`📖 API Base URL: http://localhost:${config.port}/api`);
      logger.info(`❤️  Health check: http://localhost:${config.port}/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received — shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Fatal error during bootstrap:', error);
    process.exit(1);
  }
};

bootstrap();
