import Anthropic from '@anthropic-ai/sdk';
import { Message } from '@anthropic-ai/sdk/resources';
import { config } from '../../utils/config';
import { Logger } from '../../utils/logger';
import {
  DEFAULT_MODEL,
  MODEL_TOKEN_LIMITS,
} from '../constants/anthropic.constants';
import { AnthropicCompletionRequest } from '../types/anthropic.types';

/**
 * Base service for Anthropic AI interactions
 */
export class BaseAnthropicService {
  /**
   * Anthropic client instance
   */
  protected readonly anthropic: Anthropic;

  /**
   * Logger instance for the service
   */
  protected readonly logger: Logger;

  /**
   * Creates an instance of BaseAnthropicService.
   * Initializes the Anthropic client with API key from configuration.
   *
   * @throws {Error} If ANTHROPIC_API_KEY is not configured
   */
  constructor() {
    this.logger = new Logger(BaseAnthropicService.name);

    try {
      const apiKey = config.getRequired<string>('ANTHROPIC_API_KEY');
      this.anthropic = new Anthropic({
        apiKey,
        // Set a longer timeout for streaming requests
        timeout: 60000,
      });
    } catch (error) {
      this.logger.error('Error in Anthropic client initialization:', error);
      throw error;
    }
  }

  /**
   * Creates a chat completion using Anthropic's API
   *
   * @param {AnthropicCompletionRequest} request - The request parameters
   * @returns {Promise<Message>} Anthropic message response
   */
  public async createChatCompletion(
    request: AnthropicCompletionRequest,
  ): Promise<Message> {
    try {
      this.logger.debug(
        `Creating chat completion with model: ${request.model} and max tokens: ${request.maxTokens}`,
      );
      const model = request.model ?? DEFAULT_MODEL;

      // Convert messages to Anthropic format
      const messages: Anthropic.MessageParam[] = [];

      // Add previous messages if they exist
      if (request.messages?.length) {
        messages.push(...request.messages);
      }

      // Add the new user message
      messages.push({
        role: 'user',
        content: request.userMessage,
      });

      // Prepare completion parameters
      const completionParams: Anthropic.Messages.MessageCreateParams = {
        model,
        messages,
        max_tokens: request.maxTokens ?? MODEL_TOKEN_LIMITS[model],
        temperature: request.temperature ?? 0.3,
      };

      // Add system message if provided
      if (request.system) {
        completionParams.system = request.system;
      }

      // Add tools if provided
      if (request.tools && request.tools.length > 0) {
        completionParams.tools = request.tools;

        // Handle tool choice based on scenario
        if (request.toolChoice) {
          completionParams.tool_choice = request.toolChoice;
        } else if (request.tools.length === 1) {
          // Default to requiring the specific tool when only one is provided
          completionParams.tool_choice = {
            type: 'tool',
            name: request.tools[0].name,
          };
        } else {
          // Default to any tool when multiple tools are provided
          completionParams.tool_choice = {
            type: 'any',
          };
        }
      }

      const response = await this.anthropic.messages.create(completionParams);
      return response;
    } catch (error) {
      this.logger.error('Error in chat completion:', error);
      throw error;
    }
  }

  /**
   * Creates a streaming chat completion using Anthropic's API
   *
   * @param {AnthropicCompletionRequest} request - The request parameters
   * @returns {Promise<AsyncIterable<Anthropic.Messages.MessageStreamEvent>>} Streaming events from Anthropic
   */
  public async createStreamingChatCompletion(
    request: AnthropicCompletionRequest,
  ): Promise<AsyncIterable<Anthropic.Messages.MessageStreamEvent>> {
    try {
      this.logger.debug(
        `Creating streaming chat completion with model: ${request.model ?? DEFAULT_MODEL}`,
      );
      const model = request.model ?? DEFAULT_MODEL;

      // Convert messages to Anthropic format
      const messages: Anthropic.MessageParam[] = [];

      // Add previous messages if they exist
      if (request.messages?.length) {
        messages.push(...request.messages);
      }

      // Add the new user message
      messages.push({
        role: 'user',
        content: request.userMessage,
      });

      // Prepare streaming parameters - use all request properties but ensure stream is true
      const streamingParams: Anthropic.Messages.MessageStreamParams = {
        model,
        messages,
        max_tokens: request.maxTokens ?? MODEL_TOKEN_LIMITS[model],
        temperature: request.temperature ?? 0.3,
        stream: true,
      };

      // Add system message if provided
      if (request.system) {
        streamingParams.system = request.system;
      }

      // Add tools if provided
      if (request.tools && request.tools.length > 0) {
        streamingParams.tools = request.tools;

        // Handle tool choice based on scenario
        if (request.toolChoice) {
          streamingParams.tool_choice = request.toolChoice;
        } else if (request.tools.length === 1) {
          // Default to requiring the specific tool when only one is provided
          streamingParams.tool_choice = {
            type: 'tool',
            name: request.tools[0].name,
          };
        } else {
          // Default to any tool when multiple tools are provided
          streamingParams.tool_choice = {
            type: 'any',
          };
        }
      }

      // Call the Anthropic messages stream API and return the stream
      return this.anthropic.messages.stream(streamingParams);
    } catch (error) {
      this.logger.error('Error in streaming chat completion:', error);
      throw error;
    }
  }
}
