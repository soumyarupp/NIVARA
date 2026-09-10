import apiClient from './apiClient';

export const ministryApi = {
  getMinistries: async () => {
    return apiClient.get('/api/ministries');
  },

  getMinistryById: async (id) => {
    return apiClient.get(`/api/ministries/${id}`);
  },

  createMinistry: async (data) => {
    return apiClient.post('/api/ministries', data);
  }
};

export default ministryApi;
