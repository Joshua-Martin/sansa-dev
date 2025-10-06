import { useState } from 'react';

/**
 * Props for ReadMoreDescription component
 * @property text - The text to display with read more/less functionality
 * @property amountOfCharacters - Number of characters to show before truncation (default: 50)
 * @property onReadmoreClick - Optional callback to override default expand/collapse behavior
 */
interface ReadMoreProps {
  text: string;
  amountOfCharacters?: number;
  /**
   * Optional callback for when the 'show more/less' is clicked. If provided, overrides default expansion behavior.
   */
  onReadmoreClick?: () => void;
}

/**
 * ReadMoreDescription
 *
 * Displays a truncated version of the text with a 'show more/less' toggle. If onReadmoreClick is provided,
 * it will be called instead of toggling the internal expansion state.
 *
 * @param {ReadMoreProps} props
 * @returns {JSX.Element}
 */
export const ReadMoreDescription = ({
  text,
  amountOfCharacters = 50,
  onReadmoreClick,
}: ReadMoreProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const itCanOverflow = text.length > amountOfCharacters;
  const beginText = itCanOverflow ? text.slice(0, amountOfCharacters) : text;
  const endText = text.slice(amountOfCharacters);

  const handleKeyboard = (e: { code: string }) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      if (onReadmoreClick) {
        onReadmoreClick();
      } else {
        setIsExpanded(!isExpanded);
      }
    }
  };

  const handleClick = () => {
    if (onReadmoreClick) {
      onReadmoreClick();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <p className="text-muted-foreground text-xs whitespace-pre-wrap">
      {beginText}
      {itCanOverflow && (
        <>
          {!isExpanded && <span>... </span>}
          <span
            className={`${!isExpanded && 'hidden'} whitespace-pre-wrap`}
            aria-hidden={!isExpanded}
          >
            {endText}
          </span>
          <span
            className="text-primary ml-2 cursor-pointer"
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            onKeyDown={handleKeyboard}
            onClick={handleClick}
          >
            {isExpanded ? 'show less' : 'show more'}
          </span>
        </>
      )}
    </p>
  );
};
