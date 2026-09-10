/**
 * apiClient.js
 * -------------------------------------------------------------------------------------
 * Centralized API client for NIVARA Infrastructure Platform.
 * Supports switching between Mock Demo Mode and Real Backend Mode via env variables.
 * -------------------------------------------------------------------------------------
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const isMockMode = () => USE_MOCK_DATA;
export const getApiBaseUrl = () => API_BASE_URL;

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

async function performTokenRefresh() {
  const refreshToken = localStorage.getItem('nivara_refresh_token');
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      throw new Error(`Refresh failed with status ${response.status}`);
    }

    const resJson = await response.json();
    const newAccessToken = resJson?.data?.accessToken;
    const newRefreshToken = resJson?.data?.refreshToken;

    if (!newAccessToken) {
      throw new Error('Invalid refresh response payload');
    }

    localStorage.setItem('nivara_token', newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem('nivara_refresh_token', newRefreshToken);
    }

    return newAccessToken;
  } catch (err) {
    localStorage.removeItem('nivara_token');
    localStorage.removeItem('nivara_refresh_token');
    localStorage.removeItem('nivara_user');
    localStorage.removeItem('nivara_auth');
    window.dispatchEvent(new CustomEvent('nivara:auth_expired'));
    throw err;
  }
}

async function request(endpoint, options = {}, isRetry = false) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('nivara_token') || localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    credentials: 'include',
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);

    // If 401 Unauthorized and not already retrying, attempt token refresh
    if (response.status === 401 && !isRetry && !endpoint.includes('/api/auth/login') && !endpoint.includes('/api/auth/refresh')) {
      const hasRefreshToken = !!localStorage.getItem('nivara_refresh_token');

      if (hasRefreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const newToken = await performTokenRefresh();
            isRefreshing = false;
            onRefreshed(newToken);
            return request(endpoint, options, true);
          } catch (refreshErr) {
            isRefreshing = false;
            refreshSubscribers = [];
            throw new Error('Session expired. Please login again.');
          }
        } else {
          // A refresh is already in flight, queue this request
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((newToken) => {
              if (newToken) {
                resolve(request(endpoint, options, true));
              } else {
                reject(new Error('Session expired. Please login again.'));
              }
            });
          });
        }
      }
    }

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
  get: (endpoint, configOrParams = {}) => {
    let queryObj = {};
    if (configOrParams && typeof configOrParams === 'object') {
      if (configOrParams.params && typeof configOrParams.params === 'object') {
        queryObj = configOrParams.params;
      } else {
        queryObj = configOrParams;
      }
    }
    const cleanParams = Object.fromEntries(
      Object.entries(queryObj).filter(([_, v]) => v !== undefined && v !== null && typeof v !== 'object')
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    const hasQuery = endpoint.includes('?');
    const fullEndpoint = queryString 
      ? `${endpoint}${hasQuery ? '&' : '?'}${queryString}` 
      : endpoint;
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

  patch: (endpoint, data = {}) => {
    return request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  delete: (endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  }
};

export default apiClient;

