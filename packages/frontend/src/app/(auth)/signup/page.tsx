'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  UserPlus,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { SignUpRequest } from '@sansa-dev/shared';
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
 * Sign-up form validation schema
 */
const signUpSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .max(100, 'Email must be less than 100 characters'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be less than 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

/**
 * Password strength indicator
 */
const PasswordStrengthIndicator: React.FC<{ password: string; isVisible: boolean }> = ({
  password,
  isVisible,
}) => {
  const requirements = [
    { label: 'At least 8 characters', test: password.length >= 8 },
    { label: 'One uppercase letter', test: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', test: /[a-z]/.test(password) },
    { label: 'One number', test: /\d/.test(password) },
    { label: 'One special character', test: /[@$!%*?&]/.test(password) },
  ];

  if (!isVisible || !password) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-border rounded-md shadow-lg p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
      {requirements.map((req, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          {req.test ? (
            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
          ) : (
            <div className="h-3 w-3 rounded-full border border-gray-300 flex-shrink-0" />
          )}
          <span
            className={req.test ? 'text-green-600' : 'text-muted-foreground'}
          >
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * SignUpPage Component
 *
 * A beautiful, production-ready sign-up page with:
 * - Comprehensive form validation using Zod and React Hook Form
 * - Password strength indicator
 * - Password visibility toggle
 * - Error handling and display
 * - Loading states
 * - Responsive design
 * - Accessibility features
 * - Success handling with redirect
 */
const SignUpPage: React.FC = () => {
  const router = useRouter();
  const { signUp, signUpState, isAuthenticated, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Initialize form with validation
  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchPassword = form.watch('password');

  // Redirect if already authenticated (only after loading is complete)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: SignUpFormData) => {
    try {
      const signUpRequest: SignUpRequest = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
      };

      await signUp(signUpRequest);

      // Navigation will happen automatically via the useEffect above
      // when isAuthenticated becomes true
    } catch (error) {
      // Error is handled by the form state from useAuth
      console.error('Sign-up failed:', error);
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
      'Email already exists':
        'An account with this email address already exists. Please try signing in instead.',
      'Weak password':
        'Please choose a stronger password that meets all requirements.',
      'Invalid email': 'Please enter a valid email address.',
      'Rate limit exceeded':
        'Too many registration attempts. Please try again later.',
    };

    return errorMap[message] || message;
  };

  return (
    <AuthLayout>
      <Card className="shadow-none border-0 bg-none backdrop-none">
        <CardHeader className="space-y-4 pb-6">
          <div className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-cosmo-primary-100">
              Create your account
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              Get started with Demo Agent today
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Sign-up error */}
          {signUpState.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {getErrorMessage(signUpState.error)}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Fields Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name Field */}
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-cosmo-primary-100">
                        First name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="First name"
                            className="pl-10 h-11 border-border focus:border-primary focus:ring-primary"
                            disabled={signUpState.isLoading}
                            autoComplete="given-name"
                            autoFocus
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name Field */}
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-cosmo-primary-100">
                        Last name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="Last name"
                            className="pl-10 h-11 border-border focus:border-primary focus:ring-primary"
                            disabled={signUpState.isLoading}
                            autoComplete="family-name"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                          className="pl-10 h-11 border-border focus:border-primary focus:ring-primary"
                          disabled={signUpState.isLoading}
                          autoComplete="email"
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
                          placeholder="Create a password"
                          className="pl-10 pr-10 h-11 border-border focus:border-primary focus:ring-primary"
                          disabled={signUpState.isLoading}
                          autoComplete="new-password"
                          onFocus={() => setIsPasswordFocused(true)}
                          onBlur={() => {
                            // Delay hiding to allow clicks on the password requirements
                            setTimeout(() => setIsPasswordFocused(false), 150);
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={signUpState.isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <PasswordStrengthIndicator
                          password={watchPassword}
                          isVisible={isPasswordFocused}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-cosmo-primary-100">
                      Confirm password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          className="pl-10 pr-10 h-11 border-border focus:border-primary focus:ring-primary"
                          disabled={signUpState.isLoading}
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={signUpState.isLoading}
                        >
                          {showConfirmPassword ? (
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

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary text-white font-medium shadow-sm transition-all duration-200"
                disabled={signUpState.isLoading}
              >
                {signUpState.isLoading ? (
                  <>
                    <LoadingSpinner size={16} className="mr-2 text-white" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create account
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col justify-center items-center">
          <div className="text-center text-sm text-muted-foreground w-full">
            Already have an account?{' '}
            <Link
              href="/signin"
              className="text-primary hover:text-primary font-medium transition-colors"
            >
              Sign in here
            </Link>
          </div>
          {/* Additional links */}
          <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>
              By creating an account, you agree to our{' '}
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
    </AuthLayout>
  );
};

export default SignUpPage;
