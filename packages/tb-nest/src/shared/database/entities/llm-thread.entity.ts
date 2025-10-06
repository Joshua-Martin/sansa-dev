import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { LLMThreadStatus } from '../../../../../tb-shared/src';
import { User } from './user.entity';

/**
 * Entity for LLM chat threads
 *
 * Stores conversation threads between users and the LLM system.
 * Each thread represents a continuous conversation context.
 */
@Entity('llm_threads')
@Index(['workspaceId', 'userId', 'status'])
@Index(['workspaceId'])
export class LLMThread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId: string | null;

  @Column({ length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: ['active', 'paused', 'archived', 'deleted'],
    default: 'active',
  })
  status: LLMThreadStatus;

  @Column({ name: 'message_count', default: 0 })
  messageCount: number;

  @Column({ name: 'last_message_at', nullable: true, type: 'timestamp' })
  @Index()
  lastMessageAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Many-to-one relationship with User
   * Each thread belongs to one user
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Note: workspaceId references WorkspaceSessionEntity.id
   * Threads are scoped to workspaces for proper isolation
   */

  /**
   * One-to-many relationship with LLMMessage
   * Each thread can have multiple messages
   */
  @OneToMany('LLMMessage', 'thread', {
    cascade: true,
    onDelete: 'CASCADE',
  })
  messages: any[];

  /**
   * Check if the thread is active and can receive new messages
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Check if the thread can be modified
   */
  canModify(): boolean {
    return this.status !== 'deleted';
  }

  /**
   * Update the last message timestamp and increment message count
   */
  updateLastMessage(): void {
    this.lastMessageAt = new Date();
    this.messageCount += 1;
  }

  /**
   * Generate a title from the first message content
   *
   * @param {string} content - The content to generate title from
   * @returns {string} Generated title
   */
  static generateTitle(content: string): string {
    // Take first 50 characters and clean up
    const title = content
      .substring(0, 50)
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s-]/g, ''); // Remove special characters except spaces and hyphens

    return title || 'New Chat';
  }

  /**
   * Check if the thread is associated with a workspace
   */
  hasWorkspace(): boolean {
    return this.workspaceId !== null;
  }

  /**
   * Associate the thread with a workspace
   */
  setWorkspace(workspaceId: string): void {
    this.workspaceId = workspaceId;
  }

  /**
   * Remove workspace association from the thread
   */
  removeWorkspace(): void {
    this.workspaceId = null;
  }

  /**
   * Check if the thread belongs to a specific workspace
   */
  belongsToWorkspace(workspaceId: string): boolean {
    return this.workspaceId === workspaceId;
  }

  /**
   * Get workspace-scoped thread identifier
   */
  getWorkspaceScopedId(): string {
    return this.workspaceId ? `${this.workspaceId}:${this.id}` : this.id;
  }
}
