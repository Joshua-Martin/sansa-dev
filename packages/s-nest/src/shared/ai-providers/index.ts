/**
 * AI Providers module
 *
 * This file exports the AI provider services for use across the application.
 * It replaces the previous NestJS module-based dependency injection approach.
 */

import { BaseAnthropicService } from './base/base-anthropic.service';
import { BaseLLMService } from './base/base-openai.service';
import { UnifiedLLMService } from './unified/unified-llm.service';

// Create and export service instances that can be imported elsewhere
const createUnifiedLLMService = (): UnifiedLLMService => {
  return new UnifiedLLMService();
};

// Export factory functions to create service instances
export {
  createUnifiedLLMService,
  BaseLLMService,
  BaseAnthropicService,
  UnifiedLLMService,
};

// Export types from unified service
export type {
  UnifiedLLMRequest,
  UnifiedStreamChunk,
  UnifiedLLMResponse,
  UnifiedMessage,
  UnifiedTool,
  UnifiedToolCall,
  UnifiedToolChoice,
  OpenAIUnifiedRequest,
  AnthropicUnifiedRequest,
  LLMProvider,
} from './unified/unified-llm.service';

// Export a singleton instance for convenience
export const unifiedLLMService = createUnifiedLLMService();
