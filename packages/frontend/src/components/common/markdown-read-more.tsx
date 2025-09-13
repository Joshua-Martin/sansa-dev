import React, { useState } from 'react';

import { MarkdownRenderer } from './markdown-renderer';

/**
 * Props for MarkdownReadMore
 * @property markdown - The markdown string to render
 * @property truncateToChars - Number of characters to show before truncation (default: 200)
 * @property onReadmoreClick - Optional callback to override default expand/collapse behavior
 * @property className - Optional CSS class for the wrapper
 */
export interface MarkdownReadMoreProps {
  markdown: string;
  truncateToChars?: number;
  onReadmoreClick?: () => void;
  className?: string;
}

/**
 * MarkdownReadMore
 *
 * Renders markdown content with a 'show more/less' toggle if the content is long.
 * The 'show more' link is rendered inline with the truncated text, not as a separate block.
 * If onReadmoreClick is provided, it will be called instead of toggling the internal expansion state.
 *
 * Note: If truncation splits a markdown element, rendering may be imperfect. For best results, use with plain text or simple markdown.
 *
 * @param {MarkdownReadMoreProps} props
 * @returns {JSX.Element}
 */
export const MarkdownReadMore: React.FC<MarkdownReadMoreProps> = ({
  markdown,
  truncateToChars = 200,
  onReadmoreClick,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongContent = markdown.length > truncateToChars;
  const truncated = isLongContent && !isExpanded;

  // Inline read more token (HTML span)
  const readMoreToken = '<span class="read-more-link">show more</span>';
  const showLessToken = '<span class="read-more-link">show less</span>';

  // Truncate at word boundary for better UX
  function truncateAtWord(str: string, n: number): string {
    if (str.length <= n) return str;
    const sub = str.substr(0, n);
    return sub.substr(0, Math.min(sub.length, sub.lastIndexOf(' ')));
  }

  const truncatedContent = isLongContent
    ? truncateAtWord(markdown, truncateToChars) + '... ' + readMoreToken
    : markdown;

  const expandedContent = markdown + ' ' + showLessToken;

  // Handler for clicking the inline span
  const handleSpanClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    if (onReadmoreClick) {
      onReadmoreClick();
    } else {
      setIsExpanded((prev) => !prev);
    }
  };

  // Custom renderer for the read-more-link span
  const components = {
    span: (props: { className?: string; children?: React.ReactNode }) => {
      if (props.className === 'read-more-link') {
        return (
          <span
            className="text-primary ml-1 cursor-pointer text-xs inline"
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            onClick={handleSpanClick}
            onKeyDown={(e) => {
              if (e.code === 'Space' || e.code === 'Enter')
                handleSpanClick(e as React.KeyboardEvent);
            }}
          >
            {props.children}
          </span>
        );
      }
      return <span {...props} />;
    },
  };

  return (
    <div className={className}>
      <MarkdownRenderer
        content={truncated ? truncatedContent : expandedContent}
        className="text-sm"
        // @ts-expect-error: MarkdownRenderer does not type the 'components' prop, but react-markdown supports it
        components={components}
      />
    </div>
  );
};
