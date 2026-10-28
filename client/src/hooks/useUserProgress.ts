import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface UserProgress {
  onboardingStep: number;
  lastVisitedPage?: string;
  onboardingCompletedAt?: string;
  onboardingData?: any;
  adminOnboardingStep: number;
  adminOnboardingData?: any;
  adminOnboardingCompletedAt?: string;
  firstName: string;
}

export function useUserProgress(email: string | null) {
  // Get user progress
  const { data: progress, isLoading } = useQuery({
    queryKey: [`/api/user-progress/${email}`],
    enabled: !!email,
    retry: false
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (updates: {
      email: string;
      onboardingStep?: number;
      lastVisitedPage?: string;
      onboardingCompletedAt?: Date | null | string;
      onboardingData?: any;
      adminOnboardingStep?: number;
      adminOnboardingData?: any;
      adminOnboardingCompletedAt?: Date | null | string;
    }) => {
      const response = await fetch('/api/update-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update progress');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch progress data
      queryClient.invalidateQueries({ queryKey: [`/api/user-progress/${email}`] });
    },
  });

  const updateProgress = (updates: {
    onboardingStep?: number;
    lastVisitedPage?: string;
    onboardingCompletedAt?: Date | null | string;
    onboardingData?: any;
    adminOnboardingStep?: number;
    adminOnboardingData?: any;
    adminOnboardingCompletedAt?: Date | null | string;
  }) => {
    if (!email) return;
    
    updateProgressMutation.mutate({
      email,
      ...updates,
    });
  };

  const updateProgressAsync = async (updates: {
    onboardingStep?: number;
    lastVisitedPage?: string;
    onboardingCompletedAt?: Date | null | string;
    onboardingData?: any;
    adminOnboardingStep?: number;
    adminOnboardingData?: any;
    adminOnboardingCompletedAt?: Date | null | string;
  }) => {
    if (!email) return;
    
    return updateProgressMutation.mutateAsync({
      email,
      ...updates,
    });
  };

  return {
    progress: progress as UserProgress | undefined,
    isLoading,
    updateProgress,
    updateProgressAsync,
    isUpdating: updateProgressMutation.isPending,
  };
}

// Hook for tracking page visits. Uses a plain fetch (no query invalidation):
// lastVisitedPage is write-only telemetry, and invalidating the progress
// query on every navigation caused refetch/update feedback loops.
export function usePageTracking(currentPath: string, email: string | null) {
  useEffect(() => {
    if (email && currentPath && !currentPath.startsWith('/login')) {
      fetch('/api/update-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lastVisitedPage: currentPath }),
      }).catch(() => {
        // Page tracking is best-effort; never disrupt navigation.
      });
    }
  }, [currentPath, email]);
}