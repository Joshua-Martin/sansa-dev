'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/common/card';
import { AuthLayout } from '../../../components/custom/layout/auth-layout';
import { Button } from '../../../components/common/button';

/**
 * ResetPasswordContent Component - The actual content that uses useSearchParams
 */
const ResetPasswordContent: React.FC = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-6">
        <div className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-cosmo-primary-100">
            Reset Password
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-2">
            {token
              ? 'Enter your new password below'
              : 'Password reset functionality would be implemented here'}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            {token
              ? 'This page would handle password reset with token validation.'
              : 'Please use the forgot password link to receive a reset token.'}
          </p>

          <div className="pt-4">
            <Link href="/signin">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * ResetPasswordPage Component - Wrapper with Suspense boundary
 */
const ResetPasswordPage: React.FC = () => {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center">Loading...</div>
            </CardContent>
          </Card>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
