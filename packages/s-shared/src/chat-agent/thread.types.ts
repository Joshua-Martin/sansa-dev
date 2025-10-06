/**
 * Chat Agent Thread Types
 *
 * Types for managing chat threads in the Chat Agent system.
 * Threads represent conversation contexts that persist across multiple messages.
 */

/**
 * Status of an LLM chat thread
 */
export type LLMThreadStatus = 'active' | 'paused' | 'archived' | 'deleted';

/**
 * LLM Chat Thread
 *
 * Represents a conversation thread between a user and the LLM system.
 * Contains metadata about the conversation and references to messages.
 */
export type LLMThread = {
  /**
   * Unique identifier for the thread
   */
  id: string;

  /**
   * ID of the user who owns this thread
   */
  userId: string;

  /**
   * Human-readable title for the thread
   * Generated from the first message or set by user
   */
  title: string;

  /**
   * Current status of the thread
   */
  status: LLMThreadStatus;

  /**
   * Count of messages in this thread
   */
  messageCount: number;

  /**
   * Timestamp when the thread was created
   */
  createdAt: Date;

  /**
   * Timestamp when the thread was last updated
   */
  updatedAt: Date;

  /**
   * Timestamp of the last message in the thread
   */
  lastMessageAt: Date | null;
};

/**
 * Request to create a new LLM thread
 */
export type CreateLLMThreadRequest = {
  /**
   * Optional title for the thread
   * If not provided, will be generated from first message
   */
  title?: string;
};

/**
 * Request to update an existing LLM thread
 */
export type UpdateLLMThreadRequest = {
  /**
   * New title for the thread
   */
  title?: string;

  /**
   * New status for the thread
   */
  status?: LLMThreadStatus;
};
