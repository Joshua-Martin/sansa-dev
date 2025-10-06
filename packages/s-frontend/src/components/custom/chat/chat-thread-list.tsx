'use client';

import React from 'react';
import { Plus, MessageSquare, Clock, Trash2 } from 'lucide-react';
import type { LLMThread } from '@sansa-dev/s-shared';
import { cn } from '../../../lib/utils/utils';
import { Button } from '../../common/button';
import { ScrollArea } from '../../common/scroll-area';
import { Skeleton } from '../../common/skeleton';
import { Badge } from '../../common/badge';

/**
 * Props for ChatThreadList component
 */
export interface ChatThreadListProps {
  /**
   * Array of threads to display
   */
  threads: LLMThread[];

  /**
   * Currently active thread ID
   */
  activeThreadId?: string | null;

  /**
   * Whether threads are loading
   */
  isLoading?: boolean;

  /**
   * Whether a new thread is being created
   */
  isCreatingThread?: boolean;

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
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ChatThreadList Component
 *
 * Displays a list of chat threads with the ability to select, create, and delete threads.
 * Shows thread titles, message counts, and last activity timestamps.
 */
export const ChatThreadList: React.FC<ChatThreadListProps> = ({
  threads,
  activeThreadId,
  isLoading = false,
  isCreatingThread = false,
  onThreadSelect,
  onCreateThread,
  onDeleteThread,
  className,
}) => {
  /**
   * Format relative time for last message
   */
  const formatRelativeTime = (date: Date | string | null): string => {
    if (!date) return 'No messages';

    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor(
      (now.getTime() - messageDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return messageDate.toLocaleDateString();
  };

  /**
   * Render loading skeleton
   */
  const renderLoadingSkeleton = () => (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-2 p-3 rounded-lg border">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
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
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <div className="text-lg font-medium mb-2">No conversations yet</div>
        <div className="text-sm mb-4">Start a new chat to begin.</div>
        <Button onClick={onCreateThread} size="sm" disabled={isCreatingThread}>
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={cn('h-full', className)}>
        <div className="p-4 border-b">
          <Button className="w-full" disabled>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
        {renderLoadingSkeleton()}
      </div>
    );
  }

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header with new chat button */}
      <div className="p-4 border-b bg-white dark:bg-gray-800">
        <Button
          onClick={onCreateThread}
          disabled={isCreatingThread}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isCreatingThread ? 'Creating...' : 'New Chat'}
        </Button>
      </div>

      {/* Thread list */}
      <ScrollArea className="flex-1">
        {threads.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-1 p-2">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={cn(
                  'group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                  'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                  activeThreadId === thread.id &&
                    'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800'
                )}
                onClick={() => onThreadSelect(thread.id)}
              >
                <div className="flex-1 min-w-0">
                  {/* Thread title */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={cn(
                        'text-sm font-medium truncate',
                        activeThreadId === thread.id
                          ? 'text-blue-900 dark:text-blue-100'
                          : 'text-gray-900 dark:text-gray-100'
                      )}
                    >
                      {thread.title}
                    </h3>

                    {/* Status badge */}
                    {thread.status !== 'active' && (
                      <Badge variant="secondary" className="text-xs">
                        {thread.status}
                      </Badge>
                    )}
                  </div>

                  {/* Thread metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{thread.messageCount} messages</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(thread.lastMessageAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                {onDeleteThread && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0',
                      'hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteThread(thread.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="sr-only">Delete thread</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ChatThreadList;
