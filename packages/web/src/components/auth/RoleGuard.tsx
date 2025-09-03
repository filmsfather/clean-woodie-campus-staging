import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '@woodie/domain';

type RoleGuardProps = {
  allowedRoles: Array<UserRole>;
  redirectTo?: string;
  fallback?: React.ComponentType;
};

export const RoleGuard = ({
  allowedRoles,
  redirectTo = '/unauthorized',
  fallback: Fallback
}: RoleGuardProps) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    if (Fallback) {
      return <Fallback />;
    }
    return <Navigate to={redirectTo} replace />;
  }
  
  return <Outlet />;
};