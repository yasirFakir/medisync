import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';

/**
 * Request body validation middleware factory.
 * @param schema Joi schema to validate against
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      throw new AppError(`Validation error: ${message}`, 422);
    }
    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, { abortEarly: false, allowUnknown: false });
    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      throw new AppError(`Query validation error: ${message}`, 422);
    }
    req.query = value;
    next();
  };
};
