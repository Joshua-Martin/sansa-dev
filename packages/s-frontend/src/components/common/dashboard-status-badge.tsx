import { LucideIcon } from 'lucide-react';
import React from 'react';

import { cn } from '../../lib/utils/utils';

import { Badge } from './badge';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface DashboardStatusBadgeProps {
  label: string;
  status?: StatusType;
  icon?: LucideIcon;
  className?: string;
}

/**
 * A standardized badge component for dashboard status indicators
 */
const DashboardStatusBadge = ({
  label,
  status = 'neutral',
  icon: Icon,
  className,
}: DashboardStatusBadgeProps) => {
  const getStatusStyles = (): string => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'error':
        return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'info':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn('flex items-center', getStatusStyles(), className)}
    >
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      <span>{label}</span>
    </Badge>
  );
};

export { DashboardStatusBadge, type StatusType };
