/**
 * Landing Page Component
 *
 * Main landing page for the application showcasing key features and value proposition.
 */
import { Nav } from '../components/nav';
import { DarkSection } from '../components/dark-section';
import { HeroSection } from '../components/sections/hero-section';
import { BottomSection } from '../components/sections/bottom-section';
import { IntegrationsSection } from '../components/sections/integrations-section';
import { ThinSeparatorSection } from '../components/sections/thin-separator-section';

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

// Grid-aligned percents for the SVG so lines land exactly on DOM grid lines
const leftPercent = (LEFT_LINE - 1) / GRID_COLUMNS;
const rightPercent = (RIGHT_LINE - 1) / GRID_COLUMNS;

// Reusable style for 24-column grid without relying on Tailwind config
const gridTemplateColumns24: React.CSSProperties = {
  gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
};

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Navigation - positioned absolutely at the top */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <Nav />
      </div>

      {/* Hero Section */}
      <HeroSection
        gridColumns={GRID_COLUMNS}
        accentPositionPercent={ACCENT_POSITION_PERCENT}
        accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
        accentOpacity={ACCENT_OPACITY}
        leftPercent={leftPercent}
        rightPercent={rightPercent}
        gridTemplateColumns={gridTemplateColumns24}
        leftLine={LEFT_LINE}
        rightLine={RIGHT_LINE}
      />
      <ThinSeparatorSection
        gridColumns={GRID_COLUMNS}
        accentPositionPercent={ACCENT_POSITION_PERCENT}
        accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
        accentOpacity={ACCENT_OPACITY}
        gridTemplateColumns={gridTemplateColumns24}
        leftLine={LEFT_LINE}
        rightLine={RIGHT_LINE}
      />

      {/* Bottom Section (grid-aligned) */}
      <BottomSection
        gridColumns={GRID_COLUMNS}
        gridTemplateColumns={gridTemplateColumns24}
        leftLine={LEFT_LINE}
        rightLine={RIGHT_LINE}
      />

      <ThinSeparatorSection
        gridColumns={GRID_COLUMNS}
        accentPositionPercent={ACCENT_POSITION_PERCENT}
        accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
        accentOpacity={ACCENT_OPACITY}
        gridTemplateColumns={gridTemplateColumns24}
        leftLine={LEFT_LINE}
        rightLine={RIGHT_LINE}
      />

      {/* Integrations Section */}
      <IntegrationsSection
        gridColumns={GRID_COLUMNS}
        accentPositionPercent={ACCENT_POSITION_PERCENT}
        accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
        accentOpacity={ACCENT_OPACITY}
        gridTemplateColumns={gridTemplateColumns24}
        leftLine={LEFT_LINE}
      />

      <ThinSeparatorSection
        gridColumns={GRID_COLUMNS}
        accentPositionPercent={ACCENT_POSITION_PERCENT}
        accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
        accentOpacity={ACCENT_OPACITY}
        gridTemplateColumns={gridTemplateColumns24}
        leftLine={LEFT_LINE}
        rightLine={RIGHT_LINE}
      />

      {/* Dark Section with faint grid (bottom of page) */}
      <DarkSection />
    </div>
  );
}
