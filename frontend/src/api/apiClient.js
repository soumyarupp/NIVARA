/**
 * apiClient.js
 * -------------------------------------------------------------------------------------
 * Centralized API client for NIVARA Infrastructure Platform.
 * Supports switching between Mock Demo Mode and Real Backend Mode via env variables.
 * -------------------------------------------------------------------------------------
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export const isMockMode = () => USE_MOCK_DATA;
export const getApiBaseUrl = () => API_BASE_URL;

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorText = await response.text();
      let errorJson = {};
      try { errorJson = JSON.parse(errorText); } catch (_) {}
      throw new Error(errorJson.message || `API Request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const apiClient = {
  get: (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
    return request(fullEndpoint, { method: 'GET' });
  },

  post: (endpoint, data = {}) => {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  put: (endpoint, data = {}) => {
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  delete: (endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  }
};

export default apiClient;
