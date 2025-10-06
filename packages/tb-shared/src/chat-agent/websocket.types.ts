/**
 * Chat Agent WebSocket Types
 *
 * Types for WebSocket events and payloads used in the Chat Agent system.
 * These define the real-time communication protocol between client and server.
 */

import { LLMMessage } from './message.types';
import { LLMThread } from './thread.types';

/**
 * Base WebSocket event structure
 */
export type BaseWebSocketEvent = {
  /**
   * Unique identifier for this event (for tracking responses)
   */
  eventId?: string;

  /**
   * Timestamp when the event was created
   */
  timestamp: Date;
};

/**
 * Client-to-Server Events
 */

/**
 * Event to send a chat message
 *
 * Threading semantics:
 * - If isInitial is true, threadId must be omitted (new thread will be created)
 * - If isInitial is false, threadId is required (continue existing thread)
 */
export type ChatMessageEvent = BaseWebSocketEvent & {
  /**
   * The user's message content
   */
  message: string;

  /**
   * The thread ID to continue existing conversation.
   * Must be omitted when isInitial is true, required when isInitial is false.
   */
  threadId?: string;

  /**
   * The current UI state as a string (REQUIRED)
   * This provides the agent with the latest UI context for the user.
   */
  uiState: string;
};

/**
 * Event to join a specific thread room
 */
export type JoinThreadEvent = BaseWebSocketEvent & {
  /**
   * ID of the thread to join
   */
  threadId: string;
};

/**
 * Event to leave a thread room
 */
export type LeaveThreadEvent = BaseWebSocketEvent & {
  /**
   * ID of the thread to leave
   */
  threadId: string;
};

/**
 * Event to send UI state update after navigation
 */
export type UIStateUpdateEvent = BaseWebSocketEvent & {
  /**
   * Turn ID that triggered the navigation
   */
  turnId: string;
  /**
   * Fresh UI state after navigation
   */
  uiState: string;

  /**
   * cover state, tells the server if open-app command is required
   */
  coverState: boolean;
};

/**
 * Server-to-Client Events
 */

/**
 * Event sent when a new message is created
 */
export type MessageCreatedEvent = BaseWebSocketEvent & {
  /**
   * The created message
   */
  message: LLMMessage;

  /**
   * The thread the message belongs to
   */
  thread: LLMThread;
};

/**
 * Event sent when streaming a response from the LLM
 */
export type MessageStreamEvent = BaseWebSocketEvent & {
  /**
   * ID of the message being streamed
   */
  messageId: string;

  /**
   * ID of the thread
   */
  threadId: string;

  /**
   * Partial content chunk
   */
  content: string;

  /**
   * Whether this is the final chunk in the stream
   */
  isFinal: boolean;

  /**
   * Stream metadata (token count, etc.)
   */
  metadata?: Record<string, unknown>;
};

/**
 * Event sent when a message is completed
 */
export type MessageCompletedEvent = BaseWebSocketEvent & {
  /**
   * The completed message
   */
  message: LLMMessage;

  /**
   * Updated thread information
   */
  thread: LLMThread;
};

/**
 * Event sent when an error occurs
 */
export type ErrorEvent = BaseWebSocketEvent & {
  /**
   * Error code
   */
  code: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Additional error details
   */
  details?: Record<string, unknown>;

  /**
   * ID of the event that caused this error (if applicable)
   */
  relatedEventId?: string;
};

/**
 * Event sent when successfully joining a thread
 */
export type ThreadJoinedEvent = BaseWebSocketEvent & {
  /**
   * The thread that was joined
   */
  thread: LLMThread;

  /**
   * Recent messages in the thread
   */
  recentMessages: LLMMessage[];
};

/**
 * Event sent when successfully leaving a thread
 */
export type ThreadLeftEvent = BaseWebSocketEvent & {
  /**
   * ID of the thread that was left
   */
  threadId: string;
};

/**
 * Union type for all client-to-server events
 */
export type ClientToServerEvents = {
  chat_message: ChatMessageEvent;
  join_thread: JoinThreadEvent;
  leave_thread: LeaveThreadEvent;
  ui_state_update: UIStateUpdateEvent;
};

/**
 * Union type for all server-to-client events
 */
export type ServerToClientEvents = {
  message_created: MessageCreatedEvent;
  message_stream: MessageStreamEvent;
  message_completed: MessageCompletedEvent;
  error: ErrorEvent;
  thread_joined: ThreadJoinedEvent;
  thread_left: ThreadLeftEvent;
};

/**
 * WebSocket connection authentication data
 */
export type WebSocketAuthData = {
  /**
   * JWT token for authentication
   */
  token: string;

  /**
   * ID of the authenticated user
   */
  userId: string;
};
