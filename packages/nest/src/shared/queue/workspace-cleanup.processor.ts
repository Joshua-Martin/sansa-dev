/**
 * Workspace Cleanup Processor
 *
 * Processes Bull queue jobs for workspace cleanup operations.
 * Handles expired session cleanup, aggressive cleanup, and individual session cleanup.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { WorkspaceSessionEntity } from '../database/entities/session.entity';
import { DockerService } from '../services/docker.service';
import {
  WorkspaceCleanupJobData,
  SessionCleanupJobData,
  CleanupJobResult,
  CleanupErrorCode,
} from './queue.types';

/**
 * Processor for workspace cleanup queue jobs
 *
 * Handles different types of cleanup operations with proper error handling and logging.
 */
@Injectable()
@Processor('workspace-cleanup')
export class WorkspaceCleanupProcessor {
  private readonly logger = new Logger(WorkspaceCleanupProcessor.name);

  constructor(
    @InjectRepository(WorkspaceSessionEntity)
    private readonly workspaceRepository: Repository<WorkspaceSessionEntity>,
    private readonly dockerService: DockerService,
  ) {}

  /**
   * Process individual session cleanup jobs
   *
   * Cleans up a specific workspace session.
   */
  @Process('session-cleanup')
  async processSessionCleanup(
    job: Job<SessionCleanupJobData>,
  ): Promise<CleanupJobResult> {
    const startTime = Date.now();
    const result: CleanupJobResult = {
      success: true,
      processedCount: 1,
      cleanedCount: 0,
      cleanedSessionIds: [],
      errors: [],
      completedAt: '',
      duration: 0,
    };

    try {
      const { sessionId, userId, reason } = job.data;

      this.logger.log(
        `Processing session cleanup job ${job.id} for session ${sessionId}, reason: ${reason}`,
      );

      // Find the session
      const session = await this.workspaceRepository.findOne({
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Perform cleanup
      await this.cleanupSession(session, reason);
      result.cleanedCount = 1;
      result.cleanedSessionIds.push(sessionId);

      this.logger.log(`Successfully cleaned up session ${sessionId}`);
    } catch (error) {
      result.success = false;
      result.errors.push({
        sessionId: job.data.sessionId,
        message:
          error instanceof Error
            ? error.message
            : 'Unknown error during session cleanup',
        code: this.getErrorCode(error),
        context: { sessionId: job.data.sessionId, reason: job.data.reason },
      });
      this.logger.error(`Session cleanup job ${job.id} failed:`, error);
    }

    result.completedAt = new Date().toISOString();
    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Handle job failures
   *
   * Logs job failures and can implement retry logic or notifications.
   */
  @OnQueueFailed()
  async onQueueFailed(
    job: Job<WorkspaceCleanupJobData>,
    err: Error,
  ): Promise<void> {
    this.logger.error(
      `Job ${job.id} (${job.name}) failed after ${job.attemptsMade} attempts:`,
      err,
    );

    // Could implement additional error handling here:
    // - Send notifications
    // - Log to external monitoring
    // - Trigger alerts for critical failures
  }

  /**
   * Cleanup a workspace session
   *
   * Performs the actual cleanup operations for a session.
   */
  private async cleanupSession(
    session: WorkspaceSessionEntity,
    reason: SessionCleanupJobData['reason'],
  ): Promise<void> {
    this.logger.log(`Cleaning up session ${session.id} (${reason})`);

    // Stop and remove container if it exists
    if (session.containerId) {
      try {
        await this.dockerService.stopContainer(session.containerId);
        this.logger.debug(`Stopped container ${session.containerId}`);
      } catch (error) {
        this.logger.warn(
          `Failed to stop container ${session.containerId}:`,
          error,
        );
        // Continue with removal even if stop fails
      }

      try {
        await this.dockerService.removeContainer(session.containerId);
        this.logger.debug(`Removed container ${session.containerId}`);
      } catch (error) {
        this.logger.error(
          `Failed to remove container ${session.containerId}:`,
          error,
        );
        throw error; // Container removal failure is critical
      }
    }

    // Update session status
    session.status = 'stopped';
    await this.workspaceRepository.save(session);

    this.logger.log(`Successfully cleaned up session ${session.id}`);
  }

  /**
   * Get appropriate error code based on error type
   */
  private getErrorCode(error: unknown): CleanupErrorCode {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('not found')) {
        return 'SESSION_NOT_FOUND';
      }
      if (message.includes('docker') || message.includes('container')) {
        return 'CONTAINER_REMOVE_FAILED';
      }
      if (message.includes('permission') || message.includes('access')) {
        return 'PERMISSION_DENIED';
      }
      if (message.includes('timeout')) {
        return 'TIMEOUT_ERROR';
      }
    }
    return 'DATABASE_UPDATE_FAILED';
  }
}
