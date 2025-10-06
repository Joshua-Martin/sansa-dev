import { ChevronRightIcon, LucideIcon } from 'lucide-react';
import React from 'react';

import { cn } from '../../lib/utils/utils';

import { Button } from './button';
import { Card } from './card';
import { LoadingSpinner } from './spinner';

interface DashboardWidgetProps {
  title: string;
  icon?: LucideIcon;
  viewAllLink?: string;
  onViewAll?: () => void;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * A standardized widget component for dashboard use
 * Handles common widget patterns like headers, loading states, and empty states
 */
const DashboardWidget = ({
  title,
  icon: Icon,
  viewAllLink,
  onViewAll,
  isLoading = false,
  error = null,
  onRetry,
  emptyMessage = 'No data available',
  emptyDescription,
  className,
  children,
}: DashboardWidgetProps) => {
  return (
    <Card className={cn('p-4 h-full flex flex-col', className)}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {Icon && <Icon className="w-5 h-5 mr-2 text-primary" />}
          <h3 className="text-lg font-medium">{title}</h3>
        </div>

        {(viewAllLink || onViewAll) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={onViewAll}
            asChild={!!viewAllLink}
          >
            {viewAllLink ? (
              <a href={viewAllLink}>
                View All
                <ChevronRightIcon className="ml-1 w-3 h-3" />
              </a>
            ) : (
              <>
                View All
                <ChevronRightIcon className="ml-1 w-3 h-3" />
              </>
            )}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner className="text-primary" />
        </div>
      )}

      {error && !isLoading && (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
          <p className="text-destructive mb-2">Failed to load data</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && React.Children.count(children) === 0 && (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
          <p className="text-muted-foreground mb-2">{emptyMessage}</p>
          {emptyDescription && (
            <p className="text-xs text-muted-foreground">{emptyDescription}</p>
          )}
        </div>
      )}

      {!isLoading && !error && React.Children.count(children) > 0 && (
        <div className="flex-grow overflow-auto">{children}</div>
      )}
    </Card>
  );
};

export { DashboardWidget };
