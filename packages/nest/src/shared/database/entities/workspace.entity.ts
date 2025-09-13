import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Workspace as IWorkspace } from '@sansa-dev/shared';
import type {
  ResourceAllocation,
  PreviewEnvironment,
} from '@sansa-dev/shared/src/workspace/session.types';

/**
 * Workspace Entity
 *
 * Stores persistent workspace data for user projects. This represents the
 * core workspace concept - a saved project that can be restored and worked on.
 * Sessions are created from workspaces but workspaces exist independently.
 */
@Entity('workspaces')
@Index(['userId', 'lastAccessedAt'])
@Index(['userId', 'createdAt'])
@Index(['templateId'])
export class Workspace implements IWorkspace {
  /**
   * Unique identifier for the workspace
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the user who owns this workspace
   */
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  /**
   * Optional user-friendly name for the workspace
   */
  @Column({ length: 255, nullable: true })
  name?: string;

  /**
   * Template ID used to create this workspace
   */
  @Column({ name: 'template_id', length: 255 })
  templateId: string;

  /**
   * Storage key/path where the workspace files are stored
   */
  @Column({ name: 'storage_key', length: 500 })
  storageKey: string;

  /**
   * Default resource allocation for sessions created from this workspace
   */
  @Column('jsonb')
  resources: ResourceAllocation;

  /**
   * Default environment configuration for sessions created from this workspace
   */
  @Column('jsonb')
  environment: PreviewEnvironment;

  /**
   * When the workspace was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  /**
   * When the workspace was last accessed
   */
  @Column({ name: 'last_accessed_at', type: 'timestamp with time zone' })
  lastAccessedAt: string;

  /**
   * When the workspace was last saved (optional)
   */
  @Column({
    name: 'last_saved_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  lastSavedAt?: string;

  /**
   * Template-specific configuration and metadata
   */
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  /**
   * When the entity was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Note: workspaceId references this entity's id
   * Context entities should reference this.id for proper data relationships
   */

  /**
   * Business logic methods
   */

  /**
   * Check if the workspace is accessible by a user
   */
  isAccessibleBy(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Get the workspace name or generate a default one
   */
  getDisplayName(): string {
    return this.name || `Workspace ${this.id.substring(0, 8)}`;
  }

  /**
   * Update the last accessed timestamp
   */
  updateLastAccessed(): void {
    this.lastAccessedAt = new Date().toISOString();
  }

  /**
   * Update the last saved timestamp
   */
  updateLastSaved(): void {
    this.lastSavedAt = new Date().toISOString();
  }

  /**
   * Check if the workspace has been saved
   */
  hasBeenSaved(): boolean {
    return !!this.lastSavedAt;
  }

  /**
   * Get the storage path for this workspace
   */
  getStoragePath(): string {
    return this.storageKey;
  }

  /**
   * Check if workspace is recent (accessed within last N days)
   */
  isRecent(days: number = 30): boolean {
    const lastAccessed = new Date(this.lastAccessedAt);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return lastAccessed > cutoff;
  }

  /**
   * Get workspace metadata value by key
   */
  getMetadata(key: string): any {
    return this.metadata?.[key];
  }

  /**
   * Set workspace metadata value
   */
  setMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata[key] = value;
  }

  /**
   * Update workspace name
   */
  updateName(name: string): void {
    this.name = name;
  }

  /**
   * Get the template ID
   */
  getTemplateId(): string {
    return this.templateId;
  }
}
