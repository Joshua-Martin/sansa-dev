'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, Plus } from 'lucide-react';
import { Button } from '../../common/button';
import { cn } from '../../../lib/utils/utils';
import { useChatAgent } from '../../../hooks/useChatAgent';
import ChatInterface from './chat-interface';
import ChatThreadList from './chat-thread-list';
import { LogoMark } from '../brand/logo-mark';

/**
 * Props for ChatMain component
 */
export interface ChatMainProps {
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ChatMain Component
 *
 * Main chat component that prioritizes the chat interface with an optional
 * sidebar overlay for thread management. The chat is the primary feature,
 * with thread management as a secondary overlay.
 */
export const ChatMain: React.FC<ChatMainProps> = ({ className }) => {
  const [showThreadSidebar, setShowThreadSidebar] = useState(false);

  const {
    // Connection state
    connectionState,
    isConnected,

    // Threads
    threads,
    activeThreadId,
    isLoadingThreads,
    isCreatingThread,

    // Messages
    messages,
    streamingMessage,
    isLoadingMessages,
    isSendingMessage,

    // General error
    error,

    // Actions
    connect,
    clearError,
    createThread,
    selectThread,
    sendMessage,
  } = useChatAgent();

  /**
   * Connect to WebSocket when component mounts (if not already connected)
   */
  useEffect(() => {
    if (connectionState === 'disconnected') {
      connect().catch((error) => {
        console.error('Failed to connect to chat agent:', error);
      });
    }
  }, [connect, connectionState]);

  /**
   * Handle sending a message with UI state
   */
  const handleSendMessage = async (message: string, uiState?: string) => {
    const currentUiState =
      uiState ||
      JSON.stringify({
        page: 'builder',
        timestamp: new Date().toISOString(),
        activeThreadId,
      });

    await sendMessage(message, currentUiState);
  };

  /**
   * Handle thread selection
   */
  const handleThreadSelect = async (threadId: string) => {
    await selectThread(threadId);
    setShowThreadSidebar(false); // Close sidebar after selection
  };

  /**
   * Handle creating new thread
   */
  const handleCreateThread = async () => {
    await createThread();
    setShowThreadSidebar(false); // Close sidebar after creation
  };

  /**
   * Toggle thread sidebar
   */
  const toggleThreadSidebar = () => {
    setShowThreadSidebar(!showThreadSidebar);
  };

  return (
    <div
      className={cn(
        'max-h-screen h-full flex relative bg-background',
        className
      )}
    >
      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header with menu button */}
        <div className="flex items-center justify-between p-2 pt-4 border-b bg-background border-border">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleThreadSidebar}
              className="h-8 w-8 p-0"
            >
              {showThreadSidebar ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showThreadSidebar ? 'Close menu' : 'Open menu'}
              </span>
            </Button>
          </div>

          {/* New chat button */}
          <Button
            onClick={handleCreateThread}
            disabled={isCreatingThread}
            size="icon"
            variant="ghost"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">New chat</span>
          </Button>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 min-h-0">
          <ChatInterface
            messages={messages}
            streamingMessage={streamingMessage}
            isLoadingMessages={isLoadingMessages}
            isSendingMessage={isSendingMessage}
            isConnected={isConnected}
            error={error}
            onSendMessage={handleSendMessage}
            onClearError={clearError}
          />
        </div>
      </div>

      {/* Thread Sidebar Overlay */}
      {showThreadSidebar && (
        <>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 z-40"
            onClick={() => setShowThreadSidebar(false)}
          />

          {/* Sidebar */}
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-background border-r shadow-lg z-50">
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="p-4 border-b bg-background">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Conversations
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowThreadSidebar(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </div>

              {/* Thread List */}
              <div className="flex-1 overflow-hidden">
                <ChatThreadList
                  threads={threads}
                  activeThreadId={activeThreadId}
                  isLoading={isLoadingThreads}
                  isCreatingThread={isCreatingThread}
                  onThreadSelect={handleThreadSelect}
                  onCreateThread={handleCreateThread}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatMain;
