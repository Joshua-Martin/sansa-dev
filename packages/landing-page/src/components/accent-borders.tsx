/**
 * AccentBorders Component
 *
 * Renders vertical accent borders aligned to specified grid columns.
 * Borders are overlayed and non-interactive so they do not affect layout or hit-testing.
 */
interface AccentBordersProps {
  /** Additional CSS classes to apply to the component */
  className?: string;
  /** Number of grid columns (default: 24) */
  gridColumns?: number;
  /** Position of accent lines as percentage of grid (default: 0.2) */
  accentPositionPercent?: number;
  /** Color of the accent borders (default: '#000000') */
  accentColor?: string;
  /** Stroke width in pixels (default: 1) */
  accentStrokeWidthPx?: number;
  /** Opacity of the accent borders (default: 0.45) */
  accentOpacity?: number;
  /** Enable fade-out effect at the top (default: false) */
  enableFadeOut?: boolean;
  /** Percentage of height where fade-out starts (0-1, default: 0.0 = starts at top) */
  fadeOutStartPercent?: number;
  /** Percentage of height where fade-out ends (0-1, default: 0.25 = ends at 25% from top) */
  fadeOutEndPercent?: number;
}

export function AccentBorders({
  className,
  gridColumns = 24,
  accentPositionPercent = 0.2,
  accentColor = '#000000',
  accentStrokeWidthPx = 1,
  accentOpacity = 0.45,
  enableFadeOut = false,
  fadeOutStartPercent = 0.0,
  fadeOutEndPercent = 0.25,
}: AccentBordersProps) {
  // Symmetric grid line indices based on single rounded left line
  const leftLine = Math.round(accentPositionPercent * gridColumns);
  const rightLine = gridColumns - leftLine + 2;

  // Reusable style for grid layout
  const gridTemplateColumns: React.CSSProperties = {
    gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
  };

  // Create fade-out mask if enabled
  const fadeOutMask = enableFadeOut
    ? `linear-gradient(to bottom, transparent ${(fadeOutStartPercent * 100)}%, black ${(fadeOutEndPercent * 100)}%)`
    : undefined;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className ?? ''}`} aria-hidden="true">
      <div className="grid h-full w-full" style={gridTemplateColumns}>
        {/* Left accent border */}
        <div
          style={{
            gridColumn: `1 / ${leftLine}`,
            borderRight: `${accentStrokeWidthPx}px solid ${accentColor}`,
            opacity: enableFadeOut ? 1 : accentOpacity,
            mask: enableFadeOut ? fadeOutMask : undefined,
            WebkitMask: enableFadeOut ? fadeOutMask : undefined,
          }}
        />
        {/* Right accent border */}
        <div
          style={{
            gridColumn: `${rightLine} / ${gridColumns + 1}`,
            borderLeft: `${accentStrokeWidthPx}px solid ${accentColor}`,
            opacity: enableFadeOut ? 1 : accentOpacity,
            mask: enableFadeOut ? fadeOutMask : undefined,
            WebkitMask: enableFadeOut ? fadeOutMask : undefined,
          }}
        />
      </div>
    </div>
  );
}
