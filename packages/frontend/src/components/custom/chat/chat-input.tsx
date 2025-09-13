'use client';

import React, { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Loader2, Paperclip } from 'lucide-react';
import { Button } from '../../common/button';
import { Textarea } from '../../common/textarea';
import { cn } from '../../../lib/utils/utils';

/**
 * Props for ChatInput component
 */
export interface ChatInputProps {
  /**
   * Callback when a message is sent
   */
  onSendMessage: (message: string, uiState?: string) => Promise<void> | void;

  /**
   * Whether the input is disabled
   */
  disabled?: boolean;

  /**
   * Whether a message is currently being sent
   */
  isLoading?: boolean;

  /**
   * Placeholder text for the input
   */
  placeholder?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ChatInput Component
 *
 * Provides a text input area for sending chat messages with keyboard shortcuts
 * and loading states. Supports multi-line input and auto-resizing.
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  isLoading = false,
  placeholder = 'Type your message...',
  className,
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Handle sending the message
   */
  const handleSend = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || isSending || isLoading) return;

    setIsSending(true);

    try {
      await onSendMessage(trimmedMessage);
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [message, disabled, isSending, isLoading, onSendMessage]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter') {
        if (event.shiftKey) {
          // Shift+Enter: new line (default behavior)
          return;
        } else {
          // Enter: send message
          event.preventDefault();
          handleSend();
        }
      }
    },
    [handleSend]
  );

  /**
   * Handle textarea auto-resize
   */
  const handleInput = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const target = event.target;
      setMessage(target.value);

      // Auto-resize textarea
      target.style.height = 'auto';
      target.style.height = `${Math.min(target.scrollHeight, 120)}px`; // Max height of ~5 lines
    },
    []
  );

  const isDisabled = disabled || isSending || isLoading;
  const showLoading = isSending || isLoading;

  return (
    <div className={cn('relative p-4 bg-card', className)}>
      {/* Wrapper with border and rounded corners */}
      <div className="border border-border rounded-xl p-1 bg-background">
        {/* Message input - no border */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            className={cn(
              'min-h-[48px] max-h-[120px] resize-none',
              'px-3 py-2', // Reduced padding since no border needed
              'bg-transparent border-none', // No background or border
              'focus:ring-0 focus:outline-none', // Remove focus ring
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'text-foreground placeholder:text-muted-foreground'
            )}
            rows={1}
          />
        </div>

        {/* Button row below input */}
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/50">
          {/* Paperclip button (dummy for now) */}
          <Button
            size="sm"
            className={cn(
              'h-8 w-8 rounded-lg p-0',
              'bg-transparent hover:bg-muted',
              'text-muted-foreground hover:text-foreground',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200'
            )}
          >
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Attach file</span>
          </Button>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={isDisabled || !message.trim()}
            size="sm"
            className={cn(
              'h-8 w-8 rounded-full p-0',
              'bg-primary hover:bg-primary/90',
              'text-primary-foreground',
              'disabled:bg-primary/50 disabled:text-muted-foreground disabled:cursor-not-allowed',
              'transition-colors duration-200'
            )}
          >
            {showLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
