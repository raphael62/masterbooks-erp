import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';

/**
 * Protects routes that require authentication.
 * Also enforces page-level permissions: redirects to dashboard if user lacks access.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { canAccess, loading: permissionsLoading } = usePermissions();
  const location = useLocation();
  const pathname = location?.pathname || '';

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canAccess(pathname)) {
    return <Navigate to="/dashboard" state={{ message: 'You do not have access to that page' }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
