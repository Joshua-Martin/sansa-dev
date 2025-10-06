import React from 'react';

import { cn } from '../../lib/utils/utils';

interface DashboardListItemProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  bottomContent?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * A standardized list item component for dashboard lists
 */
const DashboardListItem = ({
  title,
  subtitle,
  rightContent,
  bottomContent,
  icon,
  className,
  onClick,
}: DashboardListItemProps) => {
  return (
    <div
      className={cn(
        'border rounded-md p-4 mb-3 hover:border-primary/50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-2">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div>
            <h4 className="font-medium text-base">{title}</h4>
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {rightContent && <div className="text-right">{rightContent}</div>}
      </div>

      {bottomContent && (
        <div className="border-t pt-2 mt-2">{bottomContent}</div>
      )}
    </div>
  );
};

export { DashboardListItem };
