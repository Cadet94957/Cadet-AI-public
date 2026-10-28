import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/authContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If not loading and no current user, redirect to login
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [isLoading, user, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5DC' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, return null (redirect will happen in useEffect)
  if (!user) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
}