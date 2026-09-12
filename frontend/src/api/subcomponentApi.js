import apiClient, { getApiBaseUrl } from './apiClient';

export const subcomponentApi = {
  // Land Management
  getLandDetail: async (projectId) => {
    return apiClient.get(`/api/projects/${projectId}/land`);
  },
  upsertLandDetail: async (projectId, data) => {
    return apiClient.post(`/api/projects/${projectId}/land`, data);
  },

  // Clearances
  getClearances: async (projectId) => {
    return apiClient.get(`/api/projects/${projectId}/clearances`);
  },
  addClearance: async (projectId, data) => {
    return apiClient.post(`/api/projects/${projectId}/clearances`, data);
  },
  updateClearance: async (clearanceId, data) => {
    return apiClient.patch(`/api/clearances/${clearanceId}`, data);
  },
  deleteClearance: async (clearanceId) => {
    return apiClient.delete(`/api/clearances/${clearanceId}`);
  },

  // Tenders
  getTenders: async (projectId) => {
    return apiClient.get(`/api/projects/${projectId}/tenders`);
  },
  addTender: async (projectId, data) => {
    return apiClient.post(`/api/projects/${projectId}/tenders`, data);
  },

  // Milestones
  getMilestones: async (projectId) => {
    return apiClient.get(`/api/projects/${projectId}/milestones`);
  },
  addMilestone: async (projectId, data) => {
    return apiClient.post(`/api/projects/${projectId}/milestones`, data);
  },
  updateMilestone: async (milestoneId, data) => {
    return apiClient.patch(`/api/milestones/${milestoneId}`, data);
  },
  deleteMilestone: async (milestoneId) => {
    return apiClient.delete(`/api/milestones/${milestoneId}`);
  },

  // Partners
  getPartners: async (projectId) => {
    return apiClient.get(`/api/projects/${projectId}/partners`);
  },
  addPartner: async (projectId, data) => {
    return apiClient.post(`/api/projects/${projectId}/partners`, data);
  },

  // Documents
  getDocuments: async (projectId) => {
    return apiClient.get(`/api/projects/${projectId}/documents`);
  },
  uploadDocuments: async (projectId, formData) => {
    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('nivara_token');
    const response = await fetch(`${baseUrl}/api/projects/${projectId}/documents`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData,
      credentials: 'include'
    });
    if (!response.ok) {
      const errText = await response.text();
      let errJson = {};
      try { errJson = JSON.parse(errText); } catch (_) {}
      throw new Error(errJson.message || `File upload failed with status ${response.status}`);
    }
    return await response.json();
  }
};

export default subcomponentApi;
