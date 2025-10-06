/**
 * Chat Agent Models
 *
 * Types and enums for managing AI models across different providers.
 */

/**
 * Supported AI providers
 */
export enum AIProvider {
  OPEN_AI = 'openai',
  GROK = 'grok',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
}

/**
 * Configuration for an AI model including cost information
 */
export type AIModel = {
  /**
   * The AI provider for this model
   */
  provider: AIProvider;

  /**
   * The model identifier/name
   */
  model: string;

  /**
   * Cost per million input tokens in USD
   */
  inputTokenCostPerMillion: number;

  /**
   * Cost per million output tokens in USD
   */
  outputTokenCostPerMillion: number;
};
