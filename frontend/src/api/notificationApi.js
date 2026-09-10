import apiClient from './apiClient';

export const notificationApi = {
  getUserNotifications: async () => {
    return apiClient.get('/api/notifications');
  },

  markAsRead: async (id) => {
    return apiClient.patch(`/api/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    return apiClient.patch('/api/notifications/read-all');
  }
};

export default notificationApi;
