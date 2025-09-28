/**
 * Bottom Section Component
 *
 * Section containing the HowItWorksAnimation component with grid borders.
 */
import HowItWorksAnimation from '../custom/how-it-works';

interface BottomSectionProps {
  /** Number of columns in the grid system */
  gridColumns: number;
  /** CSS grid template columns style */
  gridTemplateColumns: React.CSSProperties;
  /** Left grid line index */
  leftLine: number;
  /** Right grid line index */
  rightLine: number;
}

export function BottomSection({
  gridColumns,
  gridTemplateColumns,
  leftLine,
  rightLine,
}: BottomSectionProps) {
  return (
    <div className="relative bg-background border-t border-accent-border">
      <div className="relative w-full">
        <div className="grid w-full" style={gridTemplateColumns}>
          {/* Left side */}
          <div
            style={{ gridColumn: `1 / ${leftLine}` }}
            className="border-r border-accent-border"
          />

          {/* Center area with white rounded component */}
          <div
            style={{ gridColumn: `${leftLine} / ${rightLine}` }}
            className="bg-background flex items-center justify-center border-r border-accent-border"
          >
            <div className="mx-10 w-full border-x border-accent-border">
            <HowItWorksAnimation />
            </div>
          </div>

          {/* Right side */}
          <div style={{ gridColumn: `${rightLine} / ${gridColumns + 1}` }} />
        </div>
      </div>
    </div>
  );
}
