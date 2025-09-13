/**
 * Activity-Based Cleanup Processor
 *
 * Processes cleanup jobs based on session activity and connection states.
 * Replaces cron-based cleanup with event-driven cleanup decisions.
 */

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WorkspaceSessionEntity } from '../../../shared/database/entities/session.entity';
import { DockerService } from '../../../shared/services/docker.service';
import { ContainerRegistryService } from '../services/container-registry/container-registry.service';
import { SessionActivityManager } from '../services/session/session-activity-manager.service';
import type {
  CleanupJobResult,
  CleanupError,
  CleanupErrorCode,
} from '../../../shared/queue/queue.types';

/**
 * Reasons for session cleanup
 */
export type CleanupReason =
  | 'disconnected'
  | 'background-timeout'
  | 'health-check-failure'
  | 'manual'
  | 'orphaned';

/**
 * Activity-Based Cleanup Processor
 *
 * Handles cleanup of workspace sessions based on activity levels and connection states.
 * Processes cleanup jobs triggered by various events rather than scheduled cron jobs.
 */
@Injectable()
export class ActivityBasedCleanupProcessor {
  private readonly logger = new Logger(ActivityBasedCleanupProcessor.name);

  constructor(
    @InjectRepository(WorkspaceSessionEntity)
    private readonly workspaceRepository: Repository<WorkspaceSessionEntity>,
    @Inject(forwardRef(() => SessionActivityManager))
    private readonly activityManager: SessionActivityManager,
    @InjectQueue('workspace-cleanup')
    private readonly cleanupQueue: Queue,
    private readonly dockerService: DockerService,
    private readonly containerRegistry: ContainerRegistryService,
  ) {}

  /**
   * Process cleanup for a disconnected session
   */
  async processSessionCleanup(
    sessionId: string,
    reason: CleanupReason,
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
      this.logger.log(
        `Processing cleanup for session ${sessionId}, reason: ${reason}`,
      );

      // Find the session
      const session = await this.workspaceRepository.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        this.logger.warn(`Session ${sessionId} not found for cleanup`);
        result.processedCount = 0;
        return result;
      }

      // Check if cleanup is still appropriate
      const shouldCleanup =
        await this.activityManager.shouldCleanupSession(sessionId);

      if (!shouldCleanup) {
        this.logger.log(
          `Cleanup not appropriate for session ${sessionId} (still active)`,
        );
        result.processedCount = 0;
        return result;
      }

      // Perform cleanup
      await this.cleanupSession(session, reason);
      result.cleanedCount = 1;
      result.cleanedSessionIds.push(sessionId);

