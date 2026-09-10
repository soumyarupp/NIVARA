import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAuthenticated as checkAuth, getStoredUser } from '../api/authApi';

const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { role, isAuthenticated, loading } = useAuth();

  const user = getStoredUser();
  const activeRole = role || user?.role;
  const isAuth = isAuthenticated || checkAuth();

  if (loading && !isAuth) {
    return null;
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && activeRole && !allowedRoles.includes(activeRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleRoute;
