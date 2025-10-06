import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Entity for API keys used by Sansa-X clients.
 *
 * API keys are associated with user appIds and provide secure access
 * to the Sansa-X data ingestion endpoints.
 */
@Entity()
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 64 })
  @Index()
  key: string;

  @Column({ length: 100 })
  name: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  expiresAt: Date;

  @Column({ nullable: true, length: 45 })
  lastUsedIp: string;

  @Column({ nullable: true, type: 'timestamp' })
  lastUsedAt: Date;

  @Column({ type: 'int', default: 0 })
  requestCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Check if the API key is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return this.expiresAt < new Date();
  }

  /**
   * Check if the API key is valid (active and not expired)
   */
  isValid(): boolean {
    return this.isActive && !this.isExpired();
  }

  /**
   * Update usage statistics
   */
  updateUsage(ipAddress?: string): void {
    this.lastUsedAt = new Date();
    this.lastUsedIp = ipAddress || null;
    this.requestCount += 1;
  }
}
