import apiClient from './apiClient';

export const notificationApi = {
  getNotifications: async () => {
    const res = await apiClient.get('/api/notifications');
    return res?.data || res;
  },

  getUserNotifications: async () => {
    const res = await apiClient.get('/api/notifications');
    return res?.data || res;
  },

  markAsRead: async (id) => {
    return apiClient.patch(`/api/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    return apiClient.patch('/api/notifications/read-all');
  }
};

export default notificationApi;
