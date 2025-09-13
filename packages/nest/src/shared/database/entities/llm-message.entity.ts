import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LLMMessageRole, LLMMessageStatus } from '@sansa-dev/shared';

/**
 * Entity for LLM chat messages
 *
 * Stores individual messages within chat threads.
 * Messages can be from users, assistants (LLM), or system.
 */
@Entity('llm_messages')
export class LLMMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'thread_id', type: 'uuid' })
  @Index()
  threadId: string;

  @Column({
    type: 'enum',
    enum: ['user', 'assistant', 'system'],
  })
  role: LLMMessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed',
  })
  status: LLMMessageStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Many-to-one relationship with LLMThread
   * Each message belongs to one thread
   */
  @ManyToOne('LLMThread', 'messages', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'thread_id' })
  thread: any;

  /**
   * Check if the message is from a user
   */
  isUserMessage(): boolean {
    return this.role === 'user';
  }

  /**
   * Check if the message is from an assistant (LLM)
   */
  isAssistantMessage(): boolean {
    return this.role === 'assistant';
  }

  /**
   * Check if the message is a system message
   */
  isSystemMessage(): boolean {
    return this.role === 'system';
  }

  /**
   * Check if the message is completed
   */
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  /**
   * Check if the message is still being processed
   */
  isPending(): boolean {
    return this.status === 'pending';
  }

  /**
   * Mark the message as completed
   */
  markCompleted(): void {
    this.status = 'completed';
  }

  /**
   * Mark the message as failed
   */
  markFailed(): void {
    this.status = 'failed';
  }

  /**
   * Update the message content
   *
   * @param {string} newContent - The new content for the message
   */
  updateContent(newContent: string): void {
    this.content = newContent;
  }

  /**
   * Add or update metadata
   *
   * @param {Record<string, unknown>} newMetadata - The metadata to add/update
   */
  updateMetadata(newMetadata: Record<string, unknown>): void {
    this.metadata = { ...this.metadata, ...newMetadata };
  }
}
