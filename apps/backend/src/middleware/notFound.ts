import { Request, Response, NextFunction } from 'express';

export const notFound = (_req: Request, res: Response, _next: NextFunction): void => {
  const { logger } = require('../config/logger');
  logger.warn(`404 Not Found: ${_req.method} ${_req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${_req.method} ${_req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
};
