'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
} from 'react';
import type {
  LLMMessage,
  LLMThread,
  MessageCreatedEvent,
  MessageStreamEvent,
  MessageCompletedEvent,
  ThreadJoinedEvent,
  ThreadLeftEvent,
  WebSocketErrorEvent,
  ErrorEvent,
} from '@sansa-dev/shared';
import {
  chatAgentWebSocket,
  type ConnectionState,
  type ChatAgentEventListeners,
} from '../lib/chat-agent/websocket.service';
import { tokenManager } from '../lib/api';

/**
 * Streaming message data for real-time updates
 */
export interface StreamingMessage {
  messageId: string;
  threadId: string;
  content: string;
  timestamp: Date;
  rawContent?: string; // Store raw content for tag processing
}

/**
 * Utility function to extract content from response tags
 *
 * @param content - Content that may contain <response> tags
 * @returns Clean content without tags, or original content if no tags found
 */
function extractResponseContent(content: string): string {
  const startTag = '<response>';
  const endTag = '</response>';

  const startIndex = content.indexOf(startTag);
  if (startIndex === -1) {
    return content; // No start tag found, return original
  }

  const contentStart = startIndex + startTag.length;
  const endIndex = content.indexOf(endTag, contentStart);

  if (endIndex === -1) {
    // No end tag found, return content after start tag
    return content.substring(contentStart);
  }

  // Both tags found, return content between them
  return content.substring(contentStart, endIndex);
}

/**
 * Response tag processor for streaming content
 *
 * Extracts content between <response> and </response> tags
 * and manages streaming state based on tag detection
 */
class ResponseTagProcessor {
  private rawContent = '';
  private isInsideResponseTag = false;
  private extractedContent = '';

  /**
   * Process a new chunk of streaming content
   *
   * @param chunk - New content chunk from stream
   * @returns Object with processed content and streaming state
   */
  processChunk(chunk: string): {
    shouldDisplay: boolean;
    displayContent: string;
    isComplete: boolean;
  } {
    // Add chunk to raw content
    this.rawContent += chunk;

    // Check for opening tag
    if (!this.isInsideResponseTag && this.rawContent.includes('<response>')) {
      this.isInsideResponseTag = true;
      // Extract content after <response> tag
      const startIndex =
        this.rawContent.indexOf('<response>') + '<response>'.length;
      this.extractedContent = this.rawContent.substring(startIndex);
    }

    // If we're inside response tags, update extracted content
    if (this.isInsideResponseTag) {
      const startIndex =
        this.rawContent.indexOf('<response>') + '<response>'.length;
      const contentAfterStart = this.rawContent.substring(startIndex);

      // Check for closing tag
      if (contentAfterStart.includes('</response>')) {
        const endIndex = contentAfterStart.indexOf('</response>');
        this.extractedContent = contentAfterStart.substring(0, endIndex);
        return {
          shouldDisplay: true,
          displayContent: this.extractedContent,
          isComplete: true,
        };
      } else {
        this.extractedContent = contentAfterStart;
        return {
          shouldDisplay: true,
          displayContent: this.extractedContent,
          isComplete: false,
        };
      }
    }

    // Not inside response tags yet
    return {
      shouldDisplay: false,
      displayContent: '',
      isComplete: false,
    };
  }

  /**
   * Reset the processor for a new message
   */
  reset(): void {
    this.rawContent = '';
    this.isInsideResponseTag = false;
    this.extractedContent = '';
  }

  /**
   * Get the current extracted content
   */
  getExtractedContent(): string {
    return this.extractedContent;
  }
}

/**
 * Chat agent hook state
 */
export interface ChatAgentState {
  // Connection state - now reads directly from WebSocket service
  connectionState: ConnectionState;
  isConnected: boolean;
  connectionError: string | null;

  // Threads
  threads: LLMThread[];
  activeThreadId: string | null;
  isLoadingThreads: boolean;
  isCreatingThread: boolean;

  // Messages
  messages: LLMMessage[];
  streamingMessage: StreamingMessage | null;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;

  // General error state
  error: string | null;
}

/**
 * Chat agent hook actions
 */
export interface ChatAgentActions {
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;

  // Thread management
  createThread: () => Promise<string>;
  selectThread: (threadId: string) => Promise<void>;
  loadThreads: () => Promise<void>;

  // Message management
  sendMessage: (
    message: string,
    uiState?: string,
    delayMs?: number,
    onComplete?: () => void
  ) => Promise<void>;
  clearMessages: () => void;
}

/**
 * Chat Agent Hook
 *
 * Manages WebSocket connection, thread state, and message handling for the chat agent.
 * Provides a complete interface for chat functionality with real-time updates.
 */
