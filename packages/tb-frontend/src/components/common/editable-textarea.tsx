import { isNil } from '@cosmo/tb-shared';
import { useState, useRef, useCallback, useEffect } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

/**
 * Props for EditableTextarea component
 */
type EditableTextareaProps = {
  /** The text value to display/edit */
  value: string | undefined;
  /** Additional CSS classes to apply */
  className?: string;
  /** Whether the component is read-only */
  readonly?: boolean;
  /** Callback when the value changes */
  onValueChange: (value: string) => void;
  /** Tooltip content to show on hover */
  tooltipContent?: string;
  /** Whether the component is currently in editing mode */
  isEditing: boolean;
  /** Callback to set editing state */
  setIsEditing: (isEditing: boolean) => void;
  /** Placeholder text when editing */
  placeholder?: string;
  /** Number of characters to show before truncation (default: 50) */
  amountOfCharacters?: number;
};

/**
 * EditableTextarea Component
 *
 * Behaves exactly like ReadMoreDescription but with inline edit functionality.
 * When editing, shows a textarea that doesn't expand beyond the text size.
 */
const EditableTextarea = ({
  value: initialValue = '',
  className = '',
  readonly = false,
  onValueChange,
  tooltipContent,
  isEditing,
  setIsEditing,
  placeholder = 'Enter text...',
  amountOfCharacters = 50,
}: EditableTextareaProps): JSX.Element => {
  const [value, setValue] = useState<string>(initialValue);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const valueOnEditingStartedRef = useRef<string>(initialValue);

  // Sync with external value changes
  useEffect(() => {
    if (initialValue !== value && !isEditing) {
      setValue(initialValue);
    }
  }, [initialValue, isEditing]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  const itCanOverflow = value.length > amountOfCharacters;
  const beginText = itCanOverflow ? value.slice(0, amountOfCharacters) : value;
  const endText = value.slice(amountOfCharacters);

  /**
   * Handle starting edit mode
   */
  const handleEditStart = useCallback((): void => {
    if (!readonly) {
      valueOnEditingStartedRef.current = value;
      setIsEditing(true);
    }
  }, [readonly, value, setIsEditing]);

  /**
   * Handle finishing edit mode
   */
  const handleEditFinish = useCallback((): void => {
    const newValue = (textareaRef.current?.value ?? '').trim();
    setValue(newValue);
    if (newValue !== valueOnEditingStartedRef.current) {
      onValueChange(newValue);
    }
    setIsEditing(false);
  }, [onValueChange, setIsEditing]);

  /**
   * Handle canceling edit mode
   */
  const handleEditCancel = useCallback((): void => {
    setValue(valueOnEditingStartedRef.current);
    setIsEditing(false);
  }, [setIsEditing]);

  /**
   * Handle read more/less toggle
   */
  const handleReadMoreToggle = useCallback((): void => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  /**
   * Handle keyboard events for action buttons
   */
  const handleKeyboard = useCallback(
    (e: React.KeyboardEvent, action: 'edit' | 'readmore'): void => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (action === 'edit') {
          handleEditStart();
        } else {
          handleReadMoreToggle();
        }
      }
    },
    [handleEditStart, handleReadMoreToggle]
  );

  // If editing, show textarea with same visual footprint
  if (isEditing) {
    // Calculate the height based on the text content to avoid expansion
    const textToShow = isExpanded
      ? value
      : itCanOverflow
        ? beginText + '...'
        : value;
    const lineCount = Math.max(1, textToShow.split('\n').length);
    const minHeight = `${lineCount * 1.5}em`;

    return (
      <Tooltip>
        <TooltipTrigger disabled={isNil(tooltipContent)} asChild>
          <div className="text-muted-foreground text-xs whitespace-pre-wrap w-full">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleEditFinish}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleEditCancel();
                } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleEditFinish();
                }
              }}
              className={`${className} w-full resize-none border-none outline-none bg-transparent text-muted-foreground text-xs font-inherit leading-inherit p-0 m-0`}
              placeholder={placeholder}
              style={{
                minHeight,
                maxHeight: isExpanded ? 'none' : minHeight,
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: 'inherit',
              }}
            />
            {itCanOverflow && (
              <>
                {!isExpanded && <span>... </span>}
                <span
                  className="text-primary cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onKeyDown={(e) => handleKeyboard(e, 'readmore')}
                  onClick={handleReadMoreToggle}
                >
                  {isExpanded ? 'show less' : 'show more'}
                </span>
                {!readonly && (
                  <>
                    <span className="text-muted-foreground"> • </span>
                    <span className="text-primary cursor-pointer">save</span>
                  </>
                )}
              </>
            )}
            {!itCanOverflow && !readonly && (
              <span className="text-primary ml-2 cursor-pointer">save</span>
            )}
          </div>
        </TooltipTrigger>
        {tooltipContent && (
          <TooltipContent className="font-normal z-50" side="bottom">
            {tooltipContent}
          </TooltipContent>
        )}
      </Tooltip>
    );
  }

  // Display mode - exactly like ReadMoreDescription with edit button
  return (
    <Tooltip>
      <TooltipTrigger disabled={isNil(tooltipContent)} asChild>
        <p
          className={`text-muted-foreground text-xs whitespace-pre-wrap ${className}`}
        >
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
                onKeyDown={(e) => handleKeyboard(e, 'readmore')}
                onClick={handleReadMoreToggle}
              >
                {isExpanded ? 'show less' : 'show more'}
              </span>
              {!readonly && (
                <>
                  <span className="text-muted-foreground"> • </span>
                  <span
                    className="text-primary cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => handleKeyboard(e, 'edit')}
                    onClick={handleEditStart}
                  >
                    edit
                  </span>
                </>
              )}
            </>
          )}
          {!itCanOverflow && !readonly && (
            <span
              className="text-primary ml-2 cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleKeyboard(e, 'edit')}
              onClick={handleEditStart}
            >
              edit
            </span>
          )}
          {!value && !readonly && (
            <span
              className="text-primary cursor-pointer italic"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleKeyboard(e, 'edit')}
              onClick={handleEditStart}
            >
              {placeholder}
            </span>
          )}
        </p>
      </TooltipTrigger>
      {tooltipContent && (
        <TooltipContent className="font-normal z-50" side="bottom">
          {tooltipContent}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

EditableTextarea.displayName = 'EditableTextarea';

export default EditableTextarea;
