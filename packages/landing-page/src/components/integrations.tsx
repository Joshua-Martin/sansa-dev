/**
 * Integrations Component
 *
 * Displays a grid of integration logos with a background grid pattern.
 * Uses a sprite sheet approach for efficient logo rendering.
 * Grid sizing is responsive: cell size = window.innerWidth / gridColumns.
 */
'use client';

import React from 'react';

/**
 * Configuration for integration logo positions in the sprite sheet.
 * Each logo is positioned at a specific percentage offset.
 */
const INTEGRATION_LOGOS = {
  CLAUDE: 0, // 0%
  OPENAI: 100, // 100%
  GEMINI: 200, // 200%
  PERPLEXITY: 300, // 300%
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
   * Whether to show the grid background pattern.
   * @default true
   */
  showGrid?: boolean;
  /**
   * Grid pattern ID for SVG defs.
   * @default "integrations-grid"
   */
  gridPatternId?: string;
  /**
   * Number of grid columns across the viewport. Cell size is computed as
   * window.innerWidth / gridColumns so the column count stays fixed across screen sizes.
   * @default 20
   */
  gridColumns?: number;
  /**
   * Stroke width of the grid lines.
   * @default 2
   */
  strokeWidth?: number;
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
 * Creates logo positions based on grid size and predefined layout.
 * @param gridSize - The current grid cell size in pixels
 * @returns Array of logo positions
 */
const createLogoPositions = (gridSize: number): IntegrationLogo[] => [
  // Main logos - positioned at specific grid coordinates
  {
    backgroundPositionX: INTEGRATION_LOGOS.CLAUDE,
    top: gridSize * 1,
    left: gridSize * 7,
  },
  {
    backgroundPositionX: INTEGRATION_LOGOS.OPENAI,
    top: gridSize * 2,
    left: gridSize * 9,
  },
  {
    backgroundPositionX: INTEGRATION_LOGOS.GEMINI,
    top: gridSize * 1,
    left: gridSize * 10,
  },
  {
    backgroundPositionX: INTEGRATION_LOGOS.PERPLEXITY,
    top: gridSize * 3,
    left: gridSize * 11,
  },
  // Faded logos for background effect (one shadow per regular logo, clustered within bounds)
  {
    backgroundPositionX: INTEGRATION_LOGOS.CLAUDE,
    top: gridSize * 2,
    left: gridSize * 6,
    isFaded: true,
  },
  {
    backgroundPositionX: INTEGRATION_LOGOS.OPENAI,
    top: gridSize * 1,
    left: gridSize * 13,
    isFaded: true,
  },
  {
    backgroundPositionX: INTEGRATION_LOGOS.GEMINI,
    top: gridSize * 3,
    left: gridSize * 8,
    isFaded: true,
  },
  {
    backgroundPositionX: INTEGRATION_LOGOS.PERPLEXITY,
    top: gridSize * 2,
    left: gridSize * 12,
    isFaded: true,
  },
];

/**
 * Integrations component that displays a grid of integration logos.
 *
 * @param props - Component props
 * @returns JSX element
 */
export function Integrations({
  logosImageUrl = '/assets/ai-integration-logos.png',
  showGrid = true,
  gridPatternId = 'integrations-grid',
  gridColumns = 20,
  strokeWidth = 2,
}: IntegrationsProps) {
  const [viewportWidth, setViewportWidth] = React.useState(
    typeof window !== 'undefined' ? document.documentElement.clientWidth : 1920
  );
  const [cellSize, setCellSize] = React.useState(
    typeof window !== 'undefined'
      ? document.documentElement.clientWidth / gridColumns
      : 60
  );
  React.useEffect(() => {
    const updateViewportWidth = () => {
      const width = document.documentElement.clientWidth;
      setViewportWidth(width);
      setCellSize(width / gridColumns);
    };

    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, [gridColumns]);

  const gridHeight = cellSize * 5;

  return (
    <>
      {/* Height placeholder to influence parent container height */}
      <div
        className={`opacity-0 w-full pointer-events-none`}
        aria-hidden="true"
        style={{ height: `${gridHeight}px` }}
      />

      {/* Absolutely positioned integrations content */}
      <div
        className={`absolute`}
        style={{
          left: `${0}px`,
          height: `${gridHeight}px`,
          width: `${viewportWidth}px`,
        }}
      >
        {/* Grid background pattern */}
        {showGrid && (
          <svg
            className="pointer-events-none absolute text-neutral-200 [mask-image:linear-gradient(transparent,black,transparent)] md:[mask-image:linear-gradient(90deg,transparent,black_70%,transparent)]"
            width="100%"
            height="100%"
            viewBox={`0 0 ${viewportWidth} ${gridHeight}`}
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id={gridPatternId}
                x="0"
                y="0"
                width={cellSize}
                height={cellSize}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
                  fill="transparent"
                  stroke="#00000040"
                  strokeWidth={strokeWidth}
                />
              </pattern>
            </defs>
            <rect fill={`url(#${gridPatternId})`} width="100%" height="100%" />
          </svg>
        )}

        {/* Integration logos container */}
        <div className="absolute inset-0">
          {createLogoPositions(cellSize).map((logo, index) => (
            <div
              key={index}
              className={`absolute rounded-lg bg-gradient-to-b from-neutral-100 to-white ${
                logo.isFaded
                  ? 'opacity-30 shadow-[0_2px_6px_0_#0003_inset]'
                  : 'shadow-md'
              }`}
              style={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                top: `${logo.top}px`,
                left: `${logo.left}px`,
                ...(logo.isFaded
                  ? {}
                  : {
                      backgroundImage: `url(${logosImageUrl})`,
                      backgroundSize: '400%',
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
