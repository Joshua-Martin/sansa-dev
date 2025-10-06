import Anthropic from '@anthropic-ai/sdk';
import { Message } from '@anthropic-ai/sdk/resources';
import { Logger } from '../../utils/logger';
import { BaseAnthropicService } from '../base/base-anthropic.service';
import { BaseLLMService } from '../base/base-openai.service';
import { OpenAIModel } from '../constants/openai.constants';
import { ResponseChunk, ResponseResponse } from '../types/openai.types';

// Import utility functions and types
import {
  AnthropicUnifiedRequest,
  createAnthropicCompletionRequest,
  createOpenAIResponseRequest,
  LLMProvider,
  OpenAIUnifiedRequest,
  parseAnthropicResponse,
  parseOpenAIResponseApiResponse,
  processAnthropicStream,
  processOpenAIStream,
  UnifiedLLMResponse,
  UnifiedMessage,
  UnifiedStreamChunk,
  UnifiedTool,
  UnifiedToolCall,
  UnifiedToolChoice,
} from '../utils';

/**
 * Unified LLM request type that can be any of the provider-specific requests
 */
export type UnifiedLLMRequest = OpenAIUnifiedRequest | AnthropicUnifiedRequest;

/**
 * Re-export common types for convenience
 */
export type {
  LLMProvider,
  UnifiedLLMResponse,
  UnifiedMessage,
  UnifiedStreamChunk,
  UnifiedTool,
  UnifiedToolCall,
  UnifiedToolChoice,
  OpenAIUnifiedRequest,
  AnthropicUnifiedRequest,
};

/**
 * Unified service for handling OpenAI and Anthropic LLM requests
 *
 * This refactored service uses extracted utility functions to handle provider-specific
 * conversions and processing. It maintains strict type safety while keeping the core
 * logic clean and focused on orchestration.
 */
export class UnifiedLLMService {
  private readonly logger: Logger;
  private readonly openaiService: BaseLLMService;
  private readonly anthropicService: BaseAnthropicService;

  /**
   * Creates an instance of UnifiedLLMService
   */
  constructor() {
    this.logger = new Logger(UnifiedLLMService.name);
    this.openaiService = new BaseLLMService();
    this.anthropicService = new BaseAnthropicService();
  }

  /**
   * Creates a completion using OpenAI or Anthropic based on the provider parameter
   *
   * @param {UnifiedLLMRequest} request - The unified request parameters with provider-specific typing
   * @returns {Promise<UnifiedLLMResponse | AsyncIterable<UnifiedStreamChunk>>} The response from the selected provider
   * @throws {Error} If an invalid provider is specified or if the request fails
   */
  async createCompletion(
    request: UnifiedLLMRequest,
  ): Promise<UnifiedLLMResponse | AsyncIterable<UnifiedStreamChunk>> {
    try {
      // Validate image requests: only OpenAI supports images
      if (
        ('isImage' in request && request.isImage) ||
        ('images' in request && request.images && request.images.length > 0)
      ) {
        if (request.provider !== 'openai') {
          throw new Error(
            'Image requests are only supported for OpenAI provider',
          );
        }
        // Always use GPT_4_1_MINI for image requests
        request.model = OpenAIModel.GPT_4_1_MINI;
      }

      // Type guard to check if isSearch exists (OpenAI only)
      if (
        'isSearch' in request &&
        request.isSearch &&
        request.provider !== 'openai'
      ) {
        throw new Error('Search is only supported for OpenAI');
      }

      // Handle streaming requests differently
      if (request.stream) {
        return await this.createStreamingCompletion(request);
      }

      if (request.provider === 'openai') {
        const response = await this.handleOpenAIResponseRequest(request);
        return parseOpenAIResponseApiResponse(response);
      } else if (request.provider === 'anthropic') {
        const response = await this.handleAnthropicRequest(request);
        return parseAnthropicResponse(response);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error(`Unsupported provider: ${(request as any).provider}`);
      }
    } catch (error) {
      this.logger.error(`Error in ${request.provider} completion:`, error);
      throw error;
    }
  }

  /**
   * Creates a streaming completion using OpenAI or Anthropic
   *
   * @param {UnifiedLLMRequest} request - The unified request parameters
   * @returns {Promise<AsyncIterable<UnifiedStreamChunk>>} A stream of response chunks
   */
  private async createStreamingCompletion(
    request: UnifiedLLMRequest,
  ): Promise<AsyncIterable<UnifiedStreamChunk>> {
    try {
      if (request.provider === 'openai') {
        const stream = await this.handleOpenAIStreamingRequest(request);
        return processOpenAIStream(stream);
      } else if (request.provider === 'anthropic') {
        const stream = await this.handleAnthropicStreamingRequest(request);
        return processAnthropicStream(stream);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error(
          `Unsupported provider for streaming: ${(request as any).provider}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error in ${request.provider} streaming completion:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Handles Anthropic-specific request processing
   *
   * @private
   * @param {AnthropicUnifiedRequest} request - The Anthropic-specific request
   * @returns {Promise<Message>} The response from Anthropic
   */
  private async handleAnthropicRequest(
    request: AnthropicUnifiedRequest,
  ): Promise<Message> {
    const anthropicRequest = createAnthropicCompletionRequest(request);
    return this.anthropicService.createChatCompletion(anthropicRequest);
  }

  /**
   * Handles OpenAI streaming request
   *
   * @private
   * @param {OpenAIUnifiedRequest} request - The OpenAI request
   * @returns {Promise<AsyncIterable<ResponseChunk>>} The streaming response
   */
  private async handleOpenAIStreamingRequest(
    request: OpenAIUnifiedRequest,
  ): Promise<AsyncIterable<ResponseChunk>> {
    // Format the request for the Responses API streaming
    const responseRequest = createOpenAIResponseRequest(request, true);
    const result = await this.openaiService.createResponse(responseRequest);
    return result as AsyncIterable<ResponseChunk>;
  }

  /**
   * Handles Anthropic streaming request
   *
   * @private
   * @param {AnthropicUnifiedRequest} request - The Anthropic request
   * @returns {Promise<AsyncIterable<Anthropic.Messages.MessageStreamEvent>>} The streaming response
   */
  private async handleAnthropicStreamingRequest(
    request: AnthropicUnifiedRequest,
  ): Promise<AsyncIterable<Anthropic.Messages.MessageStreamEvent>> {
    const anthropicRequest = createAnthropicCompletionRequest(request);
    return this.anthropicService.createStreamingChatCompletion(
      anthropicRequest,
    );
  }

  /**
   * Handles OpenAI Responses API request processing
   *
   * @private
   * @param {OpenAIUnifiedRequest} request - The OpenAI-specific request
   * @returns {Promise<ResponseResponse>} The response from the OpenAI Responses API
   */
  private async handleOpenAIResponseRequest(
    request: OpenAIUnifiedRequest,
  ): Promise<ResponseResponse> {
    const responseRequest = createOpenAIResponseRequest(request, false);
    return this.openaiService.createResponse(
      responseRequest,
    ) as Promise<ResponseResponse>;
  }
}
