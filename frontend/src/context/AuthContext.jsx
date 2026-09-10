import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi, { getStoredUser, isAuthenticated as checkAuth, formatRoleName } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!checkAuth()) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getCurrentUser();
      if (res && res.data && res.data.user) {
        setUser(res.data.user);
        setIsAuthenticated(true);
        localStorage.setItem('nivara_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn("Session validation notice:", err.message);
      // If token expired / invalid
      if (err.message && (err.message.includes('expired') || err.message.includes('401'))) {
        localStorage.removeItem('nivara_token');
        localStorage.removeItem('nivara_user');
        localStorage.removeItem('nivara_auth');
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleAuthExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    };

    window.addEventListener('nivara:auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('nivara:auth_expired', handleAuthExpired);
    };
  }, [refreshUser]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (res && res.data) {
        setUser(res.data.user);
        setIsAuthenticated(true);
        return res.data;
      }
      throw new Error(res?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const role = user?.role || null;

  const value = {
    user,
    role,
    roleName: formatRoleName(role),
    isAuthenticated,
    loading,
    login,
    logout,
    refreshUser,
    isSuperAdmin: role === 'SUPER_ADMIN',
    isIpmdAdmin: ['SUPER_ADMIN', 'IPMD_ADMIN'].includes(role),
    isMinistryOfficer: ['MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(role),
    isAgencyUser: ['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(role),
    isNodalOfficer: role === 'NODAL_OFFICER',
    isReportingOfficer: role === 'REPORTING_OFFICER'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
