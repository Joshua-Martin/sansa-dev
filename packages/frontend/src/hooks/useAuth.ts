'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../lib/auth/auth.api';
import { tokenManager, api } from '../lib/api';
import { tokenRefreshService } from '../lib/auth/token-refresh.service';
import type {
  SignUpRequest,
  SignInRequest,
  AuthResponse,
  UserProfileResponse,
  UpdateUserParams,
  MessageResponse,
  UserStats,
} from '@sansa-dev/shared';

/**
 * Query keys for React Query cache management
 */
export const AUTH_QUERY_KEYS = {
  profile: ['auth', 'profile'] as const,
  stats: ['auth', 'stats'] as const,
  authenticated: ['auth', 'authenticated'] as const,
} as const;

/**
 * Hook for user registration
 *
 * @returns Mutation object for user sign up
 */
export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, SignUpRequest>({
    mutationFn: (signUpRequest: SignUpRequest) => authApi.signUp(signUpRequest),
    onSuccess: (data: AuthResponse) => {
      // Cache the user profile after successful registration
      queryClient.setQueryData(AUTH_QUERY_KEYS.profile, data.user);
      queryClient.setQueryData(AUTH_QUERY_KEYS.authenticated, true);

      // Invalidate auth-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      // Don't redirect here - let the useEffect in the component handle it
      // This prevents race conditions with authentication state
    },
    onError: (error: Error) => {
      console.error('Sign up failed:', error);
    },
  });
}

/**
 * Hook for user authentication
 *
 * @returns Mutation object for user sign in
 */
export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, SignInRequest>({
    mutationFn: (signInRequest: SignInRequest) => authApi.signIn(signInRequest),
    onSuccess: (data: AuthResponse) => {
      // Cache the user profile after successful authentication
      queryClient.setQueryData(AUTH_QUERY_KEYS.profile, data.user);
      queryClient.setQueryData(AUTH_QUERY_KEYS.authenticated, true);

      // Invalidate auth-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      // Don't redirect here - let the useEffect in the component handle it
      // This prevents race conditions with authentication state
    },
    onError: (error: Error) => {
      console.error('Sign in failed:', error);
    },
  });
}

/**
 * Hook for user logout
 *
 * @returns Mutation object for user logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, void>({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
      queryClient.setQueryData(AUTH_QUERY_KEYS.authenticated, false);

      // Immediately invalidate auth status to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEYS.authenticated,
        refetchType: 'none', // Don't refetch, we just set the data
      });

      // Force a page reload to ensure clean state
      window.location.href = '/signin';
    },
    onError: (error: Error) => {
      console.error('Logout failed:', error);
      // Even if server logout fails, clear client state
      authApi.clearAuthState();
      queryClient.clear();
      queryClient.setQueryData(AUTH_QUERY_KEYS.authenticated, false);

      // Immediately invalidate auth status
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEYS.authenticated,
        refetchType: 'none',
      });

      // Force redirect to signin
      window.location.href = '/signin';
    },
  });
}

/**
 * Hook for getting user profile
 *
 * @returns Query object for user profile data
 */
export function useProfile() {
  const { data: isAuthenticated = false } = useAuthStatus();

  return useQuery<UserProfileResponse, Error>({
    queryKey: AUTH_QUERY_KEYS.profile,
    queryFn: () => authApi.getProfile(),
    enabled: isAuthenticated && authApi.isAuthenticated(), // Double check for safety
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount: number, error: Error) => {
      // Don't retry on authentication errors
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 401) {
        return false;
      }

      // Don't retry on server errors (5xx) - server is likely down
      if (status && status >= 500) {
        return false;
      }

      // Don't retry if circuit breaker is open (service unavailable)
      if (!api.circuitBreaker.canRequest()) {
        return false;
      }

      // Don't retry on network errors (like ERR_EMPTY_RESPONSE)
      if (
        error.message?.includes('ERR_EMPTY_RESPONSE') ||
        error.message?.includes('Network Error') ||
        error.message?.includes('Service unavailable')
      ) {
        return false;
      }

      // For other errors, retry up to 2 times with exponential backoff
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

/**
 * Hook for updating user profile
 *
 * @returns Mutation object for profile updates
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UserProfileResponse, Error, UpdateUserParams>({
    mutationFn: (updateParams: UpdateUserParams) =>
      authApi.updateProfile(updateParams),
    onSuccess: (data: UserProfileResponse) => {
      // Update cached profile data
      queryClient.setQueryData(AUTH_QUERY_KEYS.profile, data);
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.profile });
    },
    onError: (error: Error) => {
      console.error('Profile update failed:', error);
    },
  });
}

/**
 * Hook for email verification
 *
 * @returns Mutation object for email verification
 */
export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, string>({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onSuccess: () => {
      // Invalidate profile to refresh email verification status
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.profile });
    },
    onError: (error: Error) => {
      console.error('Email verification failed:', error);
    },
  });
}

