import apiClient from './apiClient';

export const userApi = {
  getUsers: async (params = {}) => {
    return apiClient.get('/api/users', params);
  },

  getUserById: async (id) => {
    return apiClient.get(`/api/users/${id}`);
  },

  createUser: async (userData) => {
    return apiClient.post('/api/users', userData);
  },

  inviteUser: async (userData) => {
    return apiClient.post('/api/users/invite', userData);
  },

  updateUser: async (id, userData) => {
    return apiClient.patch(`/api/users/${id}`, userData);
  },

  updateUserStatus: async (id, status) => {
    const statusStr = typeof status === 'boolean' ? (status ? 'ACTIVE' : 'DEACTIVATED') : status;
    return apiClient.patch(`/api/users/${id}/status`, { status: statusStr });
  },

  assignProject: async (userId, projectId) => {
    return apiClient.post(`/api/users/${userId}/assign-project`, { projectId });
  },

  removeProject: async (userId, projectId) => {
    return apiClient.delete(`/api/users/${userId}/project/${projectId}`);
  }
};

export default userApi;
