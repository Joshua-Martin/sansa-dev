'use client';

import React from 'react';

/**
 * PageTitle Component
 *
 * A reusable component for displaying page titles and subtitles with consistent styling.
 */
interface PageTitleProps {
  /** The main title text */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Optional CSS classes to override default styling */
  className?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({
  title,
  subtitle,
  className = ''
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      <h1 className="text-3xl font-bold text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default PageTitle;
