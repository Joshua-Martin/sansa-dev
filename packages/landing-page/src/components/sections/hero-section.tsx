/**
 * Hero Section Component
 *
 * Main hero section showcasing the key value proposition with grid pattern background,
 * title, description, and call-to-action buttons.
 */
import { GridPattern } from '../grid-bg';
import { AccentBorders } from '../accent-borders';

interface HeroSectionProps {
  /** Number of columns in the grid system */
  gridColumns: number;
  /** Position percentage for accent lines */
  accentPositionPercent: number;
  /** Stroke width for accent lines in pixels */
  accentStrokeWidthPx: number;
  /** Opacity for accent lines */
  accentOpacity: number;
  /** Left accent line position as percentage */
  leftPercent: number;
  /** Right accent line position as percentage */
  rightPercent: number;
  /** CSS grid template columns style */
  gridTemplateColumns: React.CSSProperties;
  /** Left grid line index */
  leftLine: number;
  /** Right grid line index */
  rightLine: number;
}

export function HeroSection({
  gridColumns,
  accentPositionPercent,
  accentStrokeWidthPx,
  accentOpacity,
  leftPercent,
  rightPercent,
  gridTemplateColumns,
  leftLine,
  rightLine,
}: HeroSectionProps) {
  return (
    <div className="relative bg-white pt-20">
      <GridPattern
        patternId="hero-grid-pattern"
        gridColumns={gridColumns}
        strokeWidth={0.8}
        color="#6b7280"
        gridOpacity={0.6}
        accentOpacity={accentOpacity}
        enableGradients={true}
        enableTopArc={true}
        enableAccentLines={false}
        accentLinePositionPercent={[leftPercent, rightPercent]}
        snapAccentToGrid={true}
        accentStrokeWidth={0}
        topCornerRadiusPercent={0.8}
        topEdgeHeightPercent={0.6}
        radialRadiusPercent={0.8}
        enableCenterFade={true}
        centerFadeRadius={0.25}
        centerFadeIntensity={0.5}
      />

      {/* Content aligned to 24-col grid */}
      <div className="relative z-10 py-16">
        <div className="grid w-full px-4 sm:px-6 lg:px-8" style={gridTemplateColumns}>
          {/* Left column (empty on md+, becomes padding on small) */}
          <div className="hidden md:block" style={{ gridColumn: `1 / ${leftLine}` }} />
          {/* Center content between accent lines */}
          <div
            style={{ gridColumn: `${leftLine} / ${rightLine}` }}
            className="mx-auto max-w-4xl text-center"
          >
            <h1 className="sansa-font text-7xl font-bold text-gray-900 mb-6">
                Optimize your AI pipeline&apos;s cost and performance
              </h1>
            <p className="mono-text text-xl text-gray-600 mb-8 leading-relaxed px-10">
            Intelligent API routing to optimize AI cost and performance for dev teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <button className="mono-text px-8 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors">
                <span className="text-primary mr-2">+</span>Start Optimizing
              </button>
              <button className="mono-text px-8 py-3 border-2 border-gray-300 text-gray-900 font-semibold hover:bg-gray-50 transition-colors relative overflow-visible">
                <span className="absolute left-1/2 top-1/2 w-[120%] h-4 bg-white transform -translate-x-1/2 -translate-y-1/2 z-20"></span>
                <span className="px-4 relative z-30">Book Demo</span>
              </button>
            </div>
          </div>

          {/* Right column (empty on md+) */}
          <div className="hidden md:block" style={{ gridColumn: `${rightLine} / ${gridColumns + 1}` }} />
        </div>

        {/* Overlay accent borders on md+ so they align with the SVG accents */}
        <AccentBorders
          className="hidden md:block"
          gridColumns={gridColumns}
          accentPositionPercent={accentPositionPercent}
          accentStrokeWidthPx={accentStrokeWidthPx}
          accentOpacity={accentOpacity}
          enableFadeOut={true}
          fadeOutStartPercent={0.3}
          fadeOutEndPercent={0.9}
        />
      </div>
    </div>
  );
}
