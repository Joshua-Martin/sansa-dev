'use client';

import React from 'react';
import type { LLMMessage } from '@sansa-dev/s-shared';
import { cn } from '../../../lib/utils/utils';
import { MarkdownRenderer } from '../../common/markdown-renderer';

/**
 * Props for ChatMessage component
 */
export interface ChatMessageProps {
  /**
   * The message data
   */
  message: LLMMessage;

  /**
   * Whether this message is currently being streamed
   */
  isStreaming?: boolean;

  /**
   * Streaming content for incomplete messages
   */
  streamingContent?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ChatMessage Component
 *
 * Renders a single chat message with appropriate styling based on the role
 * (user, assistant, or system). Supports streaming content for real-time updates.
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
  streamingContent,
  className,
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  // Use streaming content if available, otherwise use message content
  const displayContent =
    isStreaming && streamingContent !== undefined
      ? streamingContent
      : message.content;

  console.log('💬 ChatMessage render:', {
    messageId: message.id,
    role: message.role,
    status: message.status,
    isStreaming,
    hasStreamingContent: !!streamingContent,
    displayContent: displayContent?.substring(0, 50) + '...',
    willRender: !(
      isAssistant &&
      !displayContent &&
      !isStreaming &&
      message.status !== 'pending'
    ),
  });

  // Don't render empty assistant messages unless they're streaming
  // Exception: Show pending assistant messages that might receive streaming content
  if (
    isAssistant &&
    !displayContent &&
    !isStreaming &&
    message.status !== 'pending'
  ) {
    return null;
  }

  return (
    <div
      className={cn(
        'px-4 py-3 m-2',
        // User messages: bg-primary in light mode, bg-background with border in dark mode
        isUser &&
          'bg-primary dark:bg-muted dark:border dark:border-border rounded-xl mr-10 w-fit',
        // Assistant messages: full width, no background
        isAssistant && 'w-full bg-transparent',
        // System messages: keep existing styling
        isSystem &&
          'mx-4 bg-yellow-50 dark:bg-yellow-950/20 text-sm rounded-lg',
        className
      )}
    >
      {/* User and Assistant messages: simplified layout */}
      {isUser ? (
        <>
          <div
            className={cn(
              // User messages need light text on dark background
              isUser && 'text-primary-foreground dark:text-foreground'
            )}
          >
            <span>{displayContent}</span>
          </div>
        </>
      ) : (
        isAssistant && (
          <>
            {/* Message text with markdown rendering */}
            <div
              className={cn(
                // User messages need light text on dark background
                isUser && 'text-primary-foreground dark:text-foreground'
              )}
            >
              <MarkdownRenderer
                content={displayContent || ''}
                className={cn(
                  'prose prose-sm max-w-none dark:prose-invert',
                  // Additional styling for chat messages
                  '[&_*]:text-current [&_.text-primary]:text-current [&_.text-primary-foreground]:text-current'
                )}
              />
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
              )}
            </div>
          </>
        )
      )}
    </div>
  );
};

export default ChatMessage;