/**
 * Hook for password reset request
 *
 * @returns Mutation object for password reset request
 */
export function useRequestPasswordReset() {
  return useMutation<MessageResponse, Error, string>({
    mutationFn: (email: string) => authApi.requestPasswordReset(email),
    onError: (error: Error) => {
      console.error('Password reset request failed:', error);
    },
  });
}

/**
 * Hook for password reset confirmation
 *
 * @returns Mutation object for password reset
 */
export function useResetPassword() {
  return useMutation<
    MessageResponse,
    Error,
    { token: string; newPassword: string }
  >({
    mutationFn: ({
      token,
      newPassword,
    }: {
      token: string;
      newPassword: string;
    }) => authApi.resetPassword(token, newPassword),
    onError: (error: Error) => {
      console.error('Password reset failed:', error);
    },
  });
}

/**
 * Hook for getting user statistics (admin only)
 *
 * @returns Query object for user statistics
 */
export function useUserStats() {
  return useQuery<UserStats, Error>({
    queryKey: AUTH_QUERY_KEYS.stats,
    queryFn: () => authApi.getUserStats(),
    enabled: authApi.isAuthenticated(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount: number, error: Error) => {
      // Don't retry on authentication or authorization errors
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 401 || status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook for checking authentication status with enhanced validation
 *
 * @returns Query object for authentication status
 */
export function useAuthStatus() {
  return useQuery<boolean, Error>({
    queryKey: AUTH_QUERY_KEYS.authenticated,
    queryFn: async () => {
      // Use enhanced token validation
      const hasValidTokens = tokenManager.hasValidTokens();

      if (!hasValidTokens) {
        return false;
      }

      // If tokens exist but access token needs refresh, try refreshing
      if (tokenManager.needsTokenRefresh()) {
        try {
          const refreshedToken = await tokenManager.getValidAccessToken();
          return !!refreshedToken;
        } catch (error) {
          console.warn('Token refresh failed in useAuthStatus:', error);
          return false;
        }
      }

      return true;
    },
    staleTime: 30 * 1000, // 30 seconds - more reasonable than 1 second
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true, // Check on focus to catch expired tokens
    refetchOnMount: true,
    gcTime: 0, // Don't cache for security
    retry: false, // Don't retry auth checks
    notifyOnChangeProps: ['data', 'isLoading'],
  });
}

/**
 * Comprehensive auth hook that provides all authentication state and methods
 *
 * @returns Object containing auth state and methods
 */
export function useAuth() {
  const queryClient = useQueryClient();

  // Get authentication status
  const { data: isAuthenticated = false, isLoading: isCheckingAuth } =
    useAuthStatus();

  // Get user profile
  const {
    data: user,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useProfile();

  // Authentication mutations
  const signUpMutation = useSignUp();
  const signInMutation = useSignIn();
  const logoutMutation = useLogout();
  const updateProfileMutation = useUpdateProfile();
  const verifyEmailMutation = useVerifyEmail();
  const requestPasswordResetMutation = useRequestPasswordReset();
  const resetPasswordMutation = useResetPassword();

  // Derived state - separate auth errors from profile errors
  const isLoading = isCheckingAuth || isLoadingProfile;
  const isAuthenticating = signUpMutation.isPending || signInMutation.isPending;
  const hasProfileError = !!profileError;

  // Start token refresh service when authenticated - simple dependency
  useEffect(() => {
    if (isAuthenticated) {
      tokenRefreshService.startAutoRefresh();
    } else {
      tokenRefreshService.stopAutoRefresh();
    }

    return () => tokenRefreshService.stopAutoRefresh();
  }, [isAuthenticated]);

  // Handle authentication events
  useEffect(() => {
    const handleTokenRefreshed = () => {
      // Invalidate queries to refresh data after token refresh
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    };

    const handleRefreshFailed = () => {
      // Token refresh failed, clear auth state
      queryClient.clear();
      queryClient.setQueryData(AUTH_QUERY_KEYS.authenticated, false);
    };

    const handleUnauthorized = () => {
      queryClient.clear();
      queryClient.setQueryData(AUTH_QUERY_KEYS.authenticated, false);
    };

    const handleServiceUnavailable = () => {
      console.warn('Authentication service is temporarily unavailable');
    };

    window.addEventListener('auth:token-refreshed', handleTokenRefreshed);
    window.addEventListener('auth:refresh-failed', handleRefreshFailed);
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener(
      'api:service-unavailable',
      handleServiceUnavailable
    );

    return () => {
      window.removeEventListener('auth:token-refreshed', handleTokenRefreshed);
      window.removeEventListener('auth:refresh-failed', handleRefreshFailed);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener(
        'api:service-unavailable',
        handleServiceUnavailable
      );
    };
  }, [queryClient]);

  // Clear auth state function
  const clearAuthState = useCallback(() => {
    authApi.clearAuthState();
    queryClient.clear();
    queryClient.setQueryData(AUTH_QUERY_KEYS.authenticated, false);
  }, [queryClient]);

  return {
    // Auth state
    isAuthenticated,
    isLoading,
    isCheckingAuth,
    isAuthenticating,
    hasProfileError, // New separate profile error state
    user,
    error: profileError,

    // Auth methods
    signUp: signUpMutation.mutateAsync,
    signIn: signInMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    verifyEmail: verifyEmailMutation.mutateAsync,
    requestPasswordReset: requestPasswordResetMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    clearAuthState,

    // Mutation states
    signUpState: {
      isLoading: signUpMutation.isPending,
      error: signUpMutation.error,
      isSuccess: signUpMutation.isSuccess,
    },
    signInState: {
      isLoading: signInMutation.isPending,
      error: signInMutation.error,
      isSuccess: signInMutation.isSuccess,
    },
    logoutState: {
      isLoading: logoutMutation.isPending,
      error: logoutMutation.error,
      isSuccess: logoutMutation.isSuccess,
    },
    updateProfileState: {
      isLoading: updateProfileMutation.isPending,
      error: updateProfileMutation.error,
      isSuccess: updateProfileMutation.isSuccess,
    },
    verifyEmailState: {
      isLoading: verifyEmailMutation.isPending,
      error: verifyEmailMutation.error,
      isSuccess: verifyEmailMutation.isSuccess,
    },
    requestPasswordResetState: {
      isLoading: requestPasswordResetMutation.isPending,
      error: requestPasswordResetMutation.error,
      isSuccess: requestPasswordResetMutation.isSuccess,
    },
    resetPasswordState: {
      isLoading: resetPasswordMutation.isPending,
      error: resetPasswordMutation.error,
      isSuccess: resetPasswordMutation.isSuccess,
    },
  };
}

/**
 * Hook for requiring authentication
 * Automatically redirects to login if not authenticated
 *
 * @param redirectTo - URL to redirect to if not authenticated
 * @returns Authentication state
 */
export function useRequireAuth(redirectTo: string = '/signin') {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push(redirectTo);
    }
  }, [auth.isLoading, auth.isAuthenticated, redirectTo, router]);

  return auth;
}

/**
 * Hook for admin-only access
 * Redirects if not authenticated or not admin
 *
 * @param redirectTo - URL to redirect to if not authorized
 * @returns Authentication state
 */
export function useRequireAdmin(redirectTo: string = '/') {
  const auth = useAuth();
  const router = useRouter();
  const isAdmin = auth.user?.role === 'admin';

  useEffect(() => {
    if (!auth.isLoading && (!auth.isAuthenticated || !isAdmin)) {
      router.push(redirectTo);
    }
  }, [auth.isLoading, auth.isAuthenticated, isAdmin, redirectTo, router]);

  return { ...auth, isAdmin };
}
