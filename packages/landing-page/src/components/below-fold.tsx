/**
 * Below Fold Component
 *
 * Displays the Sansa dashboard image with rounded corners in a 16:9 aspect ratio container.
 */
import Image from 'next/image';

/**
 * BelowFold component that renders the Sansa dashboard screenshot.
 */
export function BelowFold() {
  return (
    <div className="flex items-center justify-center border border-border/10 bg-white/5 p-4 rounded-xl">
      <div className="w-full max-w-4xl h-auto rounded-xl overflow-hidden">
        <Image
          src="/assets/sansa-dash.png"
          alt="Sansa Dashboard"
          width={2400}
          height={1600}
          className="w-full h-auto object-contain"
          priority
        />
      </div>
    </div>
  );
}
