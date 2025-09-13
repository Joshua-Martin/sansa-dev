/**
 * Chat Agent Message Types
 *
 * Types for managing individual messages within chat threads.
 * Messages represent the actual conversation content between users and the LLM.
 */

/**
 * Role of the message sender
 */
export type LLMMessageRole = 'user' | 'assistant' | 'system';

/**
 * Status of an LLM message
 */
export type LLMMessageStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

/**
 * LLM Chat Message
 *
 * Represents a single message within a chat thread.
 * Can be from a user, assistant (LLM), or system.
 */
export type LLMMessage = {
  /**
   * Unique identifier for the message
   */
  id: string;

  /**
   * ID of the thread this message belongs to
   */
  threadId: string;

  /**
   * Role of the message sender
   */
  role: LLMMessageRole;

  /**
   * Content of the message
   */
  content: string;

  /**
   * Current status of the message
   */
  status: LLMMessageStatus;

  /**
   * Optional metadata for the message
   * Can store additional context, model info, etc.
   */
  metadata?: Record<string, unknown>;

  /**
   * Timestamp when the message was created
   */
  createdAt: Date;

  /**
   * Timestamp when the message was last updated
   */
  updatedAt: Date;
};

/**
 * Request to create a new LLM message
 */
export type CreateLLMMessageRequest = {
  /**
   * ID of the thread to add the message to
   */
  threadId: string;

  /**
   * Role of the message sender
   */
  role: LLMMessageRole;

  /**
   * Content of the message
   */
  content: string;

  /**
   * Optional metadata for the message
   */
  metadata?: Record<string, unknown>;
};

/**
 * Request to update an existing LLM message
 */
export type UpdateLLMMessageRequest = {
  /**
   * New content for the message
   */
  content?: string;

  /**
   * New status for the message
   */
  status?: LLMMessageStatus;

  /**
   * New metadata for the message
   */
  metadata?: Record<string, unknown>;
};
