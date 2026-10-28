import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/authContext';
import { useUserProgress } from '@/hooks/useUserProgress';

export default function RoleBasedRedirect() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { progress } = useUserProgress(user?.email || null);

  useEffect(() => {
    if (user && progress) {
      if (user.role === 'admin') {
        // Check if admin has completed admin onboarding
        if (!progress.adminOnboardingCompletedAt) {
          // Admin hasn't completed admin onboarding yet
          setLocation('/admin-onboarding-step1');
        } else if (!progress.onboardingCompletedAt) {
          // Admin completed admin onboarding but not employee onboarding
          setLocation('/onboarding');
        } else {
          // Admin completed everything, go to manager dashboard
          setLocation('/manager');
        }
      } else if (user.role === 'manager') {
        // Redirect managers to their dashboard
        setLocation('/manager');
      } else {
        // Redirect employees to onboarding
        setLocation('/onboarding');
      }
    }
  }, [user, progress, setLocation]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your workspace...</p>
      </div>
    </div>
  );
}