'use client';

import React, { useEffect, useRef } from 'react';
import type { LLMMessage } from '../../../../../tb-shared/src';
import { AIProvider } from '../../../../../tb-shared/src';
import type { StreamingMessage } from '../../../hooks/useChatAgent';
import { cn } from '../../../lib/utils/utils';
import { ScrollArea } from '../../common/scroll-area';
import { Skeleton } from '../../common/skeleton';
import { Loader2 } from 'lucide-react';
import ChatMessage from './chat-message';

/**
 * Props for ChatMessageList component
 */
export interface ChatMessageListProps {
  /**
   * Array of messages to display
   */
  messages: LLMMessage[];

  /**
   * Currently streaming message (if any)
   */
  streamingMessage?: StreamingMessage | null;

  /**
   * Whether messages are loading
   */
  isLoading?: boolean;

  /**
   * Whether to auto-scroll to bottom on new messages
   */
  autoScroll?: boolean;

  /**
   * Whether the assistant is thinking (for promo mode)
   */
  isThinking?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ChatMessageList Component
 *
 * Displays a scrollable list of chat messages with support for streaming content.
 * Automatically scrolls to the bottom when new messages arrive.
 */
export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  streamingMessage,
  isLoading = false,
  autoScroll = true,
  isThinking = false,
  className,
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll to bottom when new messages arrive, streaming updates, or thinking state changes
   */
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, streamingMessage?.content, autoScroll, isThinking]);

  /**
   * Render loading skeleton
   */
  const renderLoadingSkeleton = () => (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <div className="text-lg font-medium mb-2">Start a conversation</div>
        <div className="text-sm">
          Send a message to begin chatting with the AI assistant.
        </div>
      </div>
    </div>
  );

  /**
   * Render thinking indicator
   */
  const renderThinkingIndicator = () => (
    <div className="px-4 py-3 m-2 w-full bg-transparent">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground italic">
            Thinking...
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={cn('flex-1', className)}>{renderLoadingSkeleton()}</div>
    );
  }

  if (messages.length === 0 && !streamingMessage) {
    return <div className={cn('flex-1', className)}>{renderEmptyState()}</div>;
  }

  return (
    <ScrollArea ref={scrollAreaRef} className={cn('flex-1', className)}>
      <div className="space-y-1">
        {/* Regular messages */}
        {messages.map((message) => {
          // Check if this message is currently streaming
          const isCurrentlyStreaming =
            streamingMessage?.messageId === message.id;

          console.log('🔍 Rendering message:', {
            messageId: message.id,
            role: message.role,
            status: message.status,
            hasContent: !!message.content,
            isCurrentlyStreaming,
            streamingContent: isCurrentlyStreaming
              ? streamingMessage?.content?.substring(0, 50) + '...'
              : 'none',
          });

          return (
            <ChatMessage
              key={message.id}
              message={message}
              isStreaming={isCurrentlyStreaming}
              streamingContent={
                isCurrentlyStreaming ? streamingMessage?.content : undefined
              }
            />
          );
        })}

        {/* Thinking indicator (for promo mode) */}
        {isThinking && renderThinkingIndicator()}

        {/* Streaming message that doesn't exist in messages yet (fallback) */}
        {streamingMessage &&
          !messages.some((msg) => msg.id === streamingMessage.messageId) && (
            <ChatMessage
              message={{
                id: streamingMessage.messageId,
                threadId: streamingMessage.threadId,
                role: 'assistant',
                content: '',
                status: 'pending',
                model: '',
                provider: AIProvider.OPEN_AI, // Default provider
                tokenCountInput: 0,
                tokenCountOutput: 0,
                tokenCostInput: 0,
                tokenCostOutput: 0,
                messageCost: 0,
                createdAt: streamingMessage.timestamp,
                updatedAt: streamingMessage.timestamp,
              }}
              isStreaming={true}
              streamingContent={streamingMessage.content}
            />
          )}

        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-1" />
      </div>
    </ScrollArea>
  );
};

export default ChatMessageList;
