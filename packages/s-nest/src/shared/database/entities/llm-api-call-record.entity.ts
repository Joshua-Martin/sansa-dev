import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entity for storing complete LLM API call records from Sansa-X
 *
 * This entity stores the merged pre-request and post-response data
 * along with application context for multi-tenant tracking and analytics.
 */
@Entity()
export class LLMApiCallRecord {
  @PrimaryColumn({ length: 128 })
  id: string;

  @Column({ length: 36 })
  @Index()
  appId: string;

  @Column({ length: 128 })
  @Index()
  name: string;

  @Column({ length: 128 })
  @Index()
  promptVersion: string;

  @Column({ type: 'text', nullable: true })
  prompt: string;

  @Column({ type: 'text', nullable: true })
  systemPrompt: string;

  @Column({ length: 50 })
  model: string;

  @Column({ length: 50 })
  provider: string;

  @Column({ type: 'int', nullable: true })
  inputTokenCount: number;

  @Column({ type: 'int', nullable: true })
  outputTokenCount: number;

  @Column({ type: 'text', nullable: true })
  response: string;

  @Column({ type: 'timestamp' })
  requestTimestamp: Date;

  @Column({ type: 'timestamp' })
  responseTimestamp: Date;

  @Column({ type: 'int', nullable: true })
  durationMs: number;

  @Column({ type: 'jsonb', nullable: true })
  error: {
    message: string;
    code?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Get total token count (input + output)
   */
  get totalTokens(): number {
    return (this.inputTokenCount || 0) + (this.outputTokenCount || 0);
  }

  /**
   * Check if the call was successful (no error)
   */
  get isSuccessful(): boolean {
    return !this.error;
  }

  /**
   * Get the duration in seconds
   */
  get durationSeconds(): number {
    return this.durationMs ? this.durationMs / 1000 : 0;
  }
}
