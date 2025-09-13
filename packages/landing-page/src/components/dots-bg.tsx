/**
 * DotsBg component that renders a dotted background pattern.
 * The dots are created using an SVG pattern and fill the entire available space.
 */
export default function DotsBg() {
  return (
    <svg
      className="pointer-events-none w-full h-full text-neutral-200/80"
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="dots-pattern"
          x="-1"
          y="-1"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <rect x="1" y="1" width="2" height="2" fill="currentColor" />
        </pattern>
      </defs>
      <rect fill="url(#dots-pattern)" width="100%" height="100%" />
    </svg>
  );
}
