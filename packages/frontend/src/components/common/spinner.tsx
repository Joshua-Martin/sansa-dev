import { Loader2 } from 'lucide-react';
import React from 'react';

import { cn } from '../../lib/utils/utils';

export interface ISVGProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

const LoadingSpinner = React.memo(({ size = 24, className }: ISVGProps) => {
  return (
    <Loader2
      className={cn('animate-spin  duration-1500 stroke-foreground', className)}
      height={size}
      width={size}
    />
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
export { LoadingSpinner };
