import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = user.role || 'user';
    if (!allowedRoles.includes(role)) {
      // If role is not allowed, send them to a safe page
      if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
      if (role === 'provider') return <Navigate to="/provider/dashboard" replace />;
      return <Navigate to="/home" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
