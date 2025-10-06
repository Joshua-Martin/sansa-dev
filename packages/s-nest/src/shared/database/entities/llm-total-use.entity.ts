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
import { User } from './user.entity';

/**
 * Entity for tracking total LLM usage per day
 *
 * Aggregates usage statistics per user and day for usage limits,
 * billing calculations, and trend analysis.
 */
@Entity()
export class LlmTotalUse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User | null; // null means global/aggregate stats

  @Column({ default: 0 })
  totalRequests: number;

  @Column({ default: 0 })
  totalInputTokens: number;

  @Column({ default: 0 })
  totalOutputTokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  totalCostUsd: number;

  @Column({ type: 'jsonb', nullable: true })
  modelBreakdown: Record<
    string,
    {
      requests: number;
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
    }
  >;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Get total tokens (input + output)
   */
  get totalTokens(): number {
    return this.totalInputTokens + this.totalOutputTokens;
  }

  /**
   * Check if user has exceeded daily limits
   */
  hasExceededDailyLimits(limits: {
    maxRequests?: number;
    maxTokens?: number;
    maxCostUsd?: number;
  }): boolean {
    if (limits.maxRequests && this.totalRequests >= limits.maxRequests) {
      return true;
    }
    if (limits.maxTokens && this.totalTokens >= limits.maxTokens) {
      return true;
    }
    if (limits.maxCostUsd && Number(this.totalCostUsd) >= limits.maxCostUsd) {
      return true;
    }
    return false;
  }
}
