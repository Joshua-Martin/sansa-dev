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
 * Entity for managing JWT refresh tokens
 *
 * Stores refresh tokens with expiration dates and revocation status
 * to enable secure token refresh and logout functionality.
 */
@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  @Index()
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  isRevoked: boolean;

  @Column({ nullable: true, length: 45 })
  ipAddress: string;

  @Column({ nullable: true, length: 1024 })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  /**
   * Check if the refresh token is expired
   */
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  /**
   * Check if the refresh token is active (not revoked and not expired)
   */
  isActive(): boolean {
    return !this.isRevoked && !this.isExpired();
  }

  /**
   * Revoke the refresh token
   */
  revoke(): void {
    this.isRevoked = true;
    this.updatedAt = new Date();
  }
}
