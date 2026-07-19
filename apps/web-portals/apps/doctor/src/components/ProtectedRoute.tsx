import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute: React.FC = () => {
  const { token, user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'DOCTOR') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
