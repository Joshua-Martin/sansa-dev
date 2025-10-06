import { Info } from 'lucide-react';
import React from 'react';

import { Button } from './button';
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip';

/**
 * DescriptionTooltip
 *
 * Displays an info icon that, when hovered or focused, shows a tooltip with the provided description text.
 * Intended as a drop-in replacement for ReadMoreDescription, but with a more compact, icon-based UI.
 *
 * @param {DescriptionTooltipProps} props - The props for the component.
 * @returns {JSX.Element} The rendered DescriptionTooltip component.
 */
export interface DescriptionTooltipProps {
  /**
   * The description text to display inside the tooltip.
   */
  text: string;
  /**
   * Optional: Additional className for the icon wrapper.
   */
  className?: string;
}

export const DescriptionTooltip: React.FC<DescriptionTooltipProps> = ({
  text,
  className,
}) => {
  if (!text) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/*
          The Info icon acts as the trigger for the tooltip. It is accessible via keyboard and screen readers.
        */}
        <Button
          variant="ghost"
          size="icon"
          className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Show description"
        >
          <Info />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {/*
          The full description text is shown in the tooltip. Long text will wrap.
        */}
        <span className="max-w-xs whitespace-pre-line break-words">{text}</span>
      </TooltipContent>
    </Tooltip>
  );
};
