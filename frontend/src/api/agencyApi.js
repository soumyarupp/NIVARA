import apiClient from './apiClient';

export const agencyApi = {
  getAgencies: async (params = {}) => {
    return apiClient.get('/api/agencies', params);
  },

  getAgencyById: async (id) => {
    return apiClient.get(`/api/agencies/${id}`);
  },

  createAgency: async (data) => {
    return apiClient.post('/api/agencies', data);
  },

  updateAgency: async (id, data) => {
    return apiClient.patch(`/api/agencies/${id}`, data);
  },

  updateAgencyStatus: async (id, status) => {
    return apiClient.patch(`/api/agencies/${id}/status`, { status });
  }
};

export default agencyApi;
