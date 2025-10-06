import React from 'react';
import { cn } from '../../../lib/utils/utils';

/**
 * Word mark component displaying the template name
 * Shows "jbm_dev_template" as the brand text
 */
type WordMarkProps = {
  className?: string;
};

export const WordMark: React.FC<WordMarkProps> = ({ className }) => {
  return (
    <div className={cn('flex items-center', className)}>
      <span className="text-xl font-bold text-foreground">
        jbm_dev_template
      </span>
    </div>
  );
};

export default WordMark;
