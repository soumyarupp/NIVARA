import { Router } from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getUserNotifications);
router.patch('/:id/read', markNotificationAsRead);
router.patch('/read-all', markAllAsRead);

export default router;
