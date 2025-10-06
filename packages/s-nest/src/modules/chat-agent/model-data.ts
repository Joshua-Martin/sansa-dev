/**
 * Chat Agent Model Data
 *
 * Contains cost and configuration data for all supported AI models.
 * Used by the chat service to calculate token costs and total message costs.
 */

import { AIModel, AIProvider } from '@sansa-dev/s-shared';
import { AnthropicModel } from '../../shared/ai-providers/constants/anthropic.constants';
import { OpenAIModel } from '../../shared/ai-providers/constants/openai.constants';

/**
 * Model data registry containing cost information for all supported AI models
 */
export const MODEL_DATA: Record<string, AIModel> = {
  // OpenAI Models
  [OpenAIModel.GPT_4O]: {
    provider: AIProvider.OPEN_AI,
    model: OpenAIModel.GPT_4O,
    inputTokenCostPerMillion: 2.5, // $2.50 per million input tokens
    outputTokenCostPerMillion: 10.0, // $10.00 per million output tokens
  },
  [OpenAIModel.GPT_4O_MINI]: {
    provider: AIProvider.OPEN_AI,
    model: OpenAIModel.GPT_4O_MINI,
    inputTokenCostPerMillion: 0.15, // $0.15 per million input tokens
    outputTokenCostPerMillion: 0.6, // $0.60 per million output tokens
  },
  [OpenAIModel.O1_MINI]: {
    provider: AIProvider.OPEN_AI,
    model: OpenAIModel.O1_MINI,
    inputTokenCostPerMillion: 3.0, // $3.00 per million input tokens
    outputTokenCostPerMillion: 12.0, // $12.00 per million output tokens
  },
  [OpenAIModel.O1]: {
    provider: AIProvider.OPEN_AI,
    model: OpenAIModel.O1,
    inputTokenCostPerMillion: 15.0, // $15.00 per million input tokens
    outputTokenCostPerMillion: 60.0, // $60.00 per million output tokens
  },
  [OpenAIModel.O3_MINI]: {
    provider: AIProvider.OPEN_AI,
    model: OpenAIModel.O3_MINI,
    inputTokenCostPerMillion: 1.1, // $1.10 per million input tokens
    outputTokenCostPerMillion: 4.4, // $4.40 per million output tokens
  },
  [OpenAIModel.GPT_4_1_MINI]: {
    provider: AIProvider.OPEN_AI,
    model: OpenAIModel.GPT_4_1_MINI,
    inputTokenCostPerMillion: 0.13, // $0.13 per million input tokens
    outputTokenCostPerMillion: 0.52, // $0.52 per million output tokens
  },

  // Anthropic Models
  [AnthropicModel.CLAUDE_3_5_SONNET]: {
    provider: AIProvider.ANTHROPIC,
    model: AnthropicModel.CLAUDE_3_5_SONNET,
    inputTokenCostPerMillion: 3.0, // $3.00 per million input tokens
    outputTokenCostPerMillion: 15.0, // $15.00 per million output tokens
  },
  [AnthropicModel.CLAUDE_3_7_SONNET]: {
    provider: AIProvider.ANTHROPIC,
    model: AnthropicModel.CLAUDE_3_7_SONNET,
    inputTokenCostPerMillion: 3.0, // $3.00 per million input tokens
    outputTokenCostPerMillion: 15.0, // $15.00 per million output tokens
  },
};

/**
 * Helper function to get model data by model name
 * @param model - The model identifier
 * @returns The model data or undefined if not found
 */
export function getModelData(model: string): AIModel | undefined {
  return MODEL_DATA[model];
}
