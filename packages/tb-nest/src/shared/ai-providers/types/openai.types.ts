import { Tool } from 'openai/resources/responses/responses';
import { OpenAIModel } from '../constants/openai.constants';

/**
 * Common properties shared between API requests
 */
type BaseRequestParams = {
  model?: OpenAIModel;
  temperature?: number;
  maxTokens?: number;
};

/**
 * Content block for OpenAI input (text or image)
 */
export type ResponseContentBlock =
  | { type: 'input_text'; text: string }
  | { type: 'input_image'; image_url: string; detail: 'low' | 'high' | 'auto' };

/**
 * Message object for conversation context or content array (for images)
 */
export type ResponseMessage = {
  role: 'user' | 'assistant' | 'developer';
  content: string | ResponseContentBlock[];
};

/**
 * type for OpenAI Responses API request
 */
export type ResponseRequest = {
  /**
   * Input message for the model - can be a string, an array of message objects, or an array of message objects with content arrays (for images)
   */
  input: string | ResponseMessage[];

  /**
   * Optional instructions/system prompt for the model
   */
  instructions?: string;

  /**
   * Whether to stream the response
   */
  stream?: boolean;

  /**
   * Optional tools the model can use
   */
  tools?: Tool[];

  /**
   * Tool choice for the model
   */
  toolChoice?:
    | 'auto'
    | 'none'
    | 'required'
    | { type: 'function'; name: string };

  /**
   * Optional previous response ID for conversation continuity
   */
  previousResponseId?: string;
} & BaseRequestParams;

/**
 * Tool call object returned by the model
 */
export type ResponseToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

/**
 * Usage information from OpenAI
 */
export type ResponseUsage = {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};

/**
 * type for OpenAI Responses API response
 */
export type ResponseResponse = {
  /**
   * The text output from the model
   */
  output_text: string;

  /**
   * Reason why the response finished
   */
  finish_reason: string;

  /**
   * Optional tool calls made by the model
   */
  tool_calls?: ResponseToolCall[];

  /**
   * Unique ID of this response (useful for conversation continuity)
   */
  id: string;

  /**
   * Token usage information
   */
  usage?: ResponseUsage;
};

/**
 * Type for a streamed chunk from the Responses API
 */
export type ResponseChunk = {
  /**
   * The partial text output in this chunk
   */
  text?: string;

  /**
   * Tool call information if present in this chunk
   */
  tool_call?: ResponseToolCall;

  /**
   * Indicates if this is the final chunk
   */
  is_final?: boolean;

  /**
   * Indicates if a function call is completed
   */
  is_function_done?: boolean;

  /**
   * Finish reason, only present in the final chunk
   */
  finish_reason?: string;

  /**
   * Response ID, only present in the final chunk
   */
  id?: string;

  /**
   * Usage information, present in the final chunk
   */
  usage?: ResponseUsage;
};

export type ResponseImage = {
  type: 'input_image';
  image_url: string;
  detail: 'low' | 'high' | 'auto';
};
