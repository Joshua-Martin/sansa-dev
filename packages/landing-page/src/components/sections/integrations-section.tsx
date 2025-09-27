/**
 * Integrations Section Component
 *
 * Section showcasing available integrations with heading and integrations component.
 */
import { AccentBorders } from '../accent-borders';
import { Integrations } from '../integrations';

interface IntegrationsSectionProps {
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
}

export function IntegrationsSection({
  gridColumns,
  accentPositionPercent,
  accentStrokeWidthPx,
  accentOpacity,
  gridTemplateColumns,
  leftLine,
}: IntegrationsSectionProps) {
  return (
    <div className={`relative bg-white text-gray-900 border-t border-accent-border w-full aspect-[5/${gridColumns}]`}>
      <div className="relative w-full">
        <div className="grid w-full" style={gridTemplateColumns}>
          {/* Left side */}
          <div style={{ gridColumn: `1 / ${leftLine}` }} />

          {/* Center area with integrations - spans all remaining columns */}
          <div
            style={{ gridColumn: `${leftLine} / ${gridColumns + 1}` }}
            className="bg-white flex items-center justify-start relative"
          >
            <div className="relative z-10 text-left px-20">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2">Integrations</h2>
              <p className="text-lg text-gray-600">Connect with your favorite tools</p>
            </div>

            {/* Integrations component */}
            <Integrations gridColumns={gridColumns} strokeWidth={0.8} />
          </div>
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
