import React from 'react';
import { cn } from '../../../lib/utils/utils';
import './x21.css';

type LogoMarkProps = {
  className?: string;
  size?: number;
};

/**
 * Logo mark component using SVG text "x21" with Orbitron font
 * Renders the x21 logo as bold text using the Orbitron font family
 *
 * @param className - Optional CSS class names to apply to the component
 * @param size - Height of the logo in pixels (defaults to 32)
 */
export const LogoMark: React.FC<LogoMarkProps> = ({ className, size = 32 }) => {
  // Calculate width proportionally based on height (2:1 aspect ratio)
  const width = size * 2;

  // Font size should be slightly smaller than the container height to account for font metrics
  // Most fonts have a cap height around 0.7-0.8 of the font size
  const fontSize = size;

  // Position text to center it properly within the container
  // y position accounts for font baseline and cap height
  const textY = 0;

  const outerHeight = size * 0.6;

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden',
        className
      )}
      style={{
        height: outerHeight,
        maxHeight: outerHeight,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${size}`}
        className={cn('text-primary', className)}
      >
        <text
          x={width / 2}
          y={textY}
          textAnchor="middle"
          dominantBaseline="hanging"
          fontSize={fontSize}
          fontWeight="700"
          fill="currentColor"
          className="orbitron-x21"
          style={{
            lineHeight: 1,
            fontFamily: 'Orbitron, monospace',
          }}
        >
          x21
        </text>
      </svg>
    </div>
  );
};

export default LogoMark;
