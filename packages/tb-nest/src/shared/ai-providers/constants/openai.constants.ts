/**
 * Enum of supported OpenAI models for chat completions
 */
export enum OpenAIModel {
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
  O1_MINI = 'o1-mini-2024-09-12',
  O1 = 'o1-2024-12-17',
  O3_MINI = 'o3-mini-2025-01-31',
  GPT_4_1_MINI = 'gpt-4.1-mini',
}

/**
 * Default model to use for chat completions
 */
export const DEFAULT_MODEL = OpenAIModel.GPT_4O_MINI;

/**
 * Default maximum tokens for each model
 * These limits are set below the actual model limits to ensure reliable responses
 */
export const MODEL_TOKEN_LIMITS: Record<OpenAIModel, number> = {
  [OpenAIModel.GPT_4O]: 16000,
  [OpenAIModel.GPT_4O_MINI]: 16000,
  [OpenAIModel.O1_MINI]: 60000,
  [OpenAIModel.O1]: 100000,
  [OpenAIModel.O3_MINI]: 100000,
  [OpenAIModel.GPT_4_1_MINI]: 16000,
};
