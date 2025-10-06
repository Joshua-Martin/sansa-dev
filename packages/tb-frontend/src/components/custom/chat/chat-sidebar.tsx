'use client';

import React from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import type { LLMThread } from '../../../../../tb-shared/src';
import type { ConnectionState } from '../../../lib/chat-agent/websocket.service';
import { cn } from '../../../lib/utils/utils';
import { Alert, AlertDescription } from '../../common/alert';
import { Badge } from '../../common/badge';
import ChatThreadList from './chat-thread-list';

/**
 * Props for ChatSidebar component
 */
export interface ChatSidebarProps {
  /**
   * Array of threads to display
   */
  threads: LLMThread[];

  /**
   * Currently active thread ID
   */
  activeThreadId?: string | null;

  /**
   * WebSocket connection state
   */
  connectionState: ConnectionState;

  /**
   * Whether threads are loading
   */
  isLoadingThreads?: boolean;

  /**
   * Whether a new thread is being created
   */
  isCreatingThread?: boolean;

  /**
   * Connection error message
   */
  connectionError?: string | null;

  /**
   * Callback when a thread is selected
   */
  onThreadSelect: (threadId: string) => void;

  /**
   * Callback when creating a new thread
   */
  onCreateThread: () => Promise<void> | void;

  /**
   * Callback when deleting a thread (optional)
   */
  onDeleteThread?: (threadId: string) => Promise<void> | void;

  /**
   * Callback to clear connection error
   */
  onClearError?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ChatSidebar Component
 *
 * Main sidebar component for chat functionality. Includes connection status,
 * thread list, and error handling. Designed to be used as a sidebar in the builder.
 */
export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  threads,
  activeThreadId,
  connectionState,
  isLoadingThreads = false,
  isCreatingThread = false,
  connectionError,
  onThreadSelect,
  onCreateThread,
  onDeleteThread,
  onClearError,
  className,
}) => {
  /**
   * Get connection status display info
   */
  const getConnectionStatus = () => {
    switch (connectionState) {
      case 'connected':
        return {
          icon: <Wifi className="h-4 w-4" />,
          text: 'Connected',
          variant: 'default' as const,
          color: 'text-green-600 dark:text-green-400',
        };
      case 'connecting':
        return {
          icon: <Wifi className="h-4 w-4 animate-pulse" />,
          text: 'Connecting...',
          variant: 'secondary' as const,
          color: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Disconnected',
          variant: 'secondary' as const,
          color: 'text-gray-600 dark:text-gray-400',
        };
      case 'error':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Connection Error',
          variant: 'destructive' as const,
          color: 'text-red-600 dark:text-red-400',
        };
      default:
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Unknown',
          variant: 'secondary' as const,
          color: 'text-gray-600 dark:text-gray-400',
        };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div
      className={cn(
        'h-full flex flex-col bg-background border-r border-border',
        className
      )}
    >
      {/* Header with connection status */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">AI Chat</h2>

          {/* Connection status badge */}
          <Badge variant={connectionStatus.variant} className="text-xs">
            <span
              className={cn('flex items-center gap-1', connectionStatus.color)}
            >
              {connectionStatus.icon}
              {connectionStatus.text}
            </span>
          </Badge>
        </div>

        {/* Connection error alert */}
        {connectionError && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {connectionError}
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
        )}
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-hidden">
        <ChatThreadList
          threads={threads}
          activeThreadId={activeThreadId}
          isLoading={isLoadingThreads}
          isCreatingThread={isCreatingThread}
          onThreadSelect={onThreadSelect}
          onCreateThread={onCreateThread}
          onDeleteThread={onDeleteThread}
        />
      </div>
    </div>
  );
};

export default ChatSidebar;
