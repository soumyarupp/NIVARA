import { Router } from 'express';
import {
  login,
  activate,
  getActivationPage,
  verifyInvite,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';
import {
  loginSchema,
  activateSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/auth.validator.js';

const router = Router();

router.post('/login', authRateLimiter, validate(loginSchema), login);

// Account Activation Routes (Both Web Page GET and API POST)
router.get('/activate', getActivationPage);
router.get('/verify-invite', verifyInvite);
router.post('/activate', validate(activateSchema), activate);

router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', authenticate, getMe);

export default router;
