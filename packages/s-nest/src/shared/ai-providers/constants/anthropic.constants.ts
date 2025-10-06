export enum AnthropicModel {
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-20241022',
  CLAUDE_3_7_SONNET = 'claude-3-7-sonnet-20250219',
}

export const DEFAULT_MODEL = AnthropicModel.CLAUDE_3_5_SONNET;

// models output token limits
export const MODEL_TOKEN_LIMITS: Record<AnthropicModel, number> = {
  [AnthropicModel.CLAUDE_3_5_SONNET]: 8192,
  [AnthropicModel.CLAUDE_3_7_SONNET]: 8192,
};
