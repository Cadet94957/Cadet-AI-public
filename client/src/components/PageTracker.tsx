import { useLocation } from 'wouter';
import { useAuth } from '@/lib/authContext';
import { usePageTracking } from '@/hooks/useUserProgress';

export function PageTracker() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Track page visits for authenticated users
  usePageTracking(location, user?.email || null);
  
  // This component doesn't render anything
  return null;
}