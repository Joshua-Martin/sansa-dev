/**
 * Landing Page Component
 *
 * Main landing page for the application showcasing key features and value proposition.
 */

import { GridPattern } from '../components/grid-bg';
import { AccentBorders } from '../components/accent-borders';
import DotsBg from '@/components/dots-bg';
import { Integrations } from '../components/integrations';
import { Nav } from '../components/nav';
import { BelowFold } from '../components/below-fold';
import { MiddleSeparator } from '../components/middle-separator';
import { DarkSection } from '../components/dark-section';

/**
 * Grid alignment constants shared across sections to match `GridPattern` accent lines.
 * These ensure that borders and content alignment remain consistent with the SVG grid.
 */
const GRID_COLUMNS = 24;
const ACCENT_POSITION_PERCENT = 0.2;
const ACCENT_COLOR = '#000000';
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
      <div className="relative bg-white pt-20">
        <GridPattern
          patternId="hero-grid-pattern"
          columns={GRID_COLUMNS}
          strokeWidth={0.8}
          color="#6b7280"
          gridOpacity={0.3}
          accentOpacity={ACCENT_OPACITY}
          enableGradients={true}
          enableTopArc={true}
          enableAccentLines={false}
          accentLinePositionPercent={[leftPercent, rightPercent]}
          snapAccentToGrid={true}
          accentStrokeWidth={0}
          topCornerRadiusPercent={0.8}
          topEdgeHeightPercent={0.7}
          radialRadiusPercent={0.8}
          enableCenterFade={true}
          centerFadeRadius={0.25}
          centerFadeIntensity={0.5}
          
        />

        {/* Content aligned to 24-col grid */}
        <div className="relative z-10 pt-24 pb-16 sm:pt-28 sm:pb-24">
          <div className="grid w-full px-4 sm:px-6 lg:px-8" style={gridTemplateColumns24}>
            {/* Left column (empty on md+, becomes padding on small) */}
            <div className="hidden md:block" style={{ gridColumn: `1 / ${LEFT_LINE}` }} />

            {/* Center content between accent lines */}
            <div
              style={{ gridColumn: `${LEFT_LINE} / ${RIGHT_LINE}` }}
              className="mx-auto max-w-4xl text-center"
            >
              <h1 className="text-7xl font-bold text-gray-900 mb-6">
                  LLM cost optimization & routing
                  
                </h1>
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
                Stop overpaying for AI. Intelligent routing, instant failover, and complete cost visibility.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                  Start Optimizing
                </button>
                <button className="px-8 py-3 border border-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  See How It Works
                </button>
              </div>
            </div>

            {/* Right column (empty on md+) */}
            <div className="hidden md:block" style={{ gridColumn: `${RIGHT_LINE} / ${GRID_COLUMNS + 1}` }} />
          </div>

          {/* Overlay accent borders on md+ so they align with the SVG accents */}
          <AccentBorders
            className="hidden md:block"
            gridColumns={GRID_COLUMNS}
            accentPositionPercent={ACCENT_POSITION_PERCENT}
            
            accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
            accentOpacity={ACCENT_OPACITY}
            enableFadeOut={true}
            fadeOutStartPercent={0.3}
            fadeOutEndPercent={0.9}
          />
        </div>
      </div>

      {/* Middle Separator */}
      <MiddleSeparator />

      {/* Bottom Section (grid-aligned) */}
      <div className="relative bg-dark-background text-gray-900 border-b border-accent-border">
        <div className="relative w-full py-20">
          <div className="grid w-full" style={gridTemplateColumns24}>
            {/* Left side */}
            <div style={{ gridColumn: `1 / ${LEFT_LINE}` }} />

            {/* Center area with white rounded component */}
            <div
              style={{ gridColumn: `${LEFT_LINE} / ${RIGHT_LINE}` }}
              className="bg-dark-background flex items-center justify-center px-6"
            >
              <BelowFold />
            </div>

            {/* Right side */}
            <div style={{ gridColumn: `${RIGHT_LINE} / ${GRID_COLUMNS + 1}` }} />
          </div>

          {/* Overlay accent borders on md+ */}
          <AccentBorders
            className="hidden md:block"
            gridColumns={GRID_COLUMNS}
            accentPositionPercent={ACCENT_POSITION_PERCENT}
            variant="dark"
            accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
            accentOpacity={ACCENT_OPACITY}
          />
        </div>
      </div>

      <div className="relative bg-white text-gray-900 border-b border-accent-border">
        <div className="relative w-full">
          <div className="grid w-full" style={gridTemplateColumns24}>
            {/* Left side - first column */}
            <div style={{ gridColumn: `1 / ${LEFT_LINE}` }} className="flex items-center justify-center px-6">
            </div>

            {/* Center area - second column with dots background */}
            <div
              style={{ gridColumn: `${LEFT_LINE} / ${RIGHT_LINE}` }}
              className="bg-white flex items-center justify-center px-6 text-gray-900 relative h-40"
            >
              <div className="relative z-10">
              <span className="text-gray-900">Social Proof</span></div>
              {/* Container with padding for the dots background */}
              <div className="absolute inset-0 p-2 z-0">
                <div className="w-full h-full relative rounded-lg overflow-hidden">
                  <DotsBg />
                </div>
              </div>
            </div>

            {/* Right side - third column */}
            <div style={{ gridColumn: `${RIGHT_LINE} / ${GRID_COLUMNS + 1}` }} className="flex items-center justify-center px-6">
            </div>
          </div>

          {/* Overlay accent borders on md+ */}
          <AccentBorders
            className="hidden md:block"
            gridColumns={GRID_COLUMNS}
            accentPositionPercent={ACCENT_POSITION_PERCENT}
            
            accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
            accentOpacity={ACCENT_OPACITY}
          />
        </div>
      </div>

      {/* How it Works Section */}
      <div className="relative bg-white">
        {/* Content aligned to 24-col grid */}
        <div className="relative z-10 py-20">
          <div className="grid w-full px-4 sm:px-6 lg:px-8" style={gridTemplateColumns24}>
            {/* Left column (empty on md+) */}
            <div className="hidden md:block" style={{ gridColumn: `1 / ${LEFT_LINE}` }} />

            {/* Center content between accent lines */}
            <div
              style={{ gridColumn: `${LEFT_LINE} / ${RIGHT_LINE}` }}
              className="mx-auto max-w-4xl text-center"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                How it Works
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Discover how our platform helps you build amazing experiences.
                Step-by-step guidance to get you started quickly.
              </p>
            </div>

            {/* Right column (empty on md+) */}
            <div className="hidden md:block" style={{ gridColumn: `${RIGHT_LINE} / ${GRID_COLUMNS + 1}` }} />
          </div>

          {/* Overlay accent borders on md+ */}
          <AccentBorders
            className="hidden md:block"
            gridColumns={GRID_COLUMNS}
            accentPositionPercent={ACCENT_POSITION_PERCENT}
            
            accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
            accentOpacity={ACCENT_OPACITY}
          />
        </div>
      </div>

      {/* Integrations Section */}
      <div className="relative bg-white text-gray-900 border-t border-accent-border">
        <div className="relative w-full">
          <div className="grid w-full" style={gridTemplateColumns24}>
            {/* Left side */}
            <div style={{ gridColumn: `1 / ${LEFT_LINE}` }} />

            {/* Center area with integrations - spans all remaining columns */}
            <div
              style={{ gridColumn: `${LEFT_LINE} / ${GRID_COLUMNS + 1}` }}
              className="bg-white flex items-center justify-start px-20 relative"
            >
              <div className="relative z-10 text-center">
                <h2 className="text-2xl sm:text-3xl font-semibold mb-2">Integrations</h2>
                <p className="text-lg text-gray-600">Connect with your favorite tools</p>
              </div>

              {/* Integrations component */}
              <Integrations className="absolute inset-0" />
            </div>
          </div>

          {/* Overlay accent borders on md+ */}
          <AccentBorders
            className="hidden md:block"
            gridColumns={GRID_COLUMNS}
            accentPositionPercent={ACCENT_POSITION_PERCENT}
            accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
            accentOpacity={ACCENT_OPACITY}
          />
        </div>
      </div>

      <div className="relative bg-white text-gray-900 border-t border-accent-border">
        <div className="relative w-full h-10">
          <div className="grid w-full h-full" style={gridTemplateColumns24}>
            {/* Left side */}
            <div style={{ gridColumn: `1 / ${LEFT_LINE}` }} />

            {/* Right side */}
            <div style={{ gridColumn: `${RIGHT_LINE} / ${GRID_COLUMNS + 1}` }} />
          </div>

          {/* Overlay accent borders on md+ */}
          <AccentBorders
            className="hidden md:block"
            gridColumns={GRID_COLUMNS}
            accentPositionPercent={ACCENT_POSITION_PERCENT}
            
            accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
            accentOpacity={ACCENT_OPACITY}
          />
        </div>
      </div>


      {/* Dark Section with faint grid (bottom of page) */}
      <DarkSection />
    </div>
  );
}
