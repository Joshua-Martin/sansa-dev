/**
 * How It Works Section Component
 *
 * Section explaining how the platform works with heading and description.
 */
import { AccentBorders } from '../accent-borders';

interface HowItWorksSectionProps {
  /** Number of columns in the grid system */
  gridColumns: number;
  /** Position percentage for accent lines */
  accentPositionPercent: number;
  /** Stroke width for accent lines in pixels */
  accentStrokeWidthPx: number;
  /** Opacity for accent lines */
  accentOpacity: number;
  /** CSS grid template columns style */
  gridTemplateColumns: React.CSSProperties;
  /** Left grid line index */
  leftLine: number;
  /** Right grid line index */
  rightLine: number;
}

export function HowItWorksSection({
  gridColumns,
  accentPositionPercent,
  accentStrokeWidthPx,
  accentOpacity,
  gridTemplateColumns,
  leftLine,
  rightLine,
}: HowItWorksSectionProps) {
  return (
    <div className="relative bg-white">
      {/* Content aligned to 24-col grid */}
      <div className="relative z-10 py-20">
        <div className="grid w-full px-4 sm:px-6 lg:px-8" style={gridTemplateColumns}>
          {/* Left column (empty on md+) */}
          <div className="hidden md:block" style={{ gridColumn: `1 / ${leftLine}` }} />

          {/* Center content between accent lines */}
          <div
            style={{ gridColumn: `${leftLine} / ${rightLine}` }}
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
          <div className="hidden md:block" style={{ gridColumn: `${rightLine} / ${gridColumns + 1}` }} />
        </div>

        {/* Overlay accent borders on md+ */}
        <AccentBorders
          className="hidden md:block"
          gridColumns={gridColumns}
          accentPositionPercent={accentPositionPercent}
          accentStrokeWidthPx={accentStrokeWidthPx}
          accentOpacity={accentOpacity}
        />
      </div>
    </div>
  );
}
