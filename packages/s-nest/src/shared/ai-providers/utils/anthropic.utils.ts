/**
 * Anthropic-specific utility functions for converting between unified and Anthropic formats
 */

import Anthropic from '@anthropic-ai/sdk';
import { Message } from '@anthropic-ai/sdk/resources';
import { Logger } from '../../utils/logger';
import {
  AnthropicCompletionRequest,
  AnthropicMessage,
  AnthropicTool,
  ToolChoice as AnthropicToolChoice,
  TextContent,
} from '../types/anthropic.types';
import {
  AnthropicUnifiedRequest,
  JsonValue,
  safeJsonParse,
  UnifiedLLMResponse,
  UnifiedMessage,
  UnifiedStreamChunk,
  UnifiedTool,
  UnifiedToolCall,
  UnifiedToolChoice,
} from './common.utils';

/**
 * Logger instance for Anthropic utilities
 */
const logger = new Logger('AnthropicUtils');

// Re-export the Anthropic unified request type for convenience
export type { AnthropicUnifiedRequest } from './common.utils';

/**
 * Converts OpenAI-style tools to Anthropic format
 *
 * @param {UnifiedTool[]} tools - Array of unified tool definitions
 * @returns {AnthropicTool[]} Tools formatted for Anthropic
 */
export function convertToolsToAnthropic(tools: UnifiedTool[]): AnthropicTool[] {
  return tools.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: {
      type: 'object',
      properties: tool.function.parameters.properties,
      required: tool.function.parameters.required,
      additionalProperties: tool.function.parameters.additionalProperties,
    },
  }));
}

/**
 * Converts unified tool choice format to Anthropic format
 *
 * @param {UnifiedToolChoice} toolChoice - The unified tool choice
 * @returns {AnthropicToolChoice | undefined} Tool choice formatted for Anthropic
 */
export function convertToolChoiceToAnthropic(
  toolChoice?: UnifiedToolChoice,
): AnthropicToolChoice | undefined {
  if (!toolChoice || toolChoice === 'none') return undefined;
  if (toolChoice === 'required') return { type: 'any' };
  if (toolChoice === 'auto') return { type: 'auto' };
  return {
    type: 'tool',
    name: toolChoice.function.name,
  };
}

/**
 * Converts UnifiedMessage array to Anthropic format
 *
 * @param {UnifiedMessage[]} messages - Array of unified messages
 * @returns {AnthropicMessage[]} Messages formatted for Anthropic
 */
export function convertMessagesToAnthropic(
  messages: UnifiedMessage[],
): AnthropicMessage[] {
  return messages
    .filter(
      (message) => message.role !== 'system' && message.role !== 'developer',
    )
    .map((message) => ({
      role: message.role as 'user' | 'assistant',
      content:
        typeof message.content === 'string'
          ? message.content
          : (message.content[0] as TextContent).text,
    }));
}

/**
 * Creates an Anthropic completion request from a unified request
 *
 * @param {AnthropicUnifiedRequest} request - The unified request
 * @returns {AnthropicCompletionRequest} The Anthropic-specific request
 */
export function createAnthropicCompletionRequest(
  request: AnthropicUnifiedRequest,
): AnthropicCompletionRequest {
  return {
    system: request.systemMessage,
    userMessage: request.message || '',
    messages: request.messages
      ? convertMessagesToAnthropic(request.messages)
      : undefined,
    model: request.model,
    tools: request.tools ? convertToolsToAnthropic(request.tools) : undefined,
    toolChoice: request.toolChoice
      ? convertToolChoiceToAnthropic(request.toolChoice)
      : undefined,
    temperature: request.temperature,
    maxTokens: request.maxTokens,
    stream: request.stream,
  };
}

/**
 * Parses Anthropic response into unified format
 *
 * @param {Message} response - The Anthropic response
 * @returns {UnifiedLLMResponse} Response in unified format
 */
export function parseAnthropicResponse(response: Message): UnifiedLLMResponse {
  const toolCalls: UnifiedToolCall[] = [];
  let text: string | undefined;

  response.content.forEach((block) => {
    if (block.type === 'text') {
      text = (text || '') + block.text;
    } else if (block.type === 'tool_use') {
      const parsedInput: Record<string, JsonValue> = {};

      // Handle each field in the input
      try {
        for (const [key, value] of Object.entries(
          block.input as Record<string, unknown>,
        )) {
          if (typeof value === 'string') {
            try {
              parsedInput[key] = safeJsonParse(value);
            } catch (e) {
              logger.error(`Failed to parse value for key ${key}:`, e);
              parsedInput[key] = value;
            }
          } else {
            parsedInput[key] = value as JsonValue;
          }
        }
      } catch (error) {
        logger.error('Error parsing tool inputs:', error);
      }

      toolCalls.push({
        name: block.name,
        arguments: parsedInput,
      });
    }
  });

  return {
    text,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    id: response.id,
    usage: response.usage
      ? {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        }
      : undefined,
  };
}

/**
 * Processes an Anthropic stream into our unified format
 *
 * @param {AsyncIterable<Anthropic.Messages.MessageStreamEvent>} stream - The Anthropic stream
 * @returns {AsyncGenerator<UnifiedStreamChunk>} An async generator yielding UnifiedStreamChunk objects
 */
export async function* processAnthropicStream(
  stream: AsyncIterable<Anthropic.Messages.MessageStreamEvent>,
): AsyncGenerator<UnifiedStreamChunk> {
  try {
    let accumulatedToolInput = '';
    let currentToolId = '';
    let currentToolName = '';
    let isToolUse = false;
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const event of stream) {
      // Handle each event type
      if (event.type === 'message_start') {
        // Message started, capture initial usage if available
        if (event.message?.usage) {
          inputTokens = event.message.usage.input_tokens;
          outputTokens = event.message.usage.output_tokens;
        }
        continue;
      } else if (event.type === 'content_block_start') {
        // Track tool use blocks
        if (event.content_block?.type === 'tool_use') {
          isToolUse = true;
          currentToolId = event.content_block.id || '';
          currentToolName = event.content_block.name || '';
          accumulatedToolInput = '';
        }
      } else if (event.type === 'content_block_delta') {
        // Handle different types of deltas
        if (event.delta.type === 'text_delta') {
          // Text content
          yield {
            text: event.delta.text,
          };
        } else if (event.delta.type === 'input_json_delta') {
          // Tool call JSON input being streamed
          isToolUse = true;

          // Append the new JSON delta to our accumulated string
          const partialJson = event.delta.partial_json || '';
          accumulatedToolInput += partialJson;

          // Stream both the partial JSON delta and the accumulated JSON so far
          yield {
            toolCall: {
              id: currentToolId,
              name: currentToolName,
              arguments: partialJson,
              accumulatedArguments: accumulatedToolInput,
              is_done: false,
            },
          };
        }
      } else if (event.type === 'content_block_stop') {
        // If we were accumulating tool input, mark it as done
        if (isToolUse && accumulatedToolInput) {
          yield {
            toolCall: {
              id: currentToolId,
              name: currentToolName,
              arguments: accumulatedToolInput,
              accumulatedArguments: accumulatedToolInput,
              is_done: true,
            },
          };
          accumulatedToolInput = '';
          isToolUse = false;
        }
      } else if (event.type === 'message_delta') {
        // Message updates, capture updated usage if available
        if (event.usage) {
          outputTokens = event.usage.output_tokens;
        }
        continue;
      } else if (event.type === 'message_stop') {
        // Final message chunk with usage information
        yield {
          is_final: true,
          finish_reason: 'stop',
          id: undefined,
          usage: {
            inputTokens,
            outputTokens,
          },
        };
      }
      // Log any other event types
      else {
        logger.debug(`Unhandled Anthropic stream event type: ${event}`);
      }
    }
  } catch (error) {
    logger.error('Error processing Anthropic stream:', error);
    throw error;
  }
}
