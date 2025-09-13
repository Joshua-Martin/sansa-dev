'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/common/spinner';

/**
 * App Layout Component
 *
 * Layout for authenticated application routes.
 * Provides additional client-side auth verification as a fallback to middleware.
 * Handles graceful error recovery and loading states.
 */
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, hasProfileError } = useAuth();
  const router = useRouter();

  // Handle unauthenticated users (fallback to middleware) - single useEffect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.warn(
        'User not authenticated in app layout, redirecting to signin'
      );
      router.push('/signin');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show profile error banner if profile failed but user is still authenticated
  const showProfileError = hasProfileError && isAuthenticated;

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size={40} className="text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (middleware should prevent this)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">
          Redirecting to sign in...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {showProfileError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="text-sm text-yellow-700">
            Unable to load profile data. Some features may be limited.
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default AppLayout;
