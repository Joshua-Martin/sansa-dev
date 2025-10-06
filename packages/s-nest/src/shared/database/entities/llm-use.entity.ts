import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Entity for tracking LLM usage per user
 *
 * Records individual LLM requests from each user,
 * including request data, model used, and tokens consumed.
 */
@Entity()
export class LlmUse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @Column({ length: 50 })
  modelName: string;

  @Column({ nullable: true })
  inputTokens: number;

  @Column({ nullable: true })
  outputTokens: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 6 })
  costUsd: number;

  @Column({ type: 'jsonb', nullable: true })
  requestData: Record<string, string | number | boolean>;

  @Column({ nullable: true, length: 255 })
  status: string;

  @Column({ nullable: true, length: 45 })
  ipAddress: string;

  @Column({ nullable: true, length: 1024 })
  userAgent: string;

  @CreateDateColumn()
  @Index()
  timestamp: Date;
}
