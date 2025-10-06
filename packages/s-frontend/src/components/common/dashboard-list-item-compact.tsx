import React from 'react';

import { cn } from '../../lib/utils/utils';

interface DashboardListItemCompactProps {
  title: React.ReactNode;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * A compact list item component for dashboard lists
 * Displays minimal information in a single row format
 */
const DashboardListItemCompact = ({
  title,
  rightContent,
  leftContent,
  className,
  onClick,
}: DashboardListItemCompactProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-2 px-3 hover:bg-accent/30 transition-colors rounded-sm',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 min-w-0">
        {leftContent}
        <div className="overflow-hidden text-ellipsis whitespace-nowrap">
          {title}
        </div>
      </div>

      {rightContent && <div className="flex-shrink-0 ml-2">{rightContent}</div>}
    </div>
  );
};

export { DashboardListItemCompact };
