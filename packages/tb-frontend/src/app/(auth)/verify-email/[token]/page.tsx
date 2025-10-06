'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/common/card';
import { Button } from '../../../../components/common/button';
import { AuthLayout } from '../../layout';
import { Alert, AlertDescription } from '../../../../components/common/alert';

/**
 * VerifyEmailPage Component
 *
 * Handles email verification using a token from the URL.
 */
const VerifyEmailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { verifyEmail, verifyEmailState } = useAuth();
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  const token = params.token as string;

  useEffect(() => {
    if (token && !verificationAttempted) {
      setVerificationAttempted(true);
      verifyEmail(token);
    }
  }, [token, verifyEmail, verificationAttempted]);

  const handleContinue = () => {
    router.push('/signin');
  };

  if (!token) {
    return (
      <AuthLayout>
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            <div className="text-center">
              <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <CardTitle className="text-2xl font-bold tracking-tight text-cosmo-primary-100">
                Invalid Verification Link
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-2">
                The verification link is missing or invalid.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <div className="text-center">
              <Button onClick={handleContinue} className="w-full">
                Go to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  if (verifyEmailState.isLoading) {
    return (
      <AuthLayout>
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 text-primary animate-spin" />
              <CardTitle className="text-2xl font-bold tracking-tight text-cosmo-primary-100">
                Verifying Email
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-2">
                Please wait while we verify your email address...
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </AuthLayout>
    );
  }

  if (verifyEmailState.isSuccess) {
    return (
      <AuthLayout>
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            <div className="text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <CardTitle className="text-2xl font-bold tracking-tight text-cosmo-primary-100">
                Email Verified Successfully!
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-2">
                Your email has been verified. You can now sign in to your
                account.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <div className="text-center">
              <Button onClick={handleContinue} className="w-full">
                Continue to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  if (verifyEmailState.error) {
    return (
      <AuthLayout>
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            <div className="text-center">
              <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <CardTitle className="text-2xl font-bold tracking-tight text-cosmo-primary-100">
                Verification Failed
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-2">
                The verification link may be expired or invalid.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {verifyEmailState.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {verifyEmailState.error.message ||
                    'Failed to verify email. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center">
              <Button onClick={handleContinue} className="w-full">
                Go to Sign In
              </Button>
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
              Email Verification
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              Email verification functionality would be implemented here
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="text-center">
            <Button onClick={handleContinue} className="w-full">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
