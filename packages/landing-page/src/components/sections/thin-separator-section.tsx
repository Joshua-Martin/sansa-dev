/**
 * Thin Separator Section Component
 *
 * Thin separator section with white background and accent borders.
 */
import { AccentBorders } from '../accent-borders';

interface ThinSeparatorSectionProps {
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

export function ThinSeparatorSection({
  gridColumns,
  accentPositionPercent,
  accentStrokeWidthPx,
  accentOpacity,
  gridTemplateColumns,
  leftLine,
  rightLine,
}: ThinSeparatorSectionProps) {
  return (
    <div className="relative bg-white text-gray-900 border-t border-accent-border">
      <div className="relative w-full h-10">
        <div className="grid w-full h-full" style={gridTemplateColumns}>
          {/* Left side */}
          <div style={{ gridColumn: `1 / ${leftLine}` }} />

          {/* Right side */}
          <div style={{ gridColumn: `${rightLine} / ${gridColumns + 1}` }} />
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
