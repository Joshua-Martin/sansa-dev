import React from 'react';

/**
 * Direction for the folder dip SVG
 */
export type FolderDipDirection = 'left' | 'right';

/**
 * Props for the FolderDip component
 */
export interface FolderDipProps {
  /**
   * The color to apply to the SVG. This will be passed as a CSS custom property or style.
   * @default "currentColor"
   */
  color?: string;

  /**
   * The direction of the folder dip - determines the SVG transform
   * @default "left"
   */
  direction?: FolderDipDirection;

  /**
   * Additional CSS class name for the SVG element
   */
  className?: string;
}

/**
 * A React component that renders a folder dip SVG shape.
 * The component accepts color and direction props to customize the appearance.
 * The SVG can be positioned on the left or right side with appropriate transforms.
 * The SVG is designed to fill the full height of its container without gaps.
 *
 * @param props - The props for customizing the SVG
 * @returns A React element containing the folder dip SVG
 */
export const FolderDip: React.FC<FolderDipProps> = ({
  color = 'currentColor',
  direction = 'left',
  className = '',
}) => {
  const baseClasses = 'h-full w-full shrink-0';

  // Use different paths for left and right to avoid transform artifacts
  const pathData = direction === 'left'
    ? "M0 0 H85 V64 C71.2084 63.9997 57.3095 56.6952 50 45 L34 19 C26.6905 7.30481 13.7915 0 0 0 Z"
    : "M85 0 H0 V64 C13.7915 63.9997 27.3095 56.6952 35 45 L51 19 C58.6905 7.30481 71.2084 0 85 0 Z";

  const svgClasses = `${baseClasses} ${className}`.trim();

  return (
    <svg
      viewBox="0 0 85 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={svgClasses}
      style={{ color }}
      preserveAspectRatio="none"
    >
      <path
        d={pathData}
        fill="currentColor"
      />
    </svg>
  );
};
