'use client';
import React from 'react';

/**
 * Props for the GridPattern component
 */
export interface GridPatternProps {
  /**
   * Number of grid columns across the viewport. Cell size is computed as
   * window.innerWidth / gridColumns so the column count stays fixed across screen sizes.
   * @default 20
   */
  gridColumns?: number;
  /**
   * Stroke width of the grid lines
   * @default 0.8
   */
  strokeWidth?: number;
  /**
   * Color of the grid lines - can be any valid CSS color
   * @default "#6b7280"
   */
  color?: string;
  /**
   * Opacity of the grid pattern
   * @default 0.12
   */
  opacity?: number;
  /**
   * Opacity of the base grid (if not provided, uses opacity prop)
   * @default undefined
   */
  gridOpacity?: number;
  /**
   * Opacity of the accent lines (if not provided, uses opacity prop)
   * @default undefined
   */
  accentOpacity?: number;
  /**
   * Unique ID for the SVG pattern - useful when multiple GridPatterns are used on the same page
   * @default "grid-pattern"
   */
  patternId?: string;
  /**
   * Additional CSS classes to apply to the SVG element
   * @default ""
   */
  className?: string;
  /**
   * Custom CSS styles to apply to the SVG element
   * @default {}
   */
  style?: React.CSSProperties;
  /**
   * Enable gradient masks for sophisticated fade effects
   * @default false
   */
  enableGradients?: boolean;
  // Removed legacy pixel-based size/columns props in favor of gridColumns
  /**
   * Enable accent lines for visual emphasis on the grid
   * @default false
   */
  enableAccentLines?: boolean;
  /**
   * Percent-based accent line placement as a fraction of the viewBox width (0..1).
   * If a single number p (0..0.5), places symmetric lines at p and 1-p across the width.
   * If a tuple [leftPercent, rightPercent] (both 0..1), places lines at exact positions.
   * Positions are snapped to the nearest grid line when snapAccentToGrid is true.
   * @default undefined
   */
  accentLinePositionPercent?: number | [number, number];
  /**
   * Snap percent-based accent lines to the nearest grid line (multiple of cell size).
   * @default true
   */
  snapAccentToGrid?: boolean;
  /**
   * Stroke width for accent lines
   * @default 1.5
   */
  accentStrokeWidth?: number;
  /**
   * Color for accent lines
   * @default "#374151"
   */
  accentColor?: string;
  /**
   * Make accent lines dashed
   * @default false
   */
  accentDashed?: boolean;
  /**
   * Dash pattern for accent lines (if accentDashed is true)
   * @default "5,5"
   */
  accentDashPattern?: string;
  /**
   * Radius of the bottom-center radial fade as a percent of the width (0..1).
   * @default 0.65
   */
  radialRadiusPercent?: number;
  /**
   * Enable top arc gradient that fades the upper corners and edge
   * @default false
   */
  enableTopArc?: boolean;
  /**
   * Radius of the top corner fade as a percent of the min(width,height) (0..1).
   * @default 0.08
   */
  topCornerRadiusPercent?: number;
  /**
   * Height of the top edge fade band as a percent of the height (0..1).
   * @default 0.08
   */
  topEdgeHeightPercent?: number;
  /**
   * Enable focused fade-out effect at the bottom center that hides grid in a circular area.
   * Creates a circular mask where the center is hidden and fades to visible at the edges.
   * Like placing a half-circle "sticker" over the bottom center that fades from opaque to transparent.
   * The circle size is controlled by centerFadeRadius, and fade sharpness by centerFadeIntensity.
   * @default false
   */
  enableCenterFade?: boolean;
  /**
   * Radius of the center fade circle as a percent of the viewBox width (0..1).
   * Controls how wide the clear center area extends from the bottom center point.
   * @default 0.3
   */
  centerFadeRadius?: number;
  /**
   * Intensity of the center fade transition (0..1).
   * Lower values create a sharp transition, higher values create a smoother fade.
   * @default 0.5
   */
  centerFadeIntensity?: number;
}

/**
 * A reusable SVG grid pattern component that creates elegant grid backgrounds.
 * Inspired by Dub's grid pattern implementation.
 *
 * Features:
 * - Fully customizable color, opacity, and stroke width
 * - SVG-based for crisp scaling at any screen size
 * - Performance optimized with single SVG element
 * - Gradient masks for sophisticated fade effects
 * - Focused center fade effect with circular mask for half-circle "sticker" hiding
 * - Accent lines for visual emphasis
 * - TypeScript support with comprehensive props interface
 *
 * @example
 * // Basic usage with defaults
 * <GridPattern />
 *
 * @example
 * // With gradients and accent lines (Dub-style)
 * <GridPattern
 *   enableGradients={true}
 *   enableTopArc={true}
 *   enableAccentLines={true}
 *   gridColumns={20}
 *   accentLinePositionPercent={0.25}
 *   gridOpacity={0.12}
 *   accentOpacity={0.45}
 *   accentStrokeWidth={1.8}
 *   accentColor="#111827"
 * />
 *
 * @example
 * // With focused center fade effect (hides center, reveals edges)
 * <GridPattern
 *   enableCenterFade={true}
 *   centerFadeRadius={0.4}
 *   centerFadeIntensity={0.3}
 *   gridOpacity={0.1}
 * />
 *
 * @example
 * // Combining center fade with other effects (center hidden, edges visible)
 * <GridPattern
 *   enableGradients={true}
 *   enableCenterFade={true}
 *   centerFadeRadius={0.25}
 *   centerFadeIntensity={0.7}
 *   enableAccentLines={true}
 *   accentLinePositionPercent={0.2}
 * />
 *
 * @example
 * // Custom styling with dashed accent lines
 * <GridPattern
 *   gridColumns={16}
 *   color="#374151"
 *   opacity={0.08}
 *   strokeWidth={1.2}
 *   enableAccentLines={true}
 *   accentDashed={true}
 *   accentDashPattern="8,4"
 *   patternId="custom-grid"
 * />
 */
export const GridPattern: React.FC<GridPatternProps> = ({
  gridColumns = 20,
  strokeWidth = 0.8,
  color = '#6b7280',
  opacity = 0.12,
  gridOpacity,
  accentOpacity,
  patternId = 'grid-pattern',
  className = '',
  style = {},
  enableGradients = false,
  enableAccentLines = false,
  accentLinePositionPercent,
  snapAccentToGrid = true,
  accentStrokeWidth = 1.5,
  accentColor = '#374151',
  accentDashed = false,
  accentDashPattern = '5,5',
  radialRadiusPercent = 0.65,
  enableTopArc = false,
  topCornerRadiusPercent = 0.1,
  topEdgeHeightPercent = 0.06,
  enableCenterFade = false,
  centerFadeRadius = 0.3,
  centerFadeIntensity = 0.5,
}) => {
  // Always use content-based sizing driven by gridColumns
  const [viewportWidth, setViewportWidth] = React.useState(
    typeof window !== 'undefined' ? document.documentElement.clientWidth : 1920
  );

  React.useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(document.documentElement.clientWidth);
    };

    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  // Derive the effective cell size from the content width
  const cellSize: number = viewportWidth / gridColumns;
  const viewBoxWidth = viewportWidth;
  const viewBoxHeight = cellSize * gridColumns;


  // Calculate accent line positions based on percent
  const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

  let leftAccentX = 0;
  let rightAccentX = viewBoxWidth;

  if (typeof accentLinePositionPercent === 'number') {
    const p = clamp01(accentLinePositionPercent);
    leftAccentX = p * viewBoxWidth;
    rightAccentX = (1 - p) * viewBoxWidth;
  } else if (
    Array.isArray(accentLinePositionPercent) &&
    accentLinePositionPercent.length === 2
  ) {
    const [lp, rp] = accentLinePositionPercent;
    leftAccentX = clamp01(lp) * viewBoxWidth;
    rightAccentX = clamp01(rp) * viewBoxWidth;
  }

  if (snapAccentToGrid) {
    const snap = (x: number): number => Math.round(x / cellSize) * cellSize;
    leftAccentX = snap(leftAccentX);
    rightAccentX = snap(rightAccentX);
  }

  // Generate mask ID for gradients
  const maskId = `${patternId}-mask`;

  // Determine if we need any masking - temporarily only center fade for debugging
  const needsMask = enableCenterFade; // enableGradients || enableTopArc || enableCenterFade;

  // Create gradient mask definition
  const gradientMaskDef = needsMask ? (
    <defs>
      <mask
        id={maskId}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={viewBoxWidth}
        height={viewBoxHeight}
      >
        {/* Base mask - fully visible */}
        <rect width="100%" height="100%" fill="white" />

        {/* Vertical gradient from top to bottom (reveals bottom) */}
        {enableGradients && (
          <rect
            width="100%"
            height="100%"
            fill={`url(#${patternId}-vertical-gradient)`}
          />
        )}

        {/* Radial gradient for bottom center fade (reveals center) - applied first if no center fade */}
        {enableGradients && !enableCenterFade && (
          <rect
            width="100%"
            height="100%"
            fill={`url(#${patternId}-radial-gradient)`}
          />
        )}

        {/* Center fade gradient for focused bottom center hiding - applied last to override other effects */}
        {enableCenterFade && (
          <circle
            cx="50%"
            cy="60%"
            r={`${Math.round(centerFadeRadius * 100)}%`}
            fill={`url(#${patternId}-center-fade-gradient)`}
          />
        )}

        {/* Top edge fade that rounds upper corners */}
        {enableTopArc && (
          <>
            {/* Confine fades to a thin band at the top */}
            <g>
              {/* Top-left corner fade */}
              <circle
                cx={0}
                cy={0}
                r={
                  Math.min(viewBoxWidth, viewBoxHeight) * topCornerRadiusPercent
                }
                fill={`url(#${patternId}-top-left-gradient)`}
              />
              {/* Top-center horizontal band fade */}
              <rect
                x={0}
                y={0}
                width={viewBoxWidth}
                height={viewBoxHeight * topEdgeHeightPercent}
                fill={`url(#${patternId}-top-center-gradient)`}
              />
              {/* Top-right corner fade */}
              <circle
                cx={viewBoxWidth}
                cy={0}
                r={
                  Math.min(viewBoxWidth, viewBoxHeight) * topCornerRadiusPercent
                }
                fill={`url(#${patternId}-top-right-gradient)`}
              />
            </g>
          </>
        )}
      </mask>

      {/* Vertical gradient definition */}
      {enableGradients && (
        <linearGradient
          id={`${patternId}-vertical-gradient`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      )}

      {/* Bottom radial gradient definition */}
      {enableGradients && (
        <radialGradient
          id={`${patternId}-radial-gradient`}
          cx="50%"
          cy="100%"
          r={`${Math.round(radialRadiusPercent * 100)}%`}
        >
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="white" />
        </radialGradient>
      )}

      {/* Center fade gradient definition - creates focused hide effect */}
      {enableCenterFade && (
        <radialGradient
          id={`${patternId}-center-fade-gradient`}
          cx="50%"
          cy="100%"
          r="100%"
        >
          <stop offset="0%" stopColor="black" stopOpacity="1" />
          <stop offset={`${Math.round(centerFadeIntensity * 100)}%`} stopColor="black" stopOpacity="0.8" />
          <stop offset="80%" stopColor="black" stopOpacity="0.2" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      )}

      {/* Top corner and edge gradient definitions */}
      {enableTopArc && (
        <>
          {/* Top-left corner fade */}
          <radialGradient
            id={`${patternId}-top-left-gradient`}
            gradientUnits="userSpaceOnUse"
            cx={0}
            cy={0}
            r={Math.min(viewBoxWidth, viewBoxHeight) * topCornerRadiusPercent}
          >
            <stop offset="0%" stopColor="black" stopOpacity={1} />
            <stop offset="35%" stopColor="black" stopOpacity={1} />
            <stop offset="65%" stopColor="black" stopOpacity={0.35} />
            <stop offset="100%" stopColor="black" stopOpacity={0} />
          </radialGradient>

          {/* Top-center horizontal fade */}
          <linearGradient
            id={`${patternId}-top-center-gradient`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={0}
            y2={viewBoxHeight * topEdgeHeightPercent}
          >
            <stop offset="0%" stopColor="black" stopOpacity={1} />
            <stop offset="35%" stopColor="black" stopOpacity={1} />
            <stop offset="70%" stopColor="black" stopOpacity={0.35} />
            <stop offset="100%" stopColor="black" stopOpacity={0} />
          </linearGradient>

          {/* Top-right corner fade */}
          <radialGradient
            id={`${patternId}-top-right-gradient`}
            gradientUnits="userSpaceOnUse"
            cx={viewBoxWidth}
            cy={0}
            r={Math.min(viewBoxWidth, viewBoxHeight) * topCornerRadiusPercent}
          >
            <stop offset="0%" stopColor="black" stopOpacity={1} />
            <stop offset="35%" stopColor="black" stopOpacity={1} />
            <stop offset="65%" stopColor="black" stopOpacity={0.35} />
            <stop offset="100%" stopColor="black" stopOpacity={0} />
          </radialGradient>
        </>
      )}
    </defs>
  ) : null;

  // Calculate effective opacities
  const effectiveGridOpacity = gridOpacity ?? opacity;
  const effectiveAccentOpacity = accentOpacity ?? opacity;

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={style}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        {/* Main grid pattern */}
        <pattern
          id={patternId}
          x="0"
          y="0"
          width={cellSize}
          height={cellSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </pattern>

        {/* Gradient mask definitions */}
        {gradientMaskDef}
      </defs>

      {/* Main grid background */}
      <rect
        width="100%"
        height="100%"
        fill={`url(#${patternId})`}
        mask={needsMask ? `url(#${maskId})` : undefined}
        opacity={effectiveGridOpacity}
      />

      {/* Accent lines overlay (non-repeating, percent-aware) */}
      {enableAccentLines && (
        <g
          mask={needsMask ? `url(#${maskId})` : undefined}
          opacity={effectiveAccentOpacity}
        >
          <line
            x1={leftAccentX}
            y1={0}
            x2={leftAccentX}
            y2={viewBoxHeight}
            stroke={accentColor}
            strokeWidth={accentStrokeWidth}
            strokeDasharray={accentDashed ? accentDashPattern : undefined}
          />
          <line
            x1={rightAccentX}
            y1={0}
            x2={rightAccentX}
            y2={viewBoxHeight}
            stroke={accentColor}
            strokeWidth={accentStrokeWidth}
            strokeDasharray={accentDashed ? accentDashPattern : undefined}
          />
        </g>
      )}
    </svg>
  );
};

export default GridPattern;
