'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { SignInRequest } from '@sansa-dev/shared';
import { useAuth } from '../../../hooks/useAuth';

import { Button } from '../../../components/common/button';
import { Input } from '../../../components/common/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/common/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/common/form';
import { Alert, AlertDescription } from '../../../components/common/alert';
import { LoadingSpinner } from '../../../components/common/spinner';
import { AuthLayout } from '../layout'; 

/**
 * Sign-in form validation schema
 */
const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type SignInFormData = z.infer<typeof signInSchema>;

/**
 * SignInContent Component - The actual content that uses useSearchParams
 */
const SignInContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInState, isAuthenticated, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Get redirect location from URL params
  const from = searchParams.get('from') || '/dashboard';
  const authError = searchParams.get('error');

  // Initialize form with validation
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect if already authenticated (only after loading is complete)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(from);
    }
  }, [isLoading, isAuthenticated, router, from]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: SignInFormData) => {
    try {
      const signInRequest: SignInRequest = {
        email: data.email.toLowerCase().trim(),
        password: data.password,
      };

      await signIn(signInRequest);

      // Navigation will happen automatically via the useEffect above
      // when isAuthenticated becomes true
    } catch (error) {
      // Error is handled by the form state from useAuth
      console.error('Sign-in failed:', error);
    }
  };

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = (error: unknown): string => {
    if (!error) return '';

    const message =
      (error as Error)?.message ||
      (error as Error)?.toString() ||
      'An unexpected error occurred';

    // Map common error messages to user-friendly versions
    const errorMap: Record<string, string> = {
      'Invalid credentials': 'The email or password you entered is incorrect.',
      'Account deactivated':
        'Your account has been deactivated. Please contact support.',
      'Email not verified':
        'Please verify your email address before signing in.',
      'Too many requests': 'Too many sign-in attempts. Please try again later.',
    };

    return errorMap[message] || message;
  };

  return (
    <Card variant="ghost">
      <CardHeader className="space-y-4 pb-6">
        <div className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-cosmo-primary-100">
            Welcome back
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-2">
            Sign in to your account to continue
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Auth error from redirect */}
        {authError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        {/* Sign-in error */}
        {signInState.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {getErrorMessage(signInState.error)}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-cosmo-primary-100">
                    Email address
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 focus:border-primary focus:ring-primary"
                        disabled={signInState.isLoading}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-cosmo-primary-100">
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 focus:border-primary focus:ring-primary"
                        disabled={signInState.isLoading}
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={signInState.isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:text-primary font-medium transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary text-white font-medium shadow-sm transition-all duration-200"
              disabled={signInState.isLoading}
            >
              {signInState.isLoading ? (
                <>
                  <LoadingSpinner size={16} className="mr-2 text-white" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="pt-6 flex flex-col justify-center items-center">
        <div className="text-center text-sm text-muted-foreground w-full">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-primary hover:text-primary font-medium transition-colors"
          >
            Create one here
          </Link>
        </div>

        {/* Additional links */}
        <div className="mt-2 text-center text-xs text-muted-foreground">
          <p>
            By signing in, you agree to our{' '}
            <a
              href="#"
              className="text-primary hover:text-primary transition-colors"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="#"
              className="text-primary hover:text-primary transition-colors"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

/**
 * SignInPage Component - Wrapper with Suspense boundary
 */
const SignInPage: React.FC = () => {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <Card variant="ghost">
            <CardContent className="p-8">
              <div className="text-center">Loading...</div>
            </CardContent>
          </Card>
        }
      >
        <SignInContent />
      </Suspense>
    </AuthLayout>
  );
};

export default SignInPage;
