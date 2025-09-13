/**
 * Bull Queue Types for Workspace Cleanup Operations
 *
 * Defines comprehensive types for Bull queue jobs, data structures, and configuration
 * used throughout the workspace cleanup system.
 */

import { RedisOptions } from 'ioredis';

/**
 * Queue names used in the application
 */
export type QueueName = 'workspace-cleanup';

/**
 * Job names for different cleanup operations
 */
export type WorkspaceCleanupJobName =
  | 'session-cleanup'
  | 'health-check-cleanup'
  | 'orphaned-sessions-cleanup'
  | 'manual-cleanup';

/**
 * Base job data interface
 */
export interface BaseJobData {
  /** Unique job identifier */
  jobId: string;
  /** Timestamp when job was created */
  createdAt: string;
  /** Optional user ID associated with the job */
  userId?: string;
}

/**
 * Job data for individual session cleanup operations
 */
export interface SessionCleanupJobData extends BaseJobData {
  /** Session ID to cleanup */
  sessionId: string;
  /** User ID who owns the session */
  userId: string;
  /** Reason for cleanup */
  reason: CleanupReason;
}

/**
 * Job data for health check cleanup operations
 */
export interface HealthCheckCleanupJobData extends BaseJobData {
  /** Session IDs to check and cleanup if unhealthy */
  sessionIds: string[];
  /** Timeout for health checks in milliseconds */
  healthCheckTimeout: number;
}

/**
 * Job data for orphaned sessions cleanup operations
 */
export interface OrphanedSessionsCleanupJobData extends BaseJobData {
  /** Maximum age for considering sessions orphaned (milliseconds) */
  maxAgeMs: number;
}

/**
 * Job data for manual cleanup operations
 */
export interface ManualCleanupJobData extends BaseJobData {
  /** Session IDs to cleanup */
  sessionIds: string[];
  /** Reason for manual cleanup */
  reason: string;
}

/**
 * Union type for all cleanup job data
 */
export type WorkspaceCleanupJobData =
  | SessionCleanupJobData
  | HealthCheckCleanupJobData
  | OrphanedSessionsCleanupJobData
  | ManualCleanupJobData;

/**
 * Reasons for session cleanup
 */
export type CleanupReason =
  | 'disconnected'
  | 'background-timeout'
  | 'health-check-failure'
  | 'orphaned'
  | 'manual';

/**
 * Job result interface for cleanup operations
 */
export interface CleanupJobResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Number of sessions/containers processed */
  processedCount: number;
  /** Number of sessions/containers successfully cleaned up */
  cleanedCount: number;
  /** Session IDs that were successfully cleaned up */
  cleanedSessionIds: string[];
  /** Errors encountered during cleanup */
  errors: CleanupError[];
  /** Timestamp when cleanup completed */
  completedAt: string;
  /** Duration of cleanup operation in milliseconds */
  duration: number;
}

/**
 * Error details for cleanup operations
 */
export interface CleanupError {
  /** Session ID where error occurred */
  sessionId?: string;
  /** Error message */
  message: string;
  /** Error code for categorization */
  code: CleanupErrorCode;
  /** Additional error context */
  context?: Record<string, unknown>;
}

/**
 * Error codes for cleanup operations
 */
export type CleanupErrorCode =
  | 'CONTAINER_STOP_FAILED'
  | 'CONTAINER_REMOVE_FAILED'
  | 'DATABASE_UPDATE_FAILED'
  | 'DOCKER_SERVICE_ERROR'
  | 'SESSION_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'TIMEOUT_ERROR';

/**
 * Queue configuration options
 */
export interface QueueConfig {
  /** Redis connection configuration */
  redis: RedisOptions;
  /** Default job options */
  defaultJobOptions: {
    /** Remove job after completion */
    removeOnComplete: number;
    /** Remove job after failure */
    removeOnFail: number;
    /** Maximum attempts for failed jobs */
    attempts: number;
    /** Backoff strategy for retries */
    backoff: {
      type: 'exponential';
      delay: number;
    };
  };
  /** Queue-specific settings */
  settings: {
    /** Maximum number of jobs that can be processed concurrently */
    concurrency: number;
    /** Lock duration for job processing */
    lockDuration: number;
    /** Lock renewal time */
    lockRenewTime: number;
  };
}

/**
 * Queue health status
 */
export interface QueueHealthStatus {
  /** Whether queue is operational */
  isHealthy: boolean;
  /** Number of active jobs */
  activeJobs: number;
  /** Number of waiting jobs */
  waitingJobs: number;
  /** Number of failed jobs */
  failedJobs: number;
  /** Number of completed jobs */
  completedJobs: number;
  /** Last error message if any */
  lastError?: string;
  /** Timestamp of last health check */
  lastHealthCheck: string;
}

/**
 * Job progress information
 */
export interface JobProgress {
  /** Current progress percentage (0-100) */
  percentage: number;
  /** Current step description */
  currentStep: string;
  /** Total number of steps */
  totalSteps: number;
  /** Current step number */
  currentStepNumber: number;
  /** Additional progress metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Queue monitoring metrics
 */
export interface QueueMetrics {
  /** Queue name */
  queueName: QueueName;
  /** Current timestamp */
  timestamp: string;
  /** Jobs processed in the last period */
  jobsProcessed: number;
  /** Average processing time */
  averageProcessingTime: number;
  /** Jobs failed in the last period */
  jobsFailed: number;
  /** Current queue length */
  queueLength: number;
  /** Active workers count */
  activeWorkers: number;
}
