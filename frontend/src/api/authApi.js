/**
 * authApi.js
 * API Service for Authentication & User Session Management
 */

import apiClient from './apiClient';

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('nivara_user');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

export const isAuthenticated = () => {
  return localStorage.getItem('nivara_auth') === 'true' && !!localStorage.getItem('nivara_token');
};

export const formatRoleName = (role = '') => {
  const roleMap = {
    'SUPER_ADMIN': 'Super Administrator',
    'IPMD_ADMIN': 'IPMD Central Admin',
    'MINISTRY_OFFICER': 'Line Ministry Officer',
    'MINISTRY_ADMIN': 'Ministry Administrator',
    'IMPLEMENTATION_AGENCY': 'Implementing Agency',
    'AGENCY_ADMIN': 'Agency Administrator',
    'NODAL_OFFICER': 'Nodal Officer',
    'REPORTING_OFFICER': 'Field Reporting Officer'
  };
  return roleMap[role] || (role ? role.replace(/_/g, ' ') : 'Central Sector Officer');
};

export const authApi = {
  login: async (email, password) => {
    const data = await apiClient.post('/api/auth/login', {
      officialEmail: email,
      email,
      password
    });
    if (data && data.data && data.data.accessToken) {
      localStorage.setItem('nivara_token', data.data.accessToken);
      if (data.data.refreshToken) {
        localStorage.setItem('nivara_refresh_token', data.data.refreshToken);
      }
      localStorage.setItem('nivara_user', JSON.stringify(data.data.user));
      localStorage.setItem('nivara_auth', 'true');
    }
    return data;
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('nivara_refresh_token');
      await apiClient.post('/api/auth/logout', { refreshToken });
    } catch (_) {
      // ignore logout errors if session already ended
    } finally {
      localStorage.removeItem('nivara_token');
      localStorage.removeItem('nivara_refresh_token');
      localStorage.removeItem('nivara_user');
      localStorage.removeItem('nivara_auth');
    }
  },

  getCurrentUser: async () => {
    return apiClient.get('/api/auth/me');
  },

  getStoredUser,
  isAuthenticated,
  formatRoleName
};

export default authApi;