      this.logger.log(`Successfully cleaned up session ${sessionId}`);
    } catch (error) {
      result.success = false;
      result.errors.push({
        sessionId,
        message:
          error instanceof Error
            ? error.message
            : 'Unknown error during session cleanup',
        code: this.getErrorCode(error),
        context: { sessionId, reason },
      });
      this.logger.error(`Session cleanup failed for ${sessionId}:`, error);
    }

    result.completedAt = new Date().toISOString();
    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Process cleanup for sessions that failed health checks
   */
  async processHealthCheckCleanup(
    sessionIds: string[],
  ): Promise<CleanupJobResult> {
    const startTime = Date.now();
    const result: CleanupJobResult = {
      success: true,
      processedCount: sessionIds.length,
      cleanedCount: 0,
      cleanedSessionIds: [],
      errors: [],
      completedAt: '',
      duration: 0,
    };

    this.logger.log(
      `Processing health check cleanup for ${sessionIds.length} sessions`,
    );

    for (const sessionId of sessionIds) {
      try {
        const session = await this.workspaceRepository.findOne({
          where: { id: sessionId },
        });

        if (!session) {
          continue;
        }

        // Only cleanup if container exists and health check failed
        if (session.containerId && session.status === 'running') {
          const isHealthy = await this.dockerService.checkContainerHealth(
            session.containerId,
          );

          if (!isHealthy) {
            await this.cleanupSession(session, 'health-check-failure');
            result.cleanedCount++;
            result.cleanedSessionIds.push(sessionId);
          }
        }
      } catch (error) {
        result.errors.push({
          sessionId,
          message:
            error instanceof Error
              ? error.message
              : 'Health check cleanup failed',
          code: 'CONTAINER_REMOVE_FAILED',
          context: { sessionId },
        });
        this.logger.error(
          `Health check cleanup failed for ${sessionId}:`,
          error,
        );
      }
    }

    result.completedAt = new Date().toISOString();
    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Process cleanup for orphaned sessions (no active connections, no recent activity)
   */
  async processOrphanedSessionsCleanup(): Promise<CleanupJobResult> {
    const startTime = Date.now();
    const result: CleanupJobResult = {
      success: true,
      processedCount: 0,
      cleanedCount: 0,
      cleanedSessionIds: [],
      errors: [],
      completedAt: '',
      duration: 0,
    };

    try {
      // Find potentially orphaned sessions
      const cutoffTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

      const orphanedSessions = await this.workspaceRepository
        .createQueryBuilder('session')
        .where('session.activityLevel = :activityLevel', {
          activityLevel: 'disconnected',
        })
        .andWhere('session.lastActivityAt < :cutoffTime', { cutoffTime })
        .andWhere('session.status IN (:...statuses)', {
          statuses: ['running', 'error'],
        })
        .getMany();

      result.processedCount = orphanedSessions.length;
      this.logger.log(
        `Found ${orphanedSessions.length} potentially orphaned sessions`,
      );

      for (const session of orphanedSessions) {
        try {
          // Double-check with activity manager
          const shouldCleanup = await this.activityManager.shouldCleanupSession(
            session.id,
          );

          if (shouldCleanup) {
            await this.cleanupSession(session, 'orphaned');
            result.cleanedCount++;
            result.cleanedSessionIds.push(session.id);
          }
        } catch (error) {
          result.errors.push({
            sessionId: session.id,
            message:
              error instanceof Error
                ? error.message
                : 'Orphaned session cleanup failed',
            code: 'CONTAINER_REMOVE_FAILED',
            context: { sessionId: session.id },
          });
          this.logger.error(
            `Orphaned session cleanup failed for ${session.id}:`,
            error,
          );
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        message:
          error instanceof Error
            ? error.message
            : 'Unknown error during orphaned sessions cleanup',
        code: 'DATABASE_UPDATE_FAILED',
      });
      this.logger.error('Orphaned sessions cleanup failed:', error);
    }

    result.completedAt = new Date().toISOString();
    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Manual cleanup trigger for specific sessions
   */
  async processManualCleanup(
    sessionIds: string[],
    reason: string,
  ): Promise<CleanupJobResult> {
    const startTime = Date.now();
    const result: CleanupJobResult = {
      success: true,
      processedCount: sessionIds.length,
      cleanedCount: 0,
      cleanedSessionIds: [],
      errors: [],
      completedAt: '',
      duration: 0,
    };

    this.logger.log(
      `Processing manual cleanup for ${sessionIds.length} sessions`,
    );

    for (const sessionId of sessionIds) {
      try {
        const session = await this.workspaceRepository.findOne({
          where: { id: sessionId },
        });

        if (!session) {
          result.errors.push({
            sessionId,
            message: 'Session not found',
            code: 'SESSION_NOT_FOUND',
            context: { sessionId },
          });
          continue;
        }

        await this.cleanupSession(session, 'manual');
        result.cleanedCount++;
        result.cleanedSessionIds.push(sessionId);
      } catch (error) {
        result.errors.push({
          sessionId,
          message:
            error instanceof Error ? error.message : 'Manual cleanup failed',
          code: 'CONTAINER_REMOVE_FAILED',
          context: { sessionId },
        });
        this.logger.error(`Manual cleanup failed for ${sessionId}:`, error);
      }
    }

    result.completedAt = new Date().toISOString();
    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Cleanup a workspace session and its resources
   */
  private async cleanupSession(
    session: WorkspaceSessionEntity,
    reason: CleanupReason,
  ): Promise<void> {
    this.logger.log(`Cleaning up session ${session.id} (${reason})`);

    // Unregister from container registry to stop health checks
    try {
      await this.containerRegistry.unregisterContainer(session.id);
    } catch (unregError) {
      this.logger.warn(
        `Failed to unregister session ${session.id} from registry during cleanup:`,
        unregError,
      );
    }

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
    session.activityLevel = 'disconnected';
    session.activeConnectionCount = 0;
    session.gracePeriodEndsAt = null;

    // Update connection metrics
    if (session.connectionMetrics) {
      session.connectionMetrics.lastDisconnectReason = reason;
    }

    await this.workspaceRepository.save(session);

    // Force cleanup in activity manager
    await this.activityManager.forceCleanup(session.id);

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

  /**
   * Get cleanup statistics for monitoring
   */
  async getCleanupStatistics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    disconnectedSessions: number;
    backgroundSessions: number;
    orphanedSessions: number;
  }> {
    const [
      totalSessions,
      activeSessions,
      disconnectedSessions,
      backgroundSessions,
    ] = await Promise.all([
      this.workspaceRepository.count(),
      this.workspaceRepository.count({
        where: { activityLevel: 'active' },
      }),
      this.workspaceRepository.count({
        where: { activityLevel: 'disconnected' },
      }),
      this.workspaceRepository.count({
        where: { activityLevel: 'background' },
      }),
    ]);

    // Calculate orphaned sessions (disconnected with old activity)
    const cutoffTime = new Date(Date.now() - 30 * 60 * 1000);
    const orphanedSessions = await this.workspaceRepository.count({
      where: {
        activityLevel: 'disconnected',
        lastActivityAt: { $lt: cutoffTime } as any,
      },
    });

    return {
      totalSessions,
      activeSessions,
      disconnectedSessions,
      backgroundSessions,
      orphanedSessions,
    };
  }
}
