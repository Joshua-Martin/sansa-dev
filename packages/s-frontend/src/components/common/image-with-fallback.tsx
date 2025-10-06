import React, { useState, useEffect } from 'react';

import { cn } from '../../lib/utils/utils';

interface ImageWithFallbackProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

// In-memory cache to track loaded images
const loadedImages = new Set<string>();

/**
 * ImageWithFallback
 * Renders an image with a fallback node if the image fails to load or if no src is provided.
 *
 * @param {ImageWithFallbackProps} props - The props for the image component.
 * @returns {JSX.Element} The image or fallback node.
 *
 * - If `src` is undefined, null, or an empty string, the fallback is shown.
 * - If the image fails to load, the fallback is shown.
 * - While loading, the fallback is shown as an overlay.
 */
const ImageWithFallback = ({
  src,
  alt,
  fallback,
  ...props
}: ImageWithFallbackProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!src || !loadedImages.has(src!));
  useEffect(() => {
    if (src && loadedImages.has(src)) {
      setIsLoading(false);
    }
  }, [src]);

  const handleLoad = () => {
    if (src) {
      loadedImages.add(src); // Mark the image as loaded
      setIsLoading(false);
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const { className, ...rest } = props;

  // Show fallback if src is missing or errored
  if (!src || hasError) {
    return (
      <span className="relative flex items-center justify-center">
        <div
          className={cn(
            'flex items-center justify-center w-full h-full bg-muted',
            className
          )}
        >
          {fallback ?? <span className="w-full h-full bg-muted"></span>}
        </div>
      </span>
    );
  }

  return (
    <span className="relative inline-block bg-muted">
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          {fallback ?? <span className="w-full h-full bg-muted"></span>}
        </span>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          `block transition-opacity duration-500`,
          {
            'opacity-0': isLoading,
            'opacity-100': !isLoading,
          },
          className
        )}
        {...rest}
      />
    </span>
  );
};

export default ImageWithFallback;
