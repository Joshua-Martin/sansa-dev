/**
 * OpenAI-specific utility functions for converting between unified and OpenAI formats
 */

import { Tool } from 'openai/resources/responses/responses';
import { Logger } from '../../utils/logger';
import { OpenAIModel } from '../constants/openai.constants';
import {
  ResponseChunk,
  ResponseContentBlock,
  ResponseMessage,
  ResponseRequest,
  ResponseResponse,
} from '../types/openai.types';
import {
  OpenAIUnifiedRequest,
  UnifiedLLMResponse,
  UnifiedStreamChunk,
  UnifiedTool,
  UnifiedToolChoice,
} from './common.utils';

/**
 * Logger instance for OpenAI utilities
 */
const logger = new Logger('OpenAIUtils');

// Re-export the OpenAI unified request type for convenience
export type { OpenAIUnifiedRequest } from './common.utils';

/**
 * Converts unified tools format to the OpenAI Responses API tool format
 *
 * @param {UnifiedTool[]} tools - Array of unified tool definitions
 * @returns {Tool[]} Tools formatted for the Responses API
 */
export function convertUnifiedToolsToResponseTools(
  tools: UnifiedTool[],
): Tool[] {
  return tools.map((tool) => ({
    type: 'function' as const,
    name: tool.function.name,
    description: tool.function.description,
    parameters: tool.function.parameters,
    strict: true,
  }));
}

/**
 * Converts unified tool choice format to OpenAI Responses API format
 *
 * @param {UnifiedToolChoice} toolChoice - The unified tool choice
 * @returns {ResponseRequest['toolChoice']} Tool choice formatted for OpenAI
 */
export function convertToolChoiceToOpenAI(
  toolChoice?: UnifiedToolChoice,
):
  | 'auto'
  | 'none'
  | 'required'
  | { type: 'function'; name: string }
  | undefined {
  if (!toolChoice) return undefined;

  // Handle string values directly
  if (
    typeof toolChoice === 'string' &&
    (toolChoice === 'auto' ||
      toolChoice === 'none' ||
      toolChoice === 'required')
  ) {
    return toolChoice;
  }

  // Handle function-specific tool choice - convert from unified format to OpenAI format
  if (typeof toolChoice === 'object' && 'function' in toolChoice) {
    return {
      type: 'function',
      name: toolChoice.function.name,
    };
  }

  return undefined;
}

/**
 * Creates a ResponseRequest object from a unified request
 * Handles image requests by building a content array with input_image objects.
 *
 * @param {OpenAIUnifiedRequest} request - The unified request
 * @param {boolean} streaming - Whether this is a streaming request
 * @returns {ResponseRequest} The formatted request for the Responses API
 */
export function createOpenAIResponseRequest(
  request: OpenAIUnifiedRequest,
  streaming: boolean,
): ResponseRequest {
  // Handle image requests
  if (request.isImage || (request.images && request.images.length > 0)) {
    // Always use GPT_4_1_MINI for image requests
    const model = OpenAIModel.GPT_4_1_MINI;
    // Build content array
    const content: ResponseContentBlock[] = [];
    if (request.message) {
      content.push({ type: 'input_text', text: request.message });
    }
    if (request.messages && request.messages.length > 0) {
      // Only use the first user message as input_text if present
      const userMsg = request.messages.find((m) => m.role === 'user');
      if (userMsg && typeof userMsg.content === 'string') {
        content.push({ type: 'input_text', text: userMsg.content });
      }
    }
    if (request.images) {
      for (const img of request.images) {
        content.push({
          type: 'input_image',
          image_url: img.imageUrl,
          detail: img.detail,
        });
      }
    }
    const input: ResponseMessage[] = [
      {
        role: 'user',
        content,
      },
    ];
    return {
      input,
      instructions: request.systemMessage,
      model,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      tools: request.tools
        ? convertUnifiedToolsToResponseTools(request.tools)
        : undefined,
      toolChoice: convertToolChoiceToOpenAI(request.toolChoice),
      previousResponseId: request.previousResponseId,
      stream: streaming,
    };
  }

  // Format input for Responses API
  let input: string | ResponseMessage[];

  if (request.messages && request.messages.length > 0) {
    // Convert unified messages to Responses API format
    input = request.messages.map((msg) => ({
      role:
        msg.role === 'system'
          ? 'developer'
          : (msg.role as 'user' | 'assistant' | 'developer'),
      content:
        typeof msg.content === 'string'
          ? msg.content
          : Array.isArray(msg.content) && msg.content[0]?.type === 'text'
            ? msg.content[0].text
            : '',
    }));
  } else {
    // Use single message if no message history provided
    input = request.message || '';
  }

  let tools: Tool[] | undefined;
  let toolChoice: ResponseRequest['toolChoice'] = undefined;

  if (request.isSearch) {
    // When search is enabled, include both search tools and any custom tools
    tools = [
      {
        type: 'web_search_preview_2025_03_11',
      },
    ];

    // Add custom tools if provided (these are typically for reporting search results)
    if (request.tools) {
      const customTools = convertUnifiedToolsToResponseTools(request.tools);
      tools.push(...customTools);
    }

    // Convert tool choice format if needed - this will typically be for custom reporting tools
    toolChoice = convertToolChoiceToOpenAI(request.toolChoice);
  } else {
    tools = request.tools
      ? convertUnifiedToolsToResponseTools(request.tools)
      : undefined;
    // Convert tool choice format if needed
    toolChoice = convertToolChoiceToOpenAI(request.toolChoice);
  }

  const responseRequest: ResponseRequest = {
    input,
    instructions: request.systemMessage,
    model: request.model,
    temperature: request.temperature,
    maxTokens: request.maxTokens,
    tools,
    toolChoice,
    previousResponseId: request.previousResponseId,
    stream: streaming,
  };

  return responseRequest;
}

/**
 * Parses OpenAI Responses API response into unified format
 *
 * @param {ResponseResponse} response - The raw response from the Responses API
 * @returns {UnifiedLLMResponse} Response in unified format
 */
export function parseOpenAIResponseApiResponse(
  response: ResponseResponse,
): UnifiedLLMResponse {
  return {
    text: response.output_text || undefined,
    toolCalls: response.tool_calls?.map((call) => ({
      name: call.function.name,
      arguments: JSON.parse(call.function.arguments),
    })),
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
 * Processes an OpenAI response stream into our unified format
 *
 * @param {AsyncIterable<ResponseChunk>} stream - The OpenAI response stream
 * @returns {AsyncGenerator<UnifiedStreamChunk>} An async generator yielding UnifiedStreamChunk objects
 */
export async function* processOpenAIStream(
  stream: AsyncIterable<ResponseChunk>,
): AsyncGenerator<UnifiedStreamChunk> {
  try {
    for await (const chunk of stream) {
      // Text content
      if (chunk.text) {
        yield {
          text: chunk.text,
        };
      }
      // Tool call
      else if (chunk.tool_call) {
        yield {
          toolCall: {
            id: chunk.tool_call.id,
            name: chunk.tool_call.function.name,
            arguments: chunk.tool_call.function.arguments,
            is_done: chunk.is_function_done,
          },
        };
      }
      // Final chunk with finish details
      else if (chunk.is_final) {
        yield {
          is_final: true,
          finish_reason: chunk.finish_reason,
          id: chunk.id,
          usage: chunk.usage
            ? {
                inputTokens: chunk.usage.input_tokens,
                outputTokens: chunk.usage.output_tokens,
              }
            : undefined,
        };
      }
    }
  } catch (error) {
    logger.error('Error processing OpenAI stream:', error);
    throw error;
  }
}
