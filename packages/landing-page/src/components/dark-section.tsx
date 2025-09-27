import { FolderDip } from './folder-dip';
import { AccentBorders } from './accent-borders';
import { GridPattern } from './grid-bg';
import { WaitlistForm } from './custom/waitlist-form';

/**
 * Grid alignment constants shared across sections to match `GridPattern` accent lines.
 * These ensure that borders and content alignment remain consistent with the SVG grid.
 */
const GRID_COLUMNS = 24;
const ACCENT_POSITION_PERCENT = 0.2;
const ACCENT_STROKE_WIDTH_PX = 1;
const ACCENT_OPACITY = 0.45;

// Symmetric grid line indices based on single rounded left line
const LEFT_LINE = Math.round(ACCENT_POSITION_PERCENT * GRID_COLUMNS);
const RIGHT_LINE = GRID_COLUMNS - LEFT_LINE + 2;

// Grid-aligned percents for the SVG so lines land exactly on DOM grid lines
const leftPercent = (LEFT_LINE - 1) / GRID_COLUMNS;
const rightPercent = (RIGHT_LINE - 1) / GRID_COLUMNS;

// Reusable style for 24-column grid without relying on Tailwind config
const gridTemplateColumns24: React.CSSProperties = {
  gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
};

// Center-band grid mirrors the background cell size exactly
const CENTER_COLUMNS = RIGHT_LINE - LEFT_LINE;
const LEFT_DIP_COL = 5; // 5th from left
const RIGHT_DIP_COL = CENTER_COLUMNS - 4; // 5th from right

// Flex fractions for the center band when not using an inner grid
const LEFT_FILLER_FRACTION = (LEFT_DIP_COL - 1) / CENTER_COLUMNS;
const DIP_FRACTION = 1 / CENTER_COLUMNS;
const CENTER_WHITE_FRACTION = (RIGHT_DIP_COL - LEFT_DIP_COL - 1) / CENTER_COLUMNS;
const RIGHT_FILLER_FRACTION = (CENTER_COLUMNS - RIGHT_DIP_COL) / CENTER_COLUMNS;

/**
 * Dark Section Component
 *
 * The bottom section of the landing page with a dark background, grid pattern,
 * and folder cutouts at the top. Contains marketing content and call-to-action buttons.
 */
export function DarkSection() {
  return (
    <div className="relative bg-dark-background text-white">
      {/* Grid pattern background */}
      <AccentBorders
        className="hidden md:block z-30"
        gridColumns={GRID_COLUMNS}
        accentPositionPercent={ACCENT_POSITION_PERCENT}
        accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
        accentOpacity={0.2}
      />

      <GridPattern
        patternId="dark-section-grid-pattern"
        gridColumns={GRID_COLUMNS}  
        strokeWidth={0.8}
        color="#ffffff"
        gridOpacity={0.3}
        accentOpacity={ACCENT_OPACITY}
        enableGradients={true}
        enableTopArc={true}
        enableAccentLines={false}
        accentLinePositionPercent={[leftPercent, rightPercent]}
        snapAccentToGrid={true}
        accentStrokeWidth={0}
        topCornerRadiusPercent={0.8}
        topEdgeHeightPercent={0.6}
        radialRadiusPercent={0.5}
        enableCenterFade={true}
        centerFadeRadius={0.25}
        centerFadeIntensity={0.5}
        accentColor="#ffffff"
        className="absolute inset-0 z-10"
      />

      {/* Top row with white folder cutouts - positioned at top edge */}
      <div className="relative z-20 h-[60px]">
        <div className="grid h-full w-full" style={{ ...gridTemplateColumns24, gridTemplateRows: '1fr' }}>
          {/* Left side to left accent line */}
          <div style={{ gridColumn: `1 / ${LEFT_LINE}` }} />

          {/* Center band between accent lines */}
          <div style={{ gridColumn: `${LEFT_LINE} / ${RIGHT_LINE}` }} className="relative h-full">
            <div className="flex h-full w-full items-stretch relative">
              {/* Left filler */}
              <div className="h-full" style={{ width: `${LEFT_FILLER_FRACTION * 100}%` }} />

              {/* Left dip container with white cutout */}
              <div className="relative h-full" style={{ width: `${DIP_FRACTION * 100}%` }}>
                <div className="absolute inset-0">
                  <FolderDip direction="left" color="white" className="w-full h-full" />
                </div>
              </div>

              {/* Center white cutout */}
              <div className="bg-white h-full" style={{ width: `${CENTER_WHITE_FRACTION * 100}%` }} />

              {/* Right dip container with white cutout */}
              <div className="relative h-full" style={{ width: `${DIP_FRACTION * 100}%` }}>
                <div className="absolute inset-0">
                  <FolderDip direction="right" color="white" className="w-full h-full" />
                </div>
              </div>

              {/* Right filler */}
              <div className="h-full" style={{ width: `${RIGHT_FILLER_FRACTION * 100}%` }} />
            </div>
          </div>

          {/* Right side from right accent line to edge */}
          <div style={{ gridColumn: `${RIGHT_LINE} / ${GRID_COLUMNS + 1}` }} />
        </div>

      </div>

      {/* Main content area */}
      <div className="relative z-30 py-20 sm:py-28">
        <div className="grid w-full px-4 sm:px-6 lg:px-8" style={gridTemplateColumns24}>
          {/* Left column (empty on md+) */}
          <div className="hidden md:block" style={{ gridColumn: `1 / ${LEFT_LINE}` }} />

          {/* Center content between accent lines - split into two columns */}
          <div style={{ gridColumn: `${LEFT_LINE} / ${RIGHT_LINE}` }} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left column - AI cost optimization messaging */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Optimize your AI pipeline costs</h2>
              <p className="text-lg sm:text-xl text-white/70 mb-8">
                Reduce AI API costs by up to 50% while maintaining performance.
                Join the waitlist to be among the first to access intelligent routing.
              </p>
            </div>

            {/* Right column - Waitlist form */}
            <div className="flex justify-center lg:justify-end">
              <WaitlistForm />
            </div>
          </div>

          {/* Right column (empty on md+) */}
          <div className="hidden md:block" style={{ gridColumn: `${RIGHT_LINE} / ${GRID_COLUMNS + 1}` }} />
        </div>
      </div>
    </div>
  );
}
