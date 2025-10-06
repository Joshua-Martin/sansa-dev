import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserRole } from '../../../../../tb-shared/src';

/**
 * Entity for user accounts and authentication
 *
 * Stores user credentials, profile information, and authentication state
 * with secure password hashing and email verification capabilities.
 */
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  @Index()
  email: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'moderator', 'user'],
    default: 'user',
  })
  role: UserRole;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  lastLoginAt: Date;

  @Column({ nullable: true, length: 128 })
  passwordResetToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  passwordResetTokenExpiry: Date;

  @Column({ nullable: true, length: 128 })
  emailVerificationToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  emailVerificationTokenExpiry: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Get user's full name
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Check if password reset token is valid and not expired
   */
  isPasswordResetTokenValid(): boolean {
    if (!this.passwordResetToken || !this.passwordResetTokenExpiry) {
      return false;
    }
    return this.passwordResetTokenExpiry > new Date();
  }

  /**
   * Check if email verification token is valid and not expired
   */
  isEmailVerificationTokenValid(): boolean {
    if (!this.emailVerificationToken || !this.emailVerificationTokenExpiry) {
      return false;
    }
    return this.emailVerificationTokenExpiry > new Date();
  }

  /**
   * Convert to public profile object (excluding sensitive data)
   */
  toProfile(): {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: UserRole;
    isEmailVerified: boolean;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  } {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      role: this.role,
      isEmailVerified: this.isEmailVerified,
      isActive: this.isActive,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
    };
  }
}
