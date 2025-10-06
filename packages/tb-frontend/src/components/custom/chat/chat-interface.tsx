'use client';

import React from 'react';
import type { LLMMessage } from '../../../../../tb-shared/src';
import type { StreamingMessage } from '../../../hooks/useChatAgent';
import { cn } from '../../../lib/utils/utils';
import { Alert, AlertDescription } from '../../common/alert';
import { AlertCircle } from 'lucide-react';
import ChatMessageList from './chat-message-list';
import ChatInput from './chat-input';

/**
 * Props for ChatInterface component
 */
export interface ChatInterfaceProps {
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
  isLoadingMessages?: boolean;

  /**
   * Whether a message is being sent
   */
  isSendingMessage?: boolean;

  /**
   * Whether chat is connected and ready
   */
  isConnected?: boolean;

  /**
   * Whether the assistant is thinking (for promo mode)
   */
  isThinking?: boolean;

  /**
   * Error message to display
   */
  error?: string | null;

  /**
   * Callback when a message is sent
   */
  onSendMessage: (message: string, uiState?: string) => Promise<void> | void;

  /**
   * Callback to clear error
   */
  onClearError?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ChatInterface Component
 *
 * Main chat interface component that combines message list and input.
 * Handles the chat conversation area with error states and loading indicators.
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  streamingMessage,
  isLoadingMessages = false,
  isSendingMessage = false,
  isConnected = true,
  isThinking = false,
  error,
  onSendMessage,
  onClearError,
  className,
}) => {
  /**
   * Handle sending message with UI state
   */
  const handleSendMessage = async (message: string) => {
    if (!isConnected) {
      throw new Error('Not connected to chat service');
    }

    // For now, we'll use a simple UI state. In a real app, this could
    // include current page, selected elements, form data, etc.
    const uiState = JSON.stringify({
      page: 'builder',
      timestamp: new Date().toISOString(),
      // Add more UI state as needed
    });

    // Pass the UI state to the onSendMessage callback
    await onSendMessage(message, uiState);
  };

  return (
    <div
      className={cn(
        'h-full flex flex-col bg-background border-border min-h-0',
        className
      )}
    >
      {/* Error alert */}
      {error && (
        <div className="p-4 border-b">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {onClearError && (
                <button
                  onClick={onClearError}
                  className="ml-2 underline hover:no-underline"
                >
                  Dismiss
                </button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Connection status warning */}
      {!isConnected && (
        <div className="p-4 border-b">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Chat is not connected. Please wait for connection to be
              established.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Message list */}
      <ChatMessageList
        messages={messages}
        streamingMessage={streamingMessage}
        isLoading={isLoadingMessages}
        isThinking={isThinking}
        className="flex-1 min-h-0"
      />

      {/* Message input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected}
        isLoading={isSendingMessage}
        placeholder={
          isConnected ? 'Ask me anything...' : 'Waiting for connection...'
        }
      />
    </div>
  );
};

export default ChatInterface;
