import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { WorkspaceSession } from '@sansa-dev/shared';
import type {
  WorkspaceStatus,
  ResourceAllocation,
  PreviewEnvironment,
  ActivityLevel,
  ConnectionMetrics,
} from '@sansa-dev/shared';

/**
 * Workspace Session Entity
 *
 * Stores workspace session data for container orchestration and activity-based cleanup.
 * Each session represents an isolated workspace with its own container and resources.
 * Activity tracking replaces arbitrary expiration-based cleanup.
 */
@Entity('workspace_sessions')
@Index(['userId', 'status'])
@Index(['status'])
@Index(['activityLevel'])
@Index(['lastActivityAt'])
export class WorkspaceSessionEntity implements WorkspaceSession {
  /**
   * Unique identifier for the workspace session
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the user who owns this workspace session
   */
  @Column('uuid')
  @Index()
  userId: string;

  /**
   * Optional workspace ID if this session is associated with a persistent workspace
   */
  @Column('uuid', { nullable: true })
  workspaceId?: string | null;

  /**
   * Docker container ID (set after container creation)
   */
  @Column('varchar', { length: 64, nullable: true })
  containerId?: string | null;

  /**
   * Human-readable container name for identification
   */
  @Column('varchar', { length: 255 })
  containerName: string;

  /**
   * Current status of the workspace session
   */
  @Column({
    type: 'enum',
    enum: [
      'creating',
      'initializing',
      'running',
      'stopping',
      'stopped',
      'error',
    ],
    default: 'creating',
  })
  status: WorkspaceStatus;

  /**
   * Preview URL where the workspace can be accessed
   */
  @Column('varchar', { length: 512 })
  previewUrl: string;

  /**
   * Port number allocated for this workspace (HMR/dev server)
   */
  @Column('integer')
  port: number;

  /**
   * Port number allocated for the container tool server
   */
  @Column('integer', { nullable: true })
  toolServerPort?: number;

  /**
   * Resource allocation configuration (stored as JSON)
   */
  @Column('jsonb')
  resources: ResourceAllocation;

  /**
   * Preview environment configuration (stored as JSON)
   */
  @Column('jsonb')
  environment: PreviewEnvironment;

  /**
   * Timestamp when the session was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  /**
   * Timestamp when the session last had user activity
   */
  @Column('varchar', { length: 32, nullable: true, name: 'last_activity_at' })
  lastActivityAt?: string;

  /**
   * Current activity level of the session
   */
  @Column('enum', {
    enum: ['active', 'idle', 'background', 'disconnected'],
    default: 'active',
    name: 'activity_level',
  })
  activityLevel: ActivityLevel;

  /**
   * Number of active connections to this session
   */
  @Column('integer', { default: 0, name: 'active_connection_count' })
  activeConnectionCount: number;

  /**
   * Timestamp when grace period ends (for reconnection after disconnect)
   */
  @Column('varchar', {
    length: 32,
    nullable: true,
    name: 'grace_period_ends_at',
  })
  gracePeriodEndsAt?: string;

  /**
   * Connection metrics for monitoring and analytics
   */
  @Column('jsonb', { nullable: true, name: 'connection_metrics' })
  connectionMetrics?: ConnectionMetrics;

  /**
   * Whether the workspace is ready for use
   */
  @Column('boolean', { default: false, name: 'is_ready' })
  isReady: boolean;

  /**
   * Error message if the workspace failed to initialize
   */
  @Column('text', { nullable: true })
  error?: string;

  /**
   * Whether this workspace has saved changes that can be restored
   */
  @Column('boolean', { default: false, name: 'has_saved_changes' })
  hasSavedChanges: boolean;

  /**
   * Timestamp when the workspace was last saved
   */
  @Column('varchar', { length: 32, nullable: true, name: 'last_saved_at' })
  lastSavedAt?: string;

  /**
   * Template ID used to initialize this workspace (for restoration purposes)
   */
  @Column('varchar', { length: 255, nullable: true, name: 'template_id' })
  templateId?: string;

  /**
   * Timestamp when the entity was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  /**
   * Business logic methods
   */

  /**
   * Check if the workspace is running and ready for use
   */
  isWorkspaceReady(): boolean {
    return this.status === 'running' && this.isReady === true;
  }

  /**
   * Check if the workspace can be terminated
   */
  canBeTerminated(): boolean {
    return ['stopping', 'stopped', 'error'].includes(this.status);
  }

  /**
   * Update activity timestamp
   */
  updateActivity(): void {
    this.lastActivityAt = new Date().toISOString();
    this.activityLevel = 'active';
  }

  /**
   * Mark workspace as idle
   */
  markAsIdle(): void {
    this.activityLevel = 'idle';
    this.lastActivityAt = new Date().toISOString();
  }

  /**
   * Mark workspace as disconnected
   */
  markAsDisconnected(): void {
    this.activityLevel = 'disconnected';
    this.activeConnectionCount = Math.max(0, this.activeConnectionCount - 1);
  }

  /**
   * Increment connection count
   */
  incrementConnections(): void {
    this.activeConnectionCount += 1;
    this.updateActivity();
  }

  /**
   * Decrement connection count
   */
  decrementConnections(): void {
    this.activeConnectionCount = Math.max(0, this.activeConnectionCount - 1);
    if (this.activeConnectionCount === 0) {
      this.markAsIdle();
    }
  }

  /**
   * Check if workspace is eligible for cleanup
   */
  isEligibleForCleanup(gracePeriodMinutes: number = 30): boolean {
    if (!this.lastActivityAt) return false;
    if (this.activeConnectionCount > 0) return false;
    if (this.activityLevel === 'active') return false;

    const lastActivity = new Date(this.lastActivityAt);
    const gracePeriodEnd = new Date(
      lastActivity.getTime() + gracePeriodMinutes * 60000,
    );
    return new Date() > gracePeriodEnd;
  }

  /**
   * Get workspace health status
   */
  getHealthStatus(): 'healthy' | 'warning' | 'error' {
    if (this.status === 'error') return 'error';
    if (this.status === 'running' && this.isReady) return 'healthy';
    if (this.status === 'creating' || this.status === 'initializing')
      return 'warning';
    return 'warning';
  }

  /**
   * Check if session is accessible by a user
   */
  isAccessibleBy(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Update the last saved timestamp
   */
  updateLastSaved(): void {
    this.lastSavedAt = new Date().toISOString();
    this.hasSavedChanges = true;
  }

  /**
   * Set grace period end time
   */
  setGracePeriod(minutes: number = 5): void {
    const gracePeriodEnd = new Date(Date.now() + minutes * 60 * 1000);
    this.gracePeriodEndsAt = gracePeriodEnd.toISOString();
  }

  /**
   * Clear grace period
   */
  clearGracePeriod(): void {
    this.gracePeriodEndsAt = undefined;
  }
}
