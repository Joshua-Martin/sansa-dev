import Anthropic from '@anthropic-ai/sdk';
import { AnthropicModel } from '../constants/anthropic.constants';

/**
 * types for Anthropic API content blocks
 */
export type TextContent = {
  type: 'text';
  text: string;
};

export type ImageContent = {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data: string;
  };
};

export type ToolResultContent = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
};

export type MessageContent = TextContent | ImageContent | ToolResultContent;

/**
 * type for Anthropic message structure
 */
export type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string | MessageContent[];
};

/**
 * Tool definition types
 */
export type AnthropicTool = Anthropic.Tool;
export type ToolChoice =
  | { type: 'auto'; disable_parallel_tool_use?: boolean }
  | { type: 'any'; disable_parallel_tool_use?: boolean }
  | { type: 'tool'; name: string; disable_parallel_tool_use?: boolean };

/**
 * MessageStream event types from Anthropic SDK
 */
export type MessageStreamEvent = Anthropic.Messages.MessageStreamEvent;
export type ContentBlockStartEvent = Anthropic.Messages.ContentBlockStartEvent;
export type ContentBlockStopEvent = Anthropic.Messages.ContentBlockStopEvent;
export type ContentBlockDeltaEvent = Anthropic.Messages.ContentBlockDeltaEvent;

/**
 * type for Anthropic chat completion requests and responses
 */
export type AnthropicCompletionRequest = {
  /**
   * The system message providing context/instructions
   */
  system?: string;
  userMessage: string;
  /**
   * Optional array of previous messages in the conversation
   */
  messages?: AnthropicMessage[];
  model?: AnthropicModel;
  tools?: AnthropicTool[];
  toolChoice?: ToolChoice;
  temperature?: number;
  maxTokens?: number;
  /**
   * Whether to stream the response
   */
  stream?: boolean;
};

export type ToolCall = {
  type: 'tool_use';
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnthropicCompletionResponse<T = any> = {
  content: string | MessageContent[];
  toolCalls?: ToolCall[];
  parsedOutput?: T;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
};
