import { FolderDip } from './folder-dip';
import { AccentBorders } from './accent-borders';

/**
 * Grid alignment constants shared across sections to match `GridPattern` accent lines.
 * These ensure that borders and content alignment remain consistent with the SVG grid.
 */
const GRID_COLUMNS = 24;
const ACCENT_POSITION_PERCENT = 0.15;
const ACCENT_STROKE_WIDTH_PX = 1;
const ACCENT_OPACITY = 0.45;

// Symmetric grid line indices based on single rounded left line
const LEFT_LINE = Math.round(ACCENT_POSITION_PERCENT * GRID_COLUMNS);
const RIGHT_LINE = GRID_COLUMNS - LEFT_LINE + 2;

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
 * Middle Separator Component
 *
 * Creates a visual separator that splits the page into sections with folder-like dips.
 * The dips are white cut-outs that create the folder effect against the gray background.
 */
export function MiddleSeparator() {
  return (
    <div className="relative w-full h-[60px] flex-1 flex items-center">
      {/* Base gray background layer */}
      <div className="absolute inset-0 bg-dark-background" />

      {/* Content layer with grid alignment */}
      <div className="relative z-10 grid items-stretch h-full min-h-0 w-full" style={{ ...gridTemplateColumns24, gridTemplateRows: '1fr' }}>
        {/* Left side to left accent line - transparent to show gray background */}
        <div
          className="relative h-full"
          style={{ gridColumn: `1 / ${LEFT_LINE}` }}
        />

        {/* Center band between accent lines */}
        <div
          style={{ gridColumn: `${LEFT_LINE} / ${RIGHT_LINE}` }}
          className="relative h-full"
        >
          <div className="flex h-full w-full items-stretch">
            {/* Left gray filler - transparent to show background */}
            <div className="h-full" style={{ width: `${LEFT_FILLER_FRACTION * 100}%` }} />

            {/* Left dip container with gray background */}
            <div className="relative h-full bg-dark-background" style={{ width: `${DIP_FRACTION * 100}%` }}>
              {/* White dip cut-out on top */}
              <div className="absolute inset-0">
                <FolderDip direction="left" color="white" className="w-full h-full" />
              </div>
            </div>

            {/* Center white band */}
            <div className="bg-white h-full" style={{ width: `${CENTER_WHITE_FRACTION * 100}%` }} />

            {/* Right dip container with gray background */}
            <div className="relative h-full bg-dark-background" style={{ width: `${DIP_FRACTION * 100}%` }}>
              {/* White dip cut-out on top */}
              <div className="absolute inset-0">
                <FolderDip direction="right" color="white" className="w-full h-full" />
              </div>
            </div>

            {/* Right gray filler - transparent to show background */}
            <div className="h-full" style={{ width: `${RIGHT_FILLER_FRACTION * 100}%` }} />
          </div>
        </div>

        {/* Right side from right accent line to edge - transparent to show gray background */}
        <div
          className="relative h-full"
          style={{ gridColumn: `${RIGHT_LINE} / ${GRID_COLUMNS + 1}` }}
        />
      </div>

      {/* Overlay accent borders to match hero and bottom sections */}
      <AccentBorders
        className="hidden md:block z-20"
        gridColumns={GRID_COLUMNS}
        accentPositionPercent={ACCENT_POSITION_PERCENT}
        variant="dark"
        accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
        accentOpacity={ACCENT_OPACITY}
      />
    </div>
  );
}
