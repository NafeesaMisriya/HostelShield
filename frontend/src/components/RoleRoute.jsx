import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's assigned dashboard
    const dest = user.role === 'STUDENT' ? '/student' : user.role === 'SECURITY' ? '/security' : '/admin';
    return <Navigate to={dest} replace />;
  }

  return children;
};
