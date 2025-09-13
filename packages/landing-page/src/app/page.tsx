/**
 * Landing Page Component
 *
 * Main landing page for the application showcasing key features and value proposition.
 */

import { FolderDip } from '../components/folder-dip';
import { GridPattern } from '../components/grid-bg';
import { AccentBorders } from '../components/accent-borders';
import DotsBg from '@/components/dots-bg';
import { Integrations } from '../components/integrations';
import { Nav } from '../components/nav';

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

// Center-band grid mirrors the background cell size exactly
const CENTER_COLUMNS = RIGHT_LINE - LEFT_LINE;
const gridTemplateColumnsCenter: React.CSSProperties = {
  gridTemplateColumns: `repeat(${CENTER_COLUMNS}, minmax(0, 1fr))`,
};
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
function MiddleSeparator() {
  return (
    <div className="relative w-full h-[60px] flex-1 flex items-center">
      {/* Base gray background layer */}
      <div className="absolute inset-0 bg-gray-200" />
      
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
            <div className="relative h-full bg-gray-200" style={{ width: `${DIP_FRACTION * 100}%` }}>
              {/* White dip cut-out on top */}
              <div className="absolute inset-0">
                <FolderDip direction="left" color="white" className="w-full h-full" />
              </div>
            </div>

            {/* Center white band */}
            <div className="bg-white h-full" style={{ width: `${CENTER_WHITE_FRACTION * 100}%` }} />

            {/* Right dip container with gray background */}
            <div className="relative h-full bg-gray-200" style={{ width: `${DIP_FRACTION * 100}%` }}>
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
        accentColor={ACCENT_COLOR}
        accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
        accentOpacity={ACCENT_OPACITY}
      />
    </div>
  );
}


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
          accentColor={ACCENT_COLOR}
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
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Sansa
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
                Build amazing experiences with our powerful platform.
                Create, collaborate, and bring your ideas to life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                  Get Started
                </button>
                <button className="px-8 py-3 border border-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Learn More
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
            accentColor={ACCENT_COLOR}
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
      <div className="relative bg-gray-200 text-gray-900 border-b border-gray-500">
        <div className="relative w-full py-20">
          <div className="grid w-full" style={gridTemplateColumns24}>
            {/* Left side */}
            <div style={{ gridColumn: `1 / ${LEFT_LINE}` }} />

            {/* Center area with white rounded component */}
            <div
              style={{ gridColumn: `${LEFT_LINE} / ${RIGHT_LINE}` }}
              className="bg-gray-200 flex items-center justify-center px-6"
            >
              <div className="w-full max-w-4xl aspect-video bg-white rounded-xl flex items-center justify-center">
                <div className="text-center text-gray-900">
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-2">New Component</h2>
                  <p className="text-lg">16:9 aspect ratio content area</p>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div style={{ gridColumn: `${RIGHT_LINE} / ${GRID_COLUMNS + 1}` }} />
          </div>

          {/* Overlay accent borders on md+ */}
          <AccentBorders
            className="hidden md:block"
            gridColumns={GRID_COLUMNS}
            accentPositionPercent={ACCENT_POSITION_PERCENT}
            accentColor={ACCENT_COLOR}
            accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
            accentOpacity={ACCENT_OPACITY}
          />
        </div>
      </div>

      <div className="relative bg-white text-gray-900 border-b border-gray-500">
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
            accentColor={ACCENT_COLOR}
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
            accentColor={ACCENT_COLOR}
            accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
            accentOpacity={ACCENT_OPACITY}
          />
        </div>
      </div>

      {/* Integrations Section */}
      <div className="relative bg-white text-gray-900 border-t border-gray-500">
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
            accentColor={ACCENT_COLOR}
            accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
            accentOpacity={ACCENT_OPACITY}
          />
        </div>
      </div>

      <div className="relative bg-white text-gray-900 border-t border-gray-500">
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
            accentColor={ACCENT_COLOR}
            accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
            accentOpacity={ACCENT_OPACITY}
          />
        </div>
      </div>

      
      {/* Dark Section with faint grid (bottom of page) */}
      <div className="relative bg-black text-white">
        {/* Grid pattern background */}
         <AccentBorders
           className="hidden md:block z-30"
           gridColumns={GRID_COLUMNS}
           accentPositionPercent={ACCENT_POSITION_PERCENT}
           accentColor={"#fff"}
           accentStrokeWidthPx={ACCENT_STROKE_WIDTH_PX}
           accentOpacity={0.2}
         />

         <GridPattern
          patternId="dark-section-grid-pattern"
          columns={GRID_COLUMNS}
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
          topEdgeHeightPercent={0.2}
          radialRadiusPercent={0.4}
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

            {/* Center content between accent lines */}
            <div style={{ gridColumn: `${LEFT_LINE} / ${RIGHT_LINE}` }} className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Supercharge your marketing efforts</h2>
              <p className="text-lg sm:text-xl text-white/70 mb-8">
                See why Sansa is the collaboration platform of choice for modern teams.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-3 bg-white text-black rounded-lg font-semibold hover:bg-white/90 transition-colors">
                  Start for free
                </button>
                <button className="px-8 py-3 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
                  Get a demo
                </button>
              </div>
            </div>

            {/* Right column (empty on md+) */}
            <div className="hidden md:block" style={{ gridColumn: `${RIGHT_LINE} / ${GRID_COLUMNS + 1}` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
