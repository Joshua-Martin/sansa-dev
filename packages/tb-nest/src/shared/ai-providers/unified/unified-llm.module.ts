import { Module } from '@nestjs/common';
import { BaseAnthropicService } from '../base/base-anthropic.service';
import { BaseLLMService } from '../base/base-openai.service';
import { UnifiedLLMService } from './unified-llm.service';

/**
 * Unified LLM Module
 *
 * This module provides unified access to multiple LLM providers (OpenAI, Anthropic)
 * through a single service type. It handles provider-specific logic internally
 * while exposing a consistent API for the rest of the application.
 */
@Module({
  providers: [UnifiedLLMService, BaseAnthropicService, BaseLLMService],
  exports: [UnifiedLLMService, BaseAnthropicService, BaseLLMService],
})
export class UnifiedLLMModule {}
