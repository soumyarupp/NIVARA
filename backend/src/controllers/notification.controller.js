import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getUserNotifications(req, res) {
  try {
    const userId = req.user ? req.user._id || req.user.id : null;
    const query = userId ? { userId } : {};

    const notifications = await Notification.find(query)
      .populate('projectId', 'projectName projectCode')
      .populate('alertId')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = userId ? await Notification.countDocuments({ userId, isRead: false }) : 0;

    return sendSuccess(res, 'Notifications retrieved.', {
      notifications,
      unreadCount
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch notifications.', [], 500);
  }
}

export async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user._id || req.user.id : null;
    const filter = { _id: id };
    if (userId) filter.userId = userId;

    const notification = await Notification.findOneAndUpdate(
      filter,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return sendError(res, 'Notification not found.', [], 404);
    }

    return sendSuccess(res, 'Notification marked as read.', notification);
  } catch (err) {
    return sendError(res, err.message || 'Failed to mark notification as read.', [], 500);
  }
}

export async function markAllAsRead(req, res) {
  try {
    const userId = req.user ? req.user._id || req.user.id : null;
    const filter = userId ? { userId, isRead: false } : { isRead: false };

    await Notification.updateMany(filter, { isRead: true, readAt: new Date() });
    return sendSuccess(res, 'All notifications marked as read.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update notifications.', [], 500);
  }
}
