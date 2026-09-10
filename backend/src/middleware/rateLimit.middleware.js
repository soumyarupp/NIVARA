import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';

const authLimiterInstance = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many authentication requests from this IP. Please try again after 15 minutes.',
      [],
      429
    );
  }
});

const generalLimiterInstance = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Rate limit exceeded. Too many requests. Please try again later.',
      [],
      429
    );
  }
});

/**
 * Strict Rate Limiter for Authentication Endpoints (disabled or relaxed in development)
 */
export const authRateLimiter = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production' || env.NODE_ENV !== 'production') {
    return next();
  }
  return authLimiterInstance(req, res, next);
};

/**
 * General API Rate Limiter (disabled or relaxed in development)
 */
export const generalApiLimiter = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production' || env.NODE_ENV !== 'production') {
    return next();
  }
  return generalLimiterInstance(req, res, next);
};
