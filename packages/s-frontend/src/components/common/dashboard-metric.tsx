import { ArrowDownIcon, ArrowUpIcon, LucideIcon } from 'lucide-react';
import React from 'react';

import { cn } from '../../lib/utils/utils';

export type DashboardMetric = {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  suffix?: string;
  className?: string;
};

/**
 * A standardized component for displaying a single metric with optional trend indicator
 */
const DashboardMetric = ({
  title,
  value,
  icon: Icon,
  change,
  trend,
  suffix,
  className,
}: DashboardMetric) => {
  const getTrendColor = () => {
    if (!trend) return '';

    return trend === 'up'
      ? 'text-primary'
      : trend === 'down'
        ? 'text-red-500'
        : 'text-gray-500';
  };

  const getTrendIcon = () => {
    if (!trend || trend === 'neutral') return null;

    return trend === 'up' ? (
      <ArrowUpIcon className="h-3 w-3 mr-1" />
    ) : (
      <ArrowDownIcon className="h-3 w-3 mr-1" />
    );
  };

  return (
    <div
      className={cn('bg-card p-3 rounded-lg border border-border', className)}
    >
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className="flex items-center">
        <p className="text-xl font-semibold">
          {value}
          {suffix}
        </p>
        {Icon && <Icon className="ml-1.5 h-4 w-4 text-muted-foreground" />}
      </div>

      {(trend || change !== undefined) && (
        <div className={cn('text-xs flex items-center mt-1', getTrendColor())}>
          {getTrendIcon()}
          {change !== undefined && `${Math.abs(change)}%`}
        </div>
      )}
    </div>
  );
};

export { DashboardMetric };
