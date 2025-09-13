'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../hooks/useAuth';

import { Button } from '../../../components/common/button';
import { Input } from '../../../components/common/input';
import {
  Card,
  CardContent,
  CardDescription,
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
import { AuthLayout } from '../../../components/custom/layout/auth-layout';

/**
 * Forgot password form validation schema
 */
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * ForgotPasswordPage Component
 *
 * A forgot password page that allows users to request a password reset link.
 */
const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset, requestPasswordResetState } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Initialize form with validation
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await requestPasswordReset(data.email.toLowerCase().trim());
      setIsSubmitted(true);
    } catch (error) {
      console.error('Password reset request failed:', error);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout>
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-cosmo-primary-100">
                Check your email
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-2">
                We&apos;ve sent a password reset link to your email address
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>Didn&apos;t receive the email? Check your spam folder or</p>
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-primary"
                onClick={() => setIsSubmitted(false)}
              >
                try a different email address
              </Button>
            </div>

            <div className="pt-4">
              <Link href="/signin">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-6">
          <div className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-cosmo-primary-100">
              Forgot your password?
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              Enter your email address and we&apos;ll send you a reset link
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error display */}
          {requestPasswordResetState.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {requestPasswordResetState.error.message ||
                  'Failed to send reset email. Please try again.'}
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
                          className="pl-10 h-11 border-border focus:border-primary focus:ring-primary"
                          disabled={requestPasswordResetState.isLoading}
                          autoComplete="email"
                          autoFocus
                        />
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
                disabled={requestPasswordResetState.isLoading}
              >
                {requestPasswordResetState.isLoading ? (
                  <>
                    <LoadingSpinner size={16} className="mr-2 text-white" />
                    Sending reset link...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send reset link
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Back to sign in */}
          <div className="pt-4">
            <Link href="/signin">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