export function useChatAgent(): ChatAgentState & ChatAgentActions {
  // Thread state
  const [threads, setThreads] = useState<LLMThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  // Message state
  const [messages, setMessages] = useState<LLMMessage[]>([]);
  const [streamingMessage, setStreamingMessage] =
    useState<StreamingMessage | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // General error state
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Response tag processor for streaming content
  const responseProcessorRef = useRef<Map<string, ResponseTagProcessor>>(
    new Map()
  );

  // Store the onComplete callback for the current message being sent
  const onCompleteCallbackRef = useRef<(() => void) | undefined>(undefined);

  // Track which messages have started streaming to avoid duplicate callbacks
  const streamingStartedRef = useRef<Set<string>>(new Set());

  // Subscribe to WebSocket connection state changes
  const connectionState = useSyncExternalStore(
    (callback) => {
      chatAgentWebSocket.addListener('onConnectionStateChange', callback);
      return () =>
        chatAgentWebSocket.removeListeners(['onConnectionStateChange']);
    },
    () => chatAgentWebSocket.getConnectionState(),
    () => chatAgentWebSocket.getConnectionState()
  );

  /**
   * Initialize WebSocket event listeners
   */
  const initializeEventListeners = useCallback(() => {
    const listeners: ChatAgentEventListeners = {
      onConnectionStateChange: (state: ConnectionState) => {
        // Connection state is now handled by useSyncExternalStore
        if (state === 'connected') {
          setConnectionError(null);
        } else if (state === 'error') {
          setConnectionError('Connection failed');
        }
      },

      onMessageCreated: (event: MessageCreatedEvent) => {
        console.log('📝 Message created:', event);

        // Add or replace the message in the messages array
        setMessages((prev) => {
          const existingIndex = prev.findIndex(
            (msg) => msg.id === event.message.id
          );

          if (existingIndex >= 0) {
            // Message already exists, replace it
            const newMessages = [...prev];
            newMessages[existingIndex] = event.message;
            return newMessages;
          }

          // Check if this is a user message that should replace an optimistic one
          if (event.message.role === 'user') {
            const optimisticIndex = prev.findIndex(
              (msg) =>
                msg.role === 'user' &&
                msg.threadId === event.message.threadId &&
                msg.id.startsWith('temp-') &&
                // Only replace if created within last 10 seconds (more generous window)
                new Date().getTime() - new Date(msg.createdAt).getTime() < 10000
            );

            if (optimisticIndex >= 0) {
              // Replace the optimistic message with the real one
              const newMessages = [...prev];
              newMessages[optimisticIndex] = event.message;
              console.log(
                '🔄 Replaced optimistic user message with server message:',
                {
                  optimistic: prev[optimisticIndex].id,
                  server: event.message.id,
                }
              );
              return newMessages;
            }
          }

          // Add new message
          return [...prev, event.message];
        });

        // Update thread in threads list
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === event.thread.id ? event.thread : thread
          )
        );
      },

      onMessageStream: (event: MessageStreamEvent) => {
        console.log('🌊 Message stream:', event);

        // Check if this is the first streaming event for this message
        const hasStartedStreaming = streamingStartedRef.current.has(
          event.messageId
        );
        if (!hasStartedStreaming) {
          streamingStartedRef.current.add(event.messageId);
          console.log('🚀 Streaming started for message:', event.messageId);

          // Call onComplete callback to turn off thinking indicator
          if (
            onCompleteCallbackRef.current &&
            typeof onCompleteCallbackRef.current === 'function'
          ) {
            onCompleteCallbackRef.current();
            onCompleteCallbackRef.current = undefined;
          }
        }

        // Get or create response processor for this message
        const processors = responseProcessorRef.current;
        if (!processors.has(event.messageId)) {
          processors.set(event.messageId, new ResponseTagProcessor());
        }
        const processor = processors.get(event.messageId)!;

        // Process the chunk through the response tag processor
        const processed = processor.processChunk(event.content);

        console.log('🏷️ Response tag processing:', {
          messageId: event.messageId,
          chunk: event.content,
          shouldDisplay: processed.shouldDisplay,
          displayContent: processed.displayContent.substring(0, 50) + '...',
          isComplete: processed.isComplete,
        });

        // Only update streaming message if we should display content
        if (processed.shouldDisplay) {
          setStreamingMessage(() => {
            const newStreamingMessage = {
              messageId: event.messageId,
              threadId: event.threadId,
              content: processed.displayContent,
              timestamp: event.timestamp,
              rawContent: processor.getExtractedContent(),
            };

            console.log('📝 Updated streaming message:', {
              messageId: newStreamingMessage.messageId,
              contentLength: newStreamingMessage.content.length,
              content: newStreamingMessage.content.substring(0, 50) + '...',
            });

            return newStreamingMessage;
          });
        }

        // If this is the final chunk, prepare for completion
        if (event.isFinal) {
          console.log(
            '🏁 Final streaming chunk received for message:',
            event.messageId
          );
          // Clean up processor and streaming tracker
          processors.delete(event.messageId);
          streamingStartedRef.current.delete(event.messageId);
        }
      },

      onMessageCompleted: (event: MessageCompletedEvent) => {
        console.log('✅ Message completed:', event);

        // Clean up response processor for this message
        responseProcessorRef.current.delete(event.message.id);

        // Clean the completed message content by removing response tags
        const cleanedMessage = {
          ...event.message,
          content: extractResponseContent(event.message.content),
        };

        console.log('🧹 Cleaned completed message:', {
          messageId: cleanedMessage.id,
          originalContent: event.message.content.substring(0, 100) + '...',
          cleanedContent: cleanedMessage.content.substring(0, 100) + '...',
        });

        // Update the message in the messages array with cleaned content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === event.message.id ? cleanedMessage : msg
          )
        );

        // Update thread in threads list
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === event.thread.id ? event.thread : thread
          )
        );

        // Clear streaming message only if it matches the completed message
        setStreamingMessage((prev) =>
          prev?.messageId === event.message.id ? null : prev
        );

        // Clear sending state
        setIsSendingMessage(false);

        // Clean up streaming tracker
        streamingStartedRef.current.delete(event.message.id);

        // Call onComplete callback if provided (in case streaming didn't start)
        if (
          onCompleteCallbackRef.current &&
          typeof onCompleteCallbackRef.current === 'function'
        ) {
          onCompleteCallbackRef.current();
          onCompleteCallbackRef.current = undefined;
        }
      },

      onThreadJoined: (event: ThreadJoinedEvent) => {
        console.log('🔗 Thread joined:', event);

        // Clean any response tags from existing messages
        const cleanedMessages = event.recentMessages.map((msg) => ({
          ...msg,
          content:
            msg.role === 'assistant'
              ? extractResponseContent(msg.content)
              : msg.content,
        }));

        // Set messages for the joined thread
        setMessages(cleanedMessages);
        setIsLoadingMessages(false);
      },

      onThreadLeft: (event: ThreadLeftEvent) => {
        console.log('🔗 Thread left:', event);

        // Clear messages if leaving the active thread
        if (event.threadId === activeThreadId) {
          setMessages([]);
          setStreamingMessage(null);
        }
      },

      onError: (event: WebSocketErrorEvent | ErrorEvent) => {
        console.error('❌ Chat Agent error:', event);

        const errorMessage =
          'userMessage' in event ? event.userMessage : event.message;

        if (
          event.code === 'WS_CONNECTION_FAILED' ||
          event.code === 'WS_UNAUTHORIZED'
        ) {
          setConnectionError(errorMessage);
        } else {
          setError(errorMessage);
        }

        // Clear all loading states on error
        setIsSendingMessage(false);
        setIsCreatingThread(false);
        setIsLoadingMessages(false);
        setIsLoadingThreads(false);

        // Clear streaming state if there's an error during streaming
        if (event.code === 'WS_STREAM_ERROR') {
          setStreamingMessage(null);
        }

        // Clean up streaming tracker on error
        streamingStartedRef.current.clear();

        // Call onComplete callback if provided (to turn off thinking indicator)
        if (
          onCompleteCallbackRef.current &&
          typeof onCompleteCallbackRef.current === 'function'
        ) {
          onCompleteCallbackRef.current();
          onCompleteCallbackRef.current = undefined;
        }
      },
    };

    console.log('🔧 Setting WebSocket listeners:', Object.keys(listeners));
    console.log('🔧 onMessageStream function:', !!listeners.onMessageStream);
    console.log('🔧 onMessageCreated function:', !!listeners.onMessageCreated);
    console.log(
      '🔧 onMessageCompleted function:',
      !!listeners.onMessageCompleted
    );
    chatAgentWebSocket.setListeners(listeners);
  }, [activeThreadId]);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(async () => {
    try {
      setConnectionError(null);
      await chatAgentWebSocket.connect();
    } catch (error) {
      console.error('Failed to connect to chat agent:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to connect';
      setConnectionError(errorMessage);
    }
  }, []);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    chatAgentWebSocket.disconnect();
    setMessages([]);
    setStreamingMessage(null);
    setThreads([]);
    setActiveThreadId(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setConnectionError(null);
  }, []);

  /**
   * Create a new thread
   */
  const createThread = useCallback(async (): Promise<string> => {
    if (!chatAgentWebSocket.isConnected()) {
      throw new Error('Not connected to chat service');
    }

    setIsCreatingThread(true);
    setError(null);

    try {
      // Create a thread via the REST API first to get a proper UUID
      const response = await fetch('/api/v1/chat-agent/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenManager.getAccessToken()}`,
        },
        body: JSON.stringify({
          title: 'New Conversation',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create thread');
      }

      const newThread = await response.json();

      setThreads((prev) => [newThread, ...prev]);
      setActiveThreadId(newThread.id);
      setMessages([]);
      setStreamingMessage(null);

      return newThread.id;
    } catch (error) {
      console.error('Failed to create thread:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create thread';
      setError(errorMessage);
      throw error;
    } finally {
      setIsCreatingThread(false);
    }
  }, []);

  /**
   * Select and join a thread
   */
  const selectThread = useCallback(
    async (threadId: string) => {
      if (!chatAgentWebSocket.isConnected()) {
        throw new Error('Not connected to chat service');
      }

      setIsLoadingMessages(true);
      setError(null);

      try {
        // Leave current thread if any
        if (activeThreadId && activeThreadId !== threadId) {
          chatAgentWebSocket.leaveThread(activeThreadId);
        }

        // Join new thread
        chatAgentWebSocket.joinThread(threadId);
        setActiveThreadId(threadId);
      } catch (error) {
        console.error('Failed to select thread:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to select thread';
        setError(errorMessage);
        setIsLoadingMessages(false);
      }
    },
    [activeThreadId]
  );

  /**
   * Load user threads (placeholder - would typically fetch from API)
   */
  const loadThreads = useCallback(async () => {
    setIsLoadingThreads(true);
    setError(null);

    try {
      // In a real implementation, this would fetch threads from an API
      // For now, we'll just use the threads we already have
      console.log('Loading threads...');
    } catch (error) {
      console.error('Failed to load threads:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load threads';
      setError(errorMessage);
    } finally {
      setIsLoadingThreads(false);
    }
  }, []);

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async (
      message: string,
      uiState: string = '{}',
      delayMs: number = 0,
      onComplete?: () => void
    ) => {
      if (!chatAgentWebSocket.isConnected()) {
        throw new Error('Not connected to chat service');
      }

      if (!message.trim()) {
        throw new Error('Message cannot be empty');
      }

      let threadId = activeThreadId;

      // If no active thread, create one first
      if (!threadId || threadId.startsWith('temp-')) {
        threadId = await createThread();
      }

      setIsSendingMessage(true);
      setError(null);

      // Store the onComplete callback
      onCompleteCallbackRef.current = onComplete;

      // Optimistically add the user message to the chat
      const tempMessageId = `temp-${Date.now()}`;
      const now = new Date();
      const optimisticMessage: LLMMessage = {
        id: tempMessageId,
        threadId,
        role: 'user',
        content: message.trim(),
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        // Delay the websocket send if specified
        if (delayMs > 0) {
          setTimeout(() => {
            chatAgentWebSocket.sendChatMessage(message, threadId, uiState);
          }, delayMs);
        } else {
          chatAgentWebSocket.sendChatMessage(message, threadId, uiState);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send message';

        // Remove the optimistic message on failure
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));

        setError(errorMessage);
        setIsSendingMessage(false);

        // Call onComplete callback if provided (even on error)
        if (
          onCompleteCallbackRef.current &&
          typeof onCompleteCallbackRef.current === 'function'
        ) {
          onCompleteCallbackRef.current();
          onCompleteCallbackRef.current = undefined;
        }

        throw error;
      }
    },
    [activeThreadId, createThread]
  );

  /**
   * Clear messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingMessage(null);
  }, []);

  /**
   * Initialize the hook - set up listeners immediately
   */
  useEffect(() => {
    console.log('🚀 useChatAgent hook initializing listeners...');
    initializeEventListeners();

    return () => {
      // Cleanup on unmount - remove all listeners except connection state
      // (connection state listener is managed by useSyncExternalStore)
      console.log('🧹 useChatAgent hook cleaning up listeners...');
      chatAgentWebSocket.removeListeners([
        'onMessageCreated',
        'onMessageStream',
        'onMessageCompleted',
        'onThreadJoined',
        'onThreadLeft',
        'onError',
      ]);
    };
  }, [initializeEventListeners]);

  return {
    // State
    connectionState,
    isConnected: connectionState === 'connected',
    connectionError,
    threads,
    activeThreadId,
    isLoadingThreads,
    isCreatingThread,
    messages,
    streamingMessage,
    isLoadingMessages,
    isSendingMessage,
    error,

    // Actions
    connect,
    disconnect,
    clearError,
    createThread,
    selectThread,
    loadThreads,
    sendMessage,
    clearMessages,
  };
}

export default useChatAgent;
