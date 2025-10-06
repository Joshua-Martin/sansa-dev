/**
 * Unified types for all AI providers
 *
 * This file contains all shared types and types used across different AI providers
 * in the unified LLM service architecture.
 */

import { AnthropicModel } from '../constants/anthropic.constants';
import { OpenAIModel } from '../constants/openai.constants';
import { MessageContent } from './anthropic.types';

/**
 * JSON value types for tool parameters and responses
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

/**
 * Supported LLM providers
 */
export type LLMProvider = 'openai' | 'anthropic';

/**
 * Unified tool definition that can be converted to provider-specific formats
 */
export type UnifiedTool = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, JsonValue>;
      required?: string[];
      additionalProperties?: boolean;
    };
  };
};

/**
 * Unified message format that can be converted to provider-specific formats
 */
export type UnifiedMessage = {
  role: 'user' | 'assistant' | 'system' | 'developer';
  content: string | MessageContent[];
};

/**
 * Unified tool call response format
 */
export type UnifiedToolCall = {
  name: string;
  arguments: Record<string, JsonValue>;
};

/**
 * Usage information from AI providers
 */
export type UnifiedUsage = {
  inputTokens: number;
  outputTokens: number;
};

/**
 * Unified LLM response format
 */
export type UnifiedLLMResponse = {
  text?: string;
  toolCalls?: UnifiedToolCall[];
  id?: string;
  usage?: UnifiedUsage;
};

/**
 * Unified streaming chunk format
 */
export type UnifiedStreamChunk = {
  text?: string;
  toolCall?: {
    name?: string;
    arguments?: string;
    accumulatedArguments?: string;
    id?: string;
    is_done?: boolean;
  };
  is_final?: boolean;
  finish_reason?: string;
  id?: string;
  usage?: UnifiedUsage;
};

/**
 * Unified tool choice format
 */
export type UnifiedToolChoice =
  | 'auto'
  | 'none'
  | 'required'
  | { type: 'function'; function: { name: string } };

/**
 * Base unified request properties shared across all providers
 */
type BaseUnifiedRequest = {
  temperature?: number;
  maxTokens?: number;
  // Platform & Flow Props, used to track usage
  platformId?: string;
  flowId?: string;
  workspaceId?: string;
  // TODO: Rename when 'piece' is renamed
  pieceId?: string;
  // LLM Request Props
  tools?: UnifiedTool[];
  // Map to "instructions" in OpenAI if provided
  systemMessage?: string;
  messages?: UnifiedMessage[];
  toolChoice?: UnifiedToolChoice;
  // Stream response flag
  stream?: boolean;
};

/**
 * Image input object for image requests
 */
export type UnifiedImageInput = {
  imageUrl: string;
  detail: 'low' | 'high' | 'auto';
};

/**
 * OpenAI unified request type
 */
export type OpenAIUnifiedRequest = {
  provider: 'openai';
  model?: OpenAIModel;
  message?: string;
  // Previous Response ID, used for conversation continuity (OpenAI only)
  previousResponseId?: string;
  // Search specific, only for OpenAI
  isSearch?: boolean;
  /**
   * If true, this is an image request (forces GPT_4_1_MINI)
   */
  isImage?: boolean;
  /**
   * Optional array of images to include in the request
   */
  images?: UnifiedImageInput[];
} & BaseUnifiedRequest;

/**
 * Anthropic unified request type
 */
export type AnthropicUnifiedRequest = {
  provider: 'anthropic';
  model?: AnthropicModel;
  message?: string;
  // Image fields are not supported for Anthropic
  isImage?: never;
  images?: never;
} & BaseUnifiedRequest;

/**
 * Unified LLM request type that can be any of the provider-specific requests
 */
export type UnifiedLLMRequest = OpenAIUnifiedRequest | AnthropicUnifiedRequest;
