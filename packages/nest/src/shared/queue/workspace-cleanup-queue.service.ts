/**
 * Workspace Cleanup Queue Service
 *
 * Handles scheduling and management of workspace cleanup jobs using Bull queues.
 * Provides methods for scheduling different types of cleanup operations with proper error handling.
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { QueueConfigService } from './queue.config';
import {
  WorkspaceCleanupJobName,
  WorkspaceCleanupJobData,
  SessionCleanupJobData,
  CleanupJobResult,
  QueueHealthStatus,
} from './queue.types';

/**
 * Service for managing workspace cleanup queue operations
 *
 * Handles scheduling of cleanup jobs, job cancellation, and queue monitoring.
 * Integrates with Bull queues for reliable job processing.
 */
@Injectable()
export class WorkspaceCleanupQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(WorkspaceCleanupQueueService.name);
  private readonly queueName = 'workspace-cleanup';

  constructor(
    @InjectQueue('workspace-cleanup')
    private readonly cleanupQueue: Queue,
    private readonly queueConfigService: QueueConfigService,
  ) {}

  /**
   * Initialize the queue service
   *
   * Sets up queue event listeners.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing workspace cleanup queue service');

    // Setup queue event listeners
    this.setupQueueEventListeners();

    this.logger.log('Workspace cleanup queue service initialized');
  }

  /**
   * Cleanup on module destroy
   *
   * Closes the queue and cleans up resources.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Destroying workspace cleanup queue service');

    try {
      await this.cleanupQueue.close();
      this.logger.log('Queue closed successfully');
    } catch (error) {
      this.logger.error('Error closing queue:', error);
    }
  }

  /**
   * Schedule cleanup for a specific workspace session
   *
   * @param sessionId - ID of the session to cleanup
   * @param userId - ID of the user who owns the session
   * @param delay - Delay in milliseconds before cleanup
   * @param reason - Reason for cleanup
   * @param force - Whether to force cleanup even if session is active
   */
  async scheduleSessionCleanup(
    sessionId: string,
    userId: string,
    delay: number,
    reason: SessionCleanupJobData['reason'],
  ): Promise<Job<SessionCleanupJobData>> {
    this.logger.log(
      `Scheduling cleanup for session ${sessionId} in ${delay}ms`,
    );

    const jobData: SessionCleanupJobData = {
      jobId: uuidv4(),
      createdAt: new Date().toISOString(),
      sessionId,
      userId,
      reason,
    };

    const jobOptions = {
      ...this.queueConfigService.getJobOptions('session-cleanup'),
      delay,
      jobId: `session-cleanup-${sessionId}`,
      removeOnComplete: 24, // Keep completed jobs for auditing
    };

    const job = await this.cleanupQueue.add(
      'session-cleanup',
      jobData,
      jobOptions,
    );
    this.logger.log(`Scheduled cleanup job ${job.id} for session ${sessionId}`);

    return job;
  }

  /**
   * Cancel scheduled cleanup for a specific session
   *
   * @param sessionId - ID of the session to cancel cleanup for
   */
  async cancelSessionCleanup(sessionId: string): Promise<void> {
    this.logger.log(`Cancelling cleanup for session ${sessionId}`);

    try {
      const jobId = `session-cleanup-${sessionId}`;
      const job = await this.cleanupQueue.getJob(jobId);

      if (job) {
        await job.remove();
        this.logger.log(`Cancelled cleanup job for session ${sessionId}`);
      } else {
        this.logger.debug(`No cleanup job found for session ${sessionId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to cancel cleanup for session ${sessionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Reschedule cleanup for a session with new delay
   *
   * @param sessionId - ID of the session
   * @param userId - ID of the user who owns the session
   * @param newDelay - New delay in milliseconds
   * @param reason - Reason for cleanup
   */
  async rescheduleSessionCleanup(
    sessionId: string,
    userId: string,
    newDelay: number,
    reason: SessionCleanupJobData['reason'],
  ): Promise<Job<SessionCleanupJobData>> {
    // Cancel existing job
    await this.cancelSessionCleanup(sessionId);

    // Schedule new job
    return this.scheduleSessionCleanup(sessionId, userId, newDelay, reason);
  }

  /**
   * Schedule health check cleanup job
   *
   * @param sessionIds - Session IDs to check and cleanup if unhealthy
   * @param healthCheckTimeout - Timeout for health checks in milliseconds
   */
  async scheduleHealthCheckCleanup(
    sessionIds: string[],
    healthCheckTimeout: number = 30000,
  ): Promise<Job> {
    const jobData = {
      jobId: uuidv4(),
      createdAt: new Date().toISOString(),
      sessionIds,
      healthCheckTimeout,
    };

    const jobOptions = {
      ...this.queueConfigService.getJobOptions('health-check-cleanup'),
      jobId: `health-check-cleanup-${Date.now()}`,
    };

    return this.cleanupQueue.add('health-check-cleanup', jobData, jobOptions);
  }

  /**
   * Schedule orphaned sessions cleanup job
   *
   * @param maxAgeMs - Maximum age for considering sessions orphaned
   */
  async scheduleOrphanedSessionsCleanup(
    maxAgeMs: number = 30 * 60 * 1000, // 30 minutes
  ): Promise<Job> {
    const jobData = {
      jobId: uuidv4(),
      createdAt: new Date().toISOString(),
      maxAgeMs,
    };

    const jobOptions = {
      ...this.queueConfigService.getJobOptions('orphaned-sessions-cleanup'),
      jobId: `orphaned-sessions-cleanup-${Date.now()}`,
    };

    return this.cleanupQueue.add(
      'orphaned-sessions-cleanup',
      jobData,
      jobOptions,
    );
  }

  /**
   * Schedule manual cleanup job
   *
   * @param sessionIds - Session IDs to cleanup
   * @param reason - Reason for manual cleanup
   */
  async scheduleManualCleanup(
    sessionIds: string[],
    reason: string,
  ): Promise<Job> {
    const jobData = {
      jobId: uuidv4(),
      createdAt: new Date().toISOString(),
      sessionIds,
      reason,
    };

    const jobOptions = {
      ...this.queueConfigService.getJobOptions('manual-cleanup'),
      jobId: `manual-cleanup-${Date.now()}`,
    };

    return this.cleanupQueue.add('manual-cleanup', jobData, jobOptions);
  }

  /**
   * Get queue health status
   *
   * @returns Promise<QueueHealthStatus> - Current queue health information
   */
  async getQueueHealth(): Promise<QueueHealthStatus> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.cleanupQueue.getWaiting(),
        this.cleanupQueue.getActive(),
        this.cleanupQueue.getCompleted(),
        this.cleanupQueue.getFailed(),
        this.cleanupQueue.getDelayed(),
      ]);

      const isHealthy = await this.checkQueueHealth();

      return {
        isHealthy,
        activeJobs: active.length,
        waitingJobs: waiting.length,
        failedJobs: failed.length,
        completedJobs: completed.length,
        lastHealthCheck: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get queue health:', error);
      return {
        isHealthy: false,
        activeJobs: 0,
        waitingJobs: 0,
        failedJobs: 0,
        completedJobs: 0,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        lastHealthCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Check if the queue is healthy
   *
   * @returns Promise<boolean> - Whether the queue is healthy
   */
  private async checkQueueHealth(): Promise<boolean> {
    try {
      // Simple health check - try to get queue stats
      await this.cleanupQueue.getJobCounts();
      return true;
    } catch (error) {
      this.logger.error('Queue health check failed:', error);
      return false;
    }
  }

  /**
   * Setup queue event listeners
   *
   * Listens for job events and logs them appropriately.
   */
  private setupQueueEventListeners(): void {
    // Job completed
    this.cleanupQueue.on(
      'completed',
      (job: Job<WorkspaceCleanupJobData>, result: CleanupJobResult) => {
        this.logger.log(
          `Job ${job.id} (${job.name}) completed. Processed: ${result.processedCount}, Cleaned: ${result.cleanedCount}`,
        );
      },
    );

    // Job failed
    this.cleanupQueue.on(
      'failed',
      (job: Job<WorkspaceCleanupJobData>, err: Error) => {
        this.logger.error(`Job ${job.id} (${job.name}) failed:`, err);
      },
    );

    // Job stalled
    this.cleanupQueue.on('stalled', (jobId: string) => {
      this.logger.warn(`Job ${jobId} stalled and will be retried`);
    });

    // Queue ready
    this.cleanupQueue.on('ready', () => {
      this.logger.log('Queue is ready and connected to Redis');
    });

    // Queue error
    this.cleanupQueue.on('error', (error: Error) => {
      this.logger.error('Queue error:', error);
    });
  }

  /**
   * Get active jobs count
   *
   * @returns Promise<number> - Number of currently active jobs
   */
  async getActiveJobsCount(): Promise<number> {
    const active = await this.cleanupQueue.getActive();
    return active.length;
  }

  /**
   * Get waiting jobs count
   *
   * @returns Promise<number> - Number of jobs waiting to be processed
   */
  async getWaitingJobsCount(): Promise<number> {
    const waiting = await this.cleanupQueue.getWaiting();
    return waiting.length;
  }

  /**
   * Clear all jobs from the queue
   *
   * @param state - Job state to clear ('completed', 'failed', 'active', 'waiting')
   */
  async clearJobs(
    state: 'completed' | 'failed' | 'active' | 'waiting' | 'delayed',
  ): Promise<void> {
    this.logger.log(`Clearing ${state} jobs from queue`);

    try {
      switch (state) {
        case 'completed':
          await this.cleanupQueue.clean(0, 'completed');
          break;
        case 'failed':
          await this.cleanupQueue.clean(0, 'failed');
          break;
        case 'active':
          await this.cleanupQueue.clean(0, 'active');
          break;
        case 'waiting':
          await this.cleanupQueue.empty();
          break;
        case 'delayed':
          await this.cleanupQueue.clean(0, 'delayed');
          break;
      }

      this.logger.log(`Successfully cleared ${state} jobs`);
    } catch (error) {
      this.logger.error(`Failed to clear ${state} jobs:`, error);
      throw error;
    }
  }
}
