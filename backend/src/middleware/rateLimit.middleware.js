import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';

/**
 * Strict Rate Limiter for Authentication Endpoints (Login, Forgot Password)
 * Prevents brute-force credential stuffing and password reset spam.
 */
export const authRateLimiter = env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // Limit each IP to 10 requests per window
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

/**
 * General API Rate Limiter
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
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
