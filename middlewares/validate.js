import { validationResult } from 'express-validator';
import { sendError } from '../utils/response.js';

/**
 * Validate Request
 * Middleware to check validation errors from express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return sendError(res, 400, 'Validation failed', extractedErrors);
  }
  
  next();
};
