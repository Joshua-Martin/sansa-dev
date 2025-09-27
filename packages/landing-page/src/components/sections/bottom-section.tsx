/**
 * Bottom Section Component
 *
 * Dark themed section containing the HowItWorksAnimation component with accent borders.
 */
import { AccentBorders } from '../accent-borders';
import HowItWorksAnimation from '../custom/how-it-works';

interface BottomSectionProps {
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

export function BottomSection({
  gridColumns,
  accentPositionPercent,
  accentStrokeWidthPx,
  accentOpacity,
  gridTemplateColumns,
  leftLine,
  rightLine,
}: BottomSectionProps) {
  return (
    <div className="relative bg-dark-background text-gray-900 border-b border-accent-border">
      <div className="relative w-full py-20">
        <div className="grid w-full" style={gridTemplateColumns}>
          {/* Left side */}
          <div style={{ gridColumn: `1 / ${leftLine}` }} />

          {/* Center area with white rounded component */}
          <div
            style={{ gridColumn: `${leftLine} / ${rightLine}` }}
            className="bg-dark-background flex items-center justify-center px-6"
          >
            <HowItWorksAnimation />
          </div>

          {/* Right side */}
          <div style={{ gridColumn: `${rightLine} / ${gridColumns + 1}` }} />
        </div>

        {/* Overlay accent borders on md+ */}
        <AccentBorders
          className="hidden md:block"
          gridColumns={gridColumns}
          accentPositionPercent={accentPositionPercent}
          variant="dark"
          accentStrokeWidthPx={accentStrokeWidthPx}
          accentOpacity={accentOpacity}
        />
      </div>
    </div>
  );
}
