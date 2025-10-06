import { t } from 'i18next';
import * as React from 'react';

import { Button } from './button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-md mx-auto mt-8 border-destructive/50">
          <CardHeader className="bg-destructive/10 text-destructive-foreground">
            <CardTitle>{t('Something went wrong')}</CardTitle>
            <CardDescription className="text-destructive-foreground/80">
              {t('An unexpected error occurred in the application')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="bg-muted p-3 rounded border text-sm font-mono overflow-auto max-h-48 text-muted-foreground">
              {this.state.error?.message || t('Unknown error')}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 bg-card">
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              {t('Reload Page')}
            </Button>
            <Button onClick={this.resetError}>{t('Try Again')}</Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Error boundary hook for functional components
 */
export function useErrorBoundary(): {
  showBoundary: (error: Error) => void;
} {
  const [error, setError] = React.useState<Error | null>(null);

  if (error) {
    throw error;
  }

  return {
    showBoundary: setError,
  };
}

/**
 * Error fallback component for use with error boundaries
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-background">
      <Card className="w-full max-w-md mx-auto border-destructive/50">
        <CardHeader className="bg-destructive/10 text-destructive-foreground">
          <CardTitle>{t('Something went wrong')}</CardTitle>
          <CardDescription className="text-destructive-foreground/80">
            {t('An unexpected error occurred in the application')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="bg-muted p-3 rounded border text-sm font-mono overflow-auto max-h-48 text-muted-foreground">
            {error?.message || t('Unknown error')}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 bg-card">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            {t('Reload Page')}
          </Button>
          <Button onClick={resetErrorBoundary}>{t('Try Again')}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
