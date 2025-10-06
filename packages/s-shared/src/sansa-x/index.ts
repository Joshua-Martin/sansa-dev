/**
 * Sansa-X integration types for database storage and tracking.
 *
 * This module extends the core Sansa-X types with application-specific
 * fields needed for persistence and correlation with applications.
 */

import type {
  PreRequestPayload,
  PostResponsePayload,
} from '@sansa-dev/sansa-x';

/**
 * Complete LLM API call record for database storage.
 *
 * Extends the core Sansa-X types with application-specific fields
 * for persistence and multi-tenant tracking. This type automatically
 * stays in sync with changes to the core Sansa-X types.
 */
export type LLMApiCallRecord = {
  /**
   * Unique identifier for this API call (from Sansa-X).
   * Correlates pre-request and post-response data.
   */
  id: string;

  /**
   * The ID of the application that made this LLM call.
   * Used for multi-tenant tracking and analytics.
   */
  appId: string;
} & Omit<PreRequestPayload, 'id' | 'timestamp'> &
  Omit<PostResponsePayload, 'timestamp'> & {
    /**
     * Timestamp when the request was initiated (ISO 8601).
     * Renamed from 'timestamp' in PreRequestPayload for clarity.
     */
    requestTimestamp: string;

    /**
     * Timestamp when the response was received (ISO 8601).
     * From PostResponsePayload.timestamp.
     */
    responseTimestamp: string;

    /**
     * Timestamp when this record was created in our database.
     */
    createdAt?: Date;

    /**
     * Timestamp when this record was last updated.
     */
    updatedAt?: Date;
  };

/**
 * Input data for creating a complete LLM API call record.
 *
 * Combines pre-request and post-response payloads with app context
 * to create a full database record.
 */
export interface CreateLLMApiCallRecordInput {
  /**
   * The ID of the application making this call.
   */
  appId: string;

  /**
   * Pre-request data (sent before the LLM call).
   */
  preRequest: PreRequestPayload;

  /**
   * Post-response data (sent after the LLM call).
   */
  postResponse: PostResponsePayload;
}

/**
 * Converts Sansa-X payloads into a complete database record.
 *
 * Merges pre-request and post-response data with application context
 * to create a unified record ready for database persistence.
 *
 * @param input - The input containing app ID and Sansa-X payloads.
 * @returns A complete LLM API call record.
 */
export function createLLMApiCallRecord(
  input: CreateLLMApiCallRecordInput
): Omit<LLMApiCallRecord, 'createdAt' | 'updatedAt'> {
  const { appId, preRequest, postResponse } = input;

  return {
    id: postResponse.id,
    appId,
    name: postResponse.name,
    userPrompt: preRequest.userPrompt,
    systemPrompt: preRequest.systemPrompt,
    promptVersion: preRequest.promptVersion,
    model: postResponse.model,
    provider: postResponse.provider,
    inputTokenCount: postResponse.inputTokenCount,
    outputTokenCount: postResponse.outputTokenCount,
    response: postResponse.response,
    requestTimestamp: preRequest.timestamp,
    responseTimestamp: postResponse.timestamp,
    durationMs: postResponse.durationMs,
    error: postResponse.error,
  };
}

/**
 * Statistics for LLM API usage by application.
 */
export interface LLMApiCallStats {
  /**
   * The application ID.
   */
  appId: string;

  /**
   * Total number of API calls made.
   */
  totalCalls: number;

  /**
   * Total input tokens used across all calls.
   */
  totalInputTokens: number;

  /**
   * Total output tokens generated across all calls.
   */
  totalOutputTokens: number;

  /**
   * Total tokens (input + output).
   */
  totalTokens: number;

  /**
   * Number of successful calls.
   */
  successfulCalls: number;

  /**
   * Number of failed calls.
   */
  failedCalls: number;

  /**
   * Average duration in milliseconds.
   */
  averageDurationMs?: number;
}

// Re-export core Sansa-X types for convenience
export type {
  LLMProvider,
  LLMApiCallCoreData,
  PreRequestPayload,
  PostResponsePayload,
  SansaXConfig,
} from '@sansa-dev/sansa-x';

export { SansaXClient, generateCallId, getTimestamp } from '@sansa-dev/sansa-x';
