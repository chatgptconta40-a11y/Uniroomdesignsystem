import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { UserType } from '../types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedTypes?: UserType[];
}

function getDefaultRoute(type: UserType): string {
  if (type === 'admin') return '/admin';
  if (type === 'landlord') return '/landlord/dashboard';
  return '/dashboard';
}

export function ProtectedRoute({ children, allowedTypes }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">A carregar...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedTypes && user && !allowedTypes.includes(user.type)) {
    return <Navigate to={getDefaultRoute(user.type)} replace />;
  }

  return <>{children}</>;
}