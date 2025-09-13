/**
 * Integrations Component
 *
 * Displays a grid of integration logos with a background grid pattern.
 * Uses a sprite sheet approach for efficient logo rendering.
 */

import React from 'react';

/**
 * Configuration for integration logo positions in the sprite sheet.
 * Each logo is positioned at a specific percentage offset.
 */
const INTEGRATION_LOGOS = {
  SLACK: 200, // 200%
  SPLITBEE: 700, // 700%
  GOOGLE_TAG_MANAGER: 900, // 900%
  MUX: 600, // 600%
  STRIPE: 100, // 100%
  WORDPRESS: 500, // 500%
  SHOPIFY: 800, // 800%
  VERCEL: 400, // 400%
  ZAPIER: 300, // 300%
} as const;

/**
 * Props for the Integrations component.
 */
interface IntegrationsProps {
  /**
   * URL to the integration logos sprite sheet image.
   * @default "/integration-logos.png"
   */
  logosImageUrl?: string;
  /**
   * Custom CSS class name for the container.
   */
  className?: string;
  /**
   * Whether to show the grid background pattern.
   * @default true
   */
  showGrid?: boolean;
  /**
   * Grid pattern ID for SVG defs.
   * @default "integrations-grid"
   */
  gridPatternId?: string;
}

/**
 * Integration logo item configuration.
 */
interface IntegrationLogo {
  /**
   * Position of the logo in the sprite sheet (as percentage).
   */
  backgroundPositionX: number;
  /**
   * Top position in pixels.
   */
  top: number;
  /**
   * Left position in pixels.
   */
  left: number;
  /**
   * Whether this logo should have reduced opacity (faded effect).
   * @default false
   */
  isFaded?: boolean;
}

/**
 * Predefined logo positions matching the original design.
 */
const LOGO_POSITIONS: IntegrationLogo[] = [
  { backgroundPositionX: INTEGRATION_LOGOS.SLACK, top: 239, left: 599 },
  { backgroundPositionX: INTEGRATION_LOGOS.SPLITBEE, top: 119, left: 659 },
  { backgroundPositionX: INTEGRATION_LOGOS.GOOGLE_TAG_MANAGER, top: 359, left: 719 },
  { backgroundPositionX: INTEGRATION_LOGOS.MUX, top: 59, left: 779 },
  { backgroundPositionX: INTEGRATION_LOGOS.STRIPE, top: 179, left: 779 },
  { backgroundPositionX: INTEGRATION_LOGOS.WORDPRESS, top: 299, left: 839 },
  { backgroundPositionX: INTEGRATION_LOGOS.SHOPIFY, top: 239, left: 899 },
  { backgroundPositionX: INTEGRATION_LOGOS.VERCEL, top: 119, left: 1019 },
  { backgroundPositionX: INTEGRATION_LOGOS.ZAPIER, top: 359, left: 1079 },
  // Faded logos for background effect
  { backgroundPositionX: INTEGRATION_LOGOS.SLACK, top: 119, left: 539, isFaded: true },
  { backgroundPositionX: INTEGRATION_LOGOS.SLACK, top: 359, left: 599, isFaded: true },
  { backgroundPositionX: INTEGRATION_LOGOS.STRIPE, top: 299, left: 659, isFaded: true },
  { backgroundPositionX: INTEGRATION_LOGOS.SHOPIFY, top: 119, left: 899, isFaded: true },
  { backgroundPositionX: INTEGRATION_LOGOS.SHOPIFY, top: 359, left: 959, isFaded: true },
  { backgroundPositionX: INTEGRATION_LOGOS.WORDPRESS, top: 299, left: 1019, isFaded: true },
];

/**
 * Integrations component that displays a grid of integration logos.
 *
 * @param props - Component props
 * @returns JSX element
 */
export function Integrations({
  logosImageUrl = '/integration-logos.png',
  className = '',
  showGrid = true,
  gridPatternId = 'integrations-grid',
}: IntegrationsProps) {
  return (
    <>
      {/* Height placeholder to influence parent container height */}
      <div className="h-[360px] md:h-[480px] opacity-0 pointer-events-none" aria-hidden="true" />

      {/* Absolutely positioned integrations content */}
      <div
        className={`absolute left-[-590px] h-[360px] w-[1600px] max-md:bottom-0 max-md:[mask-image:linear-gradient(black_80%,transparent)] md:-left-px md:top-1/2 md:h-[480px] md:-translate-y-1/2 ${className}`}
      >
      {/* Grid background pattern */}
      {showGrid && (
        <svg
          className="pointer-events-none absolute inset-0 text-neutral-200 [mask-image:linear-gradient(transparent,black,transparent)] md:[mask-image:linear-gradient(90deg,transparent,black_70%,transparent)]"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id={gridPatternId}
              x="-1"
              y="-1"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="2"
              />
            </pattern>
          </defs>
          <rect fill={`url(#${gridPatternId})`} width="100%" height="100%" />
        </svg>
      )}

      {/* Integration logos container */}
      <div className="absolute inset-0">
        {LOGO_POSITIONS.map((logo, index) => (
          <div
            key={index}
            className={`absolute rounded-lg bg-gradient-to-b from-neutral-100 to-white ${
              logo.isFaded ? 'opacity-30 shadow-[0_2px_6px_0_#0003_inset]' : 'shadow-md'
            }`}
            style={{
              width: '61px',
              height: '61px',
              top: `${logo.top}px`,
              left: `${logo.left}px`,
              ...(logo.isFaded ? {} : {
                backgroundImage: `url(${logosImageUrl})`,
                backgroundSize: '900%',
                backgroundPositionX: `${logo.backgroundPositionX}%`,
              }),
            }}
          >
            <div className="absolute inset-0 rounded-[inherit] border border-black/20 [mask-image:linear-gradient(#000a,black)]" />
          </div>
        ))}
      </div>
      </div>
    </>
  );
}

export default Integrations;
