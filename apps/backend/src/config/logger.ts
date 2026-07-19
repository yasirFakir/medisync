import winston from 'winston';
import { config } from './env';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const consoleFormat = combine(
  colorize(),
  winston.format.printf(({ level, message }) => `${level}: ${message}`)
);

export const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), json())
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: combine(timestamp(), errors({ stack: true }), json())
    }),
    new winston.transports.Console({
      format: consoleFormat,
    })
  ],
});
