import { Injectable, Logger } from '@nestjs/common';
import { LLMApiCallRecordService } from '../../shared/database/services/llm-api-call-record.service';
import {
  PreRequestPayload,
  PostResponsePayload,
  CreateLLMApiCallRecordInput,
} from '@sansa-dev/s-shared';

/**
 * Service for handling Sansa-X data ingestion and processing
 *
 * Manages the correlation of pre-request and post-response payloads
 * and stores complete API call records for monitoring and analytics.
 */
@Injectable()
export class SansaXService {
  private readonly logger = new Logger(SansaXService.name);

  // In-memory storage for pre-request data (in production, use Redis/cache)
  private readonly preRequestStore = new Map<string, PreRequestPayload>();

  constructor(private readonly recordService: LLMApiCallRecordService) {}

  /**
   * Handle incoming pre-request payload
   *
   * Stores the pre-request data temporarily until the corresponding
   * post-response arrives, then creates a complete record.
   *
   * @param payload - Pre-request payload from Sansa-X client
   * @param appId - Application ID from authenticated API key
   */
  async handlePreRequest(
    payload: PreRequestPayload,
    appId: string,
  ): Promise<void> {
    this.logger.debug(
      `Received pre-request: id=${payload.id}, appId=${appId}, model=${payload.model}`,
    );

    // Store pre-request data with appId context
    this.preRequestStore.set(payload.id, {
      ...payload,
      // Store appId with the payload for correlation
      appId,
    } as PreRequestPayload & { appId: string });

    // In a production system, you might want to:
    // 1. Set a TTL on the stored data
    // 2. Use Redis instead of in-memory storage
    // 3. Implement cleanup of expired pre-requests
  }

  /**
   * Handle incoming post-response payload
   *
   * Correlates with the stored pre-request data and creates
   * a complete API call record for storage.
   *
   * @param payload - Post-response payload from Sansa-X client
   * @param appId - Application ID from authenticated API key
   */
  async handlePostResponse(
    payload: PostResponsePayload,
    appId: string,
  ): Promise<void> {
    this.logger.debug(
      `Received post-response: id=${payload.id}, appId=${appId}, model=${payload.model}, success=${!payload.error}`,
    );

    // Retrieve the corresponding pre-request
    const preRequest = this.preRequestStore.get(payload.id) as
      | (PreRequestPayload & { appId: string })
      | undefined;

    if (!preRequest) {
      this.logger.warn(
        `No matching pre-request found for id: ${payload.id}. This may indicate a configuration issue or orphaned post-response.`,
      );
      // In production, you might want to store orphaned post-responses
      // or implement a retry mechanism
      return;
    }

    // Verify appId consistency
    if (preRequest.appId !== appId) {
      this.logger.error(
        `AppId mismatch: pre-request appId=${preRequest.appId}, post-response appId=${appId}, id=${payload.id}`,
      );
      // Remove the stored pre-request to prevent future issues
      this.preRequestStore.delete(payload.id);
      return;
    }

    try {
      // Create the complete record
      const recordInput: CreateLLMApiCallRecordInput = {
        appId,
        preRequest,
        postResponse: payload,
      };

      await this.recordService.createRecord(recordInput);

      this.logger.debug(
        `Successfully created API call record: id=${payload.id}, appId=${appId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to create API call record: id=${payload.id}, error=${errorMessage}`,
        errorStack,
      );
      // In production, you might want to implement retry logic or dead letter queues
    } finally {
      // Clean up the stored pre-request
      this.preRequestStore.delete(payload.id);
    }
  }

  /**
   * Get current pre-request count (for monitoring/debugging)
   */
  getPendingPreRequestCount(): number {
    return this.preRequestStore.size;
  }

  /**
   * Clean up expired pre-requests (should be called periodically)
   *
   * @param maxAgeMs - Maximum age in milliseconds (default: 5 minutes)
   */
  cleanupExpiredPreRequests(maxAgeMs: number = 5 * 60 * 1000): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [id, payload] of this.preRequestStore.entries()) {
      const age = now - new Date(payload.timestamp).getTime();
      if (age > maxAgeMs) {
        this.preRequestStore.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} expired pre-requests`);
    }

    return cleanedCount;
  }
}
