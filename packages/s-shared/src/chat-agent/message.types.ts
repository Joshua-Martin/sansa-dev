/**
 * Chat Agent Message Types
 *
 * Types for managing individual messages within chat threads.
 * Messages represent the actual conversation content between users and the LLM.
 */

import { AIProvider } from './models';

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
   * AI model used for this message
   */
  model: string;

  /**
   * AI provider used for this message
   */
  provider: AIProvider;

  /**
   * Number of tokens used in this message
   */
  tokenCountInput: number;

  /**
   * Number of tokens used in this message
   */
  tokenCountOutput: number;

  /**
   * Cost of tokens used in this message
   */
  tokenCostInput: number;

  /**
   * Cost of tokens used in this message
   */
  tokenCostOutput: number;

  /**
   * Total cost of this message
   */
  messageCost: number;

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
   * AI model used for this message
   */
  model: string;

  /**
   * AI provider used for this message
   */
  provider: AIProvider;

  /**
   * Number of input tokens used in this message
   */
  tokenCountInput: number;

  /**
   * Number of output tokens used in this message
   */
  tokenCountOutput: number;

  /**
   * Cost of input tokens used in this message
   */
  tokenCostInput: number;

  /**
   * Cost of output tokens used in this message
   */
  tokenCostOutput: number;

  /**
   * Total cost of this message
   */
  messageCost: number;
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
   * AI model used for this message
   */
  model?: string;

  /**
   * AI provider used for this message
   */
  provider?: AIProvider;

  /**
   * Number of input tokens used in this message
   */
  tokenCountInput?: number;

  /**
   * Number of output tokens used in this message
   */
  tokenCountOutput?: number;

  /**
   * Cost of input tokens used in this message
   */
  tokenCostInput?: number;

  /**
   * Cost of output tokens used in this message
   */
  tokenCostOutput?: number;

  /**
   * Total cost of this message
   */
  messageCost?: number;
};
