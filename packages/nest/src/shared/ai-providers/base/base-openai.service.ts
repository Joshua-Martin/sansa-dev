import OpenAI from 'openai';
import { ResponseCreateParamsWithTools } from 'openai/lib/ResponsesParser';
import {
  ResponseCreateParamsNonStreaming,
  ResponseCreateParamsStreaming,
} from 'openai/resources/responses/responses';
import { config } from '../../utils/config';
import { Logger } from '../../utils/logger';
import {
  DEFAULT_MODEL,
  MODEL_TOKEN_LIMITS,
} from '../constants/openai.constants';
import {
  ResponseChunk,
  ResponseRequest,
  ResponseResponse,
} from '../types/openai.types';

/**
 * Base service for OpenAI interactions
 *
 * This service provides foundational OpenAI integration functionality that can be extended
 * by other services. It handles:
 * - OpenAI client initialization
 * - Basic error handling and logging
 * - Responses API for text generation with streaming support
 * - Function calling through tools
 *
 * The service supports multiple OpenAI models and provides default configurations
 * while allowing overrides for specific use cases.
 */
export class BaseLLMService {
  /**
   * OpenAI client instance
   * @protected
   */
  protected readonly openai: OpenAI;

  /**
   * Logger instance for the service
   * @protected
   */
  protected readonly logger: Logger;

  /**
   * Creates an instance of BaseLLMService.
   * Initializes the OpenAI client with API key from configuration.
   *
   * @throws {Error} If OPENAI_API_KEY is not configured
   */
  constructor() {
    this.logger = new Logger(BaseLLMService.name);

    try {
      const apiKey = config.getRequired<string>('OPENAI_API_KEY');
      this.openai = new OpenAI({ apiKey });
    } catch (error) {
      this.logger.error('Error in OpenAI client initialization:', error);
      throw error;
    }
  }

  /**
   * Creates a response using OpenAI's Responses API
   *
   * This method handles interaction with OpenAI's Responses API and supports:
   * - Text completion with optional streaming
   * - Function calling through tools
   * - Maintaining conversation context with previous response IDs
   * - Configurable parameters like temperature and token limits
   * - Image input via content arrays (input_text/input_image)
   *
   * @param {ResponseRequest} request - The response request parameters (input can be string, message array, or content array for images)
   * @returns {Promise<ResponseResponse | AsyncIterable<ResponseChunk>>} A promise containing the AI response or a stream
   * @throws {Error} If the API call fails or response processing encounters an error
   */
  public async createResponse(
    request: ResponseRequest,
  ): Promise<ResponseResponse | AsyncIterable<ResponseChunk>> {
    try {
      const model = request.model ?? DEFAULT_MODEL;
      const isStreaming = request.stream === true;

      this.logger.debug(
        `Creating response with model: ${model}, streaming: ${isStreaming}`,
      );

      // Transform our internal request into SDK-compatible parameters
      const responseParams: ResponseCreateParamsWithTools = {
        model,
        input: request.input,
        instructions: request.instructions,
        stream: isStreaming,
        tools: request.tools,
        previous_response_id: request.previousResponseId,
        temperature: request.temperature ?? 0.3,
        max_output_tokens: request.maxTokens ?? MODEL_TOKEN_LIMITS[model],
        tool_choice: request.toolChoice
          ? request.toolChoice
          : request.tools?.length
            ? ('auto' as const)
            : undefined,
      };

      const responseParamsStreaming: ResponseCreateParamsStreaming = {
        ...responseParams,
        stream: true,
      };

      const responseParamsNonStreaming: ResponseCreateParamsNonStreaming = {
        ...responseParams,
        stream: false,
      };

      if (responseParams.temperature) {
        this.logger.debug(
          `Temperature set to ${responseParams.temperature} for model ${model}`,
        );
      }

      // Handle streaming vs non-streaming responses
      if (isStreaming) {
        // When streaming, create and return an async generator that processes the events
        const stream = await this.openai.responses.create(
          responseParamsStreaming,
        );

        this.logger.debug('Response stream started');

        // Return an async generator that processes the stream events
        return this.processStreamEvents(stream);
      } else {
        // Non-streaming response
        const response = await this.openai.responses.create(
          responseParamsNonStreaming,
        );

        this.logger.debug('Response received', { responseId: response.id });

        // Convert to our type format
        return {
          output_text: response.output_text,
          finish_reason: response.incomplete_details
            ? response.incomplete_details.reason || 'unknown'
            : 'stop',
          id: response.id,
          tool_calls: this.extractToolCalls(response),
        };
      }
    } catch (error) {
      this.logger.error('Error in response creation:', error);
      throw error;
    }
  }

  /**
   * Processes OpenAI response stream events into our internal ResponseChunk format
   *
   * @private
   * @param stream - The OpenAI response event stream
   * @returns An async generator yielding ResponseChunk objects
   */
  private async *processStreamEvents(
    stream: AsyncIterable<OpenAI.Responses.ResponseStreamEvent>,
  ): AsyncGenerator<ResponseChunk> {
    try {
      for await (const event of stream) {
        // Handle text delta events
        if (event.type === 'response.output_text.delta') {
          yield {
            text: event.delta,
          };
        }
        // Handle function call argument delta events
        else if (event.type === 'response.function_call_arguments.delta') {
          yield {
            tool_call: {
              id: event.item_id,
              type: 'function',
              function: {
                name: '', // Name is not available in delta events
                arguments: event.delta,
              },
            },
          };
        }
        // Handle function call arguments done events
        else if (event.type === 'response.function_call_arguments.done') {
          yield {
            tool_call: {
              id: event.item_id,
              type: 'function',
              function: {
                name: '', // Name is not available in done events
                arguments: event.arguments,
              },
            },
            is_function_done: true,
          };
        }
        // Handle completion event
        else if (event.type === 'response.completed') {
          yield {
            is_final: true,
            finish_reason: this.determineFinishReason(event.response),
            id: event.response.id,
          };
        }
      }
    } catch (error) {
      this.logger.error('Error processing response stream:', error);
      throw error;
    }
  }

  /**
   * Extract tool calls from an OpenAI response
   *
   * @private
   * @param response - The OpenAI response
   * @returns Array of tool calls, or undefined if none
   */
  private extractToolCalls(
    response: OpenAI.Responses.Response,
  ): ResponseResponse['tool_calls'] {
    // Extract tool calls from function calls in the output
    const functionCalls = response.output?.filter(
      (item): item is OpenAI.Responses.ResponseFunctionToolCall =>
        'type' in item && item.type === 'function_call',
    );

    if (!functionCalls?.length) {
      return undefined;
    }

    return functionCalls.map((call) => ({
      id: call.id || call.call_id,
      type: 'function',
      function: {
        name: call.name,
        arguments: call.arguments,
      },
    }));
  }

  /**
   * Determine the finish reason from an OpenAI response
   *
   * @private
   * @param response - The OpenAI response
   * @returns The finish reason
   */
  private determineFinishReason(response: OpenAI.Responses.Response): string {
    if (response.incomplete_details?.reason) {
      return response.incomplete_details.reason;
    }

    if (response.error) {
      return 'error';
    }

    return 'stop';
  }
}
