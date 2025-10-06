import React from 'react';

import { cn } from '../../lib/utils/utils';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  title?: string;
  className?: string;
  textClassName?: string;
  progressClassName?: string;
  trackClassName?: string;
}

/**
 * Circular progress component that shows a percentage in a circular display
 */
const CircularProgress = ({
  value,
  size = 36,
  strokeWidth = 3,
  title,
  className,
  textClassName,
  progressClassName,
  trackClassName,
}: CircularProgressProps) => {
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (normalizedValue / 100) * circumference;

  const center = size / 2;
  const valueFormatted = value.toFixed(1);

  return (
    <div className={cn('inline-flex flex-col items-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={cn('text-muted stroke-[0.5]', trackClassName)}
        />

        {/* Progress Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn('text-primary', progressClassName)}
        />
      </svg>

      {/* Text inside the circle */}
      <div
        className={cn('absolute text-xs font-medium', textClassName)}
        style={{ marginTop: size / 2 - 7 }}
      >
        {normalizedValue > 0 ? `${valueFormatted}%` : '0%'}
      </div>

      {/* Optional title below */}
      {title && <div className="text-xs mt-1 text-center">{title}</div>}
    </div>
  );
};

export { CircularProgress };
