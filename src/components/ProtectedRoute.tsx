import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import Loading from './Loading';

export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'planner' | 'viewer';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <Loading fullScreen text="加载中..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user) {
    const roleHierarchy: Record<string, number> = {
      viewer: 1,
      planner: 2,
      admin: 3,
    };
    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
    if (userRoleLevel < requiredRoleLevel) {
      return <Navigate to="/403" replace />;
    }
  }

  return <>{children}</>;
}
