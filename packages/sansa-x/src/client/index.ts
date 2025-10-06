/**
 * HTTP client for communicating with the Sansa monitoring service.
 */

import type {
  SansaXConfig,
  PreRequestPayload,
  PostResponsePayload,
} from '../types/index.js';

/**
 * Client for sending LLM API call data to the Sansa monitoring service.
 * Handles pre-request and post-response tracking with correlation.
 */
export class SansaXClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly debug: boolean;

  /**
   * Creates a new SansaXClient instance.
   *
   * @param config - Configuration for the client including API key and optional settings.
   */
  constructor(config: SansaXConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'http://localhost:3000/api/v1';
    this.timeout = config.timeout ?? 5000;
    this.debug = config.debug ?? false;
  }

  /**
   * Sends pre-request data to the monitoring service.
   * Call this before making the actual LLM API call.
   *
   * @param payload - The pre-request payload containing call intent and configuration.
   * @returns A promise that resolves when the data is sent.
   */
  async sendPreRequest(payload: PreRequestPayload): Promise<void> {
    if (this.debug) {
      console.log('[SansaX] Sending pre-request:', payload);
    }

    try {
      const response = await this.makeRequest('/api/llm/pre-request', payload);

      if (this.debug) {
        console.log('[SansaX] Pre-request sent successfully:', response);
      }
    } catch (error) {
      this.handleError('Failed to send pre-request', error);
    }
  }

  /**
   * Sends post-response data to the monitoring service.
   * Call this after receiving the LLM API response.
   *
   * @param payload - The post-response payload containing results and token usage.
   * @returns A promise that resolves when the data is sent.
   */
  async sendPostResponse(payload: PostResponsePayload): Promise<void> {
    if (this.debug) {
      console.log('[SansaX] Sending post-response:', payload);
    }

    try {
      const response = await this.makeRequest(
        '/api/llm/post-response',
        payload
      );

      if (this.debug) {
        console.log('[SansaX] Post-response sent successfully:', response);
      }
    } catch (error) {
      this.handleError('Failed to send post-response', error);
    }
  }

  /**
   * Makes an HTTP request to the Sansa service.
   *
   * @param endpoint - The API endpoint path.
   * @param payload - The payload to send.
   * @returns The response data.
   */
  private async makeRequest(
    endpoint: string,
    payload: PreRequestPayload | PostResponsePayload
  ): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Handles errors from API calls.
   * Logs errors in debug mode and suppresses them in production to prevent disruption.
   *
   * @param message - The error message context.
   * @param error - The error that occurred.
   */
  private handleError(message: string, error: unknown): void {
    if (this.debug) {
      console.error(`[SansaX] ${message}:`, error);
    }
    // In production, we silently fail to avoid disrupting the main application
    // The monitoring service should be non-blocking
  }
}

/**
 * Generates a unique identifier for correlating pre-request and post-response data.
 *
 * @returns A unique string identifier.
 */
export function generateCallId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Gets the current timestamp in ISO 8601 format.
 *
 * @returns ISO 8601 timestamp string.
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}
