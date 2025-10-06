/**
 * Queue Configuration
 *
 * Provides centralized configuration for Bull queues with Redis integration.
 * Handles queue setup, job options, and Redis connection configuration.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { QueueConfig, QueueName } from './queue.types';

/**
 * Queue configuration service
 *
 * Provides centralized configuration for all Bull queues in the application.
 * Integrates with existing Redis service configuration for consistency.
 */
@Injectable()
export class QueueConfigService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Get complete queue configuration for the workspace cleanup queue
   *
   * @returns QueueConfig - Complete configuration object for Bull queue
   */
  getQueueConfig(): QueueConfig {
    return {
      redis: this.redisService.getRedisConfig(),
      defaultJobOptions: {
        removeOnComplete: 24, // Keep completed jobs for 24 hours
        removeOnFail: 7 * 24, // Keep failed jobs for 7 days
        attempts: 3, // Retry failed jobs 3 times
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 second delay
        },
      },
      settings: {
        concurrency: 5, // Process up to 5 cleanup jobs concurrently
        lockDuration: 30000, // 30 second lock duration
        lockRenewTime: 15000, // Renew lock every 15 seconds
      },
    };
  }

  /**
   * Get queue-specific configuration options
   *
   * @param queueName - Name of the queue
   * @returns Partial<QueueConfig> - Queue-specific configuration
   */
  getQueueSpecificConfig(queueName: QueueName): Partial<QueueConfig> {
    const baseConfig = this.getQueueConfig();

    switch (queueName) {
      case 'workspace-cleanup':
        return {
          ...baseConfig,
          settings: {
            ...baseConfig.settings,
            concurrency: 3, // Lower concurrency for cleanup operations
          },
        };
      default:
        return baseConfig;
    }
  }

  /**
   * Get job-specific options based on job type
   *
   * @param jobName - Name of the job type
   * @returns Record<string, unknown> - Job-specific options
   */
  getJobOptions(jobName: string): Record<string, unknown> {
    const baseOptions = this.getQueueConfig().defaultJobOptions;

    switch (jobName) {
      case 'session-cleanup':
        return {
          ...baseOptions,
          priority: 1, // High priority for immediate cleanup
          removeOnComplete: 24, // Keep completed jobs for auditing
        };

      case 'health-check-cleanup':
        return {
          ...baseOptions,
          priority: 2, // Medium priority for health checks
          attempts: 3, // Retry health checks
        };

      case 'orphaned-sessions-cleanup':
        return {
          ...baseOptions,
          priority: 3, // Lower priority for bulk cleanup
          removeOnComplete: 1, // Keep shorter for bulk operations
        };

      case 'manual-cleanup':
        return {
          ...baseOptions,
          priority: 1, // High priority for manual operations
          attempts: 1, // Don't retry manual operations
        };

      default:
        return baseOptions;
    }
  }

  /**
   * Get monitoring configuration
   *
   * @returns Record<string, unknown> - Monitoring configuration
   */
  getMonitoringConfig(): Record<string, unknown> {
    return {
      metrics: {
        maxMetrics: 1000, // Keep last 1000 metrics
        interval: 60000, // Collect metrics every minute
      },
      health: {
        checkInterval: 30000, // Health check every 30 seconds
        failureThreshold: 3, // Mark unhealthy after 3 failures
      },
    };
  }
}
