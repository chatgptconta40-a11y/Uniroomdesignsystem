import { ReactNode, useEffect, useState } from 'react';
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
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setTimedOut(true), 12000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">A carregar sessão…</p>
      </div>
    );
  }

  if (timedOut && loading) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedTypes && user && !allowedTypes.includes(user.type)) {
    return <Navigate to={getDefaultRoute(user.type)} replace />;
  }

  return <>{children}</>;
}
