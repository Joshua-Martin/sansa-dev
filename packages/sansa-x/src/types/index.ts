/**
 * Types for the Sansa-X LLM monitoring package.
 * Handles data communication for LLM API calls to the monitoring service.
 */

/**
 * Supported LLM providers.
 */
export type LLMProvider = 'openai' | 'anthropic' | 'custom';

/**
 * LLM API Call core data. This is data that is required for any LLM API call.
 */
export interface LLMApiCallCoreData {
  /**
   * Unique identifier for this API call. Locked for pre-request and post-response payloads.
   */
  id: string;

  /**
   * Name or identifier for this specific call. Locked for pre-request and post-response payloads.
   */
  name: string;

  /**
   * Version of the prompt being used. This + name become the unique identifier for this type of call.
   */
  promptVersion: string;

  /**
   * The model name (e.g., 'gpt-4', 'claude-3-opus').
   */
  model: string;

  /**
   * The LLM provider.
   */
  provider: LLMProvider;

    /**
   * The user prompt being sent to the LLM.
   */
    userPrompt: string;

    /**
     * The system prompt being used for the LLM.
     */
    systemPrompt: string;
}

/**
 * Request payload sent before the LLM API call is made.
 * Contains the intent and configuration of the upcoming call.
 */
export type PreRequestPayload = LLMApiCallCoreData & {
  /**
   * Timestamp when the request was initiated.
   */
  timestamp: string;
}

/**
 * Request payload sent after the LLM API call returns.
 * Contains the results and token usage from the call.
 */
export type PostResponsePayload = LLMApiCallCoreData & {
  /**
   * Number of input tokens used.
   */
  inputTokenCount: number;

  /**
   * Number of output tokens generated.
   */
  outputTokenCount: number;

  /**
   * The response text from the LLM.
   */
  response?: string;

  /**
   * Timestamp when the response was received.
   */
  timestamp: string;

  /**
   * Duration of the API call in milliseconds.
   */
  durationMs?: number;

  /**
   * Error information if the call failed.
   */
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Configuration for the Sansa-X client.
 */
export interface SansaXConfig {
  /**
   * API key for authenticating with the Sansa service.
   */
  apiKey: string;

  /**
   * Base URL for the Sansa service.
   * @default 'https://api.sansa.example.com'
   */
  baseUrl?: string;

  /**
   * Timeout for HTTP requests in milliseconds.
   * @default 5000
   */
  timeout?: number;

  /**
   * Whether to enable debug logging.
   * @default false
   */
  debug?: boolean;
}
