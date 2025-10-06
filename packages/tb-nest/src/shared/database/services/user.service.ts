import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import {
  CreateUserParams,
  UpdateUserParams,
  UserRole,
} from '@sansa-dev/tb-shared';

/**
 * Service for managing user operations
 *
 * Handles user creation, authentication, profile management,
 * and password operations with secure hashing.
 */
@Injectable()
export class UserService {
  private readonly bcryptRounds = 12;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create a new user with hashed password
   *
   * @param params - User creation parameters
   * @returns The created user entity
   * @throws ConflictException if email already exists
   */
  async createUser(params: CreateUserParams): Promise<User> {
    const { email, password, firstName, lastName, role = 'user' } = params;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.bcryptRounds);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationTokenExpiry = new Date();
    emailVerificationTokenExpiry.setHours(
      emailVerificationTokenExpiry.getHours() + 24,
    );

    // Create user entity
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      emailVerificationToken,
      emailVerificationTokenExpiry,
    });

    return this.userRepository.save(user);
  }

  /**
   * Find user by email
   *
   * @param email - User email address
   * @returns User entity or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Find user by ID
   *
   * @param id - User ID
   * @returns User entity
   * @throws NotFoundException if user not found
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Validate user password
   *
   * @param user - User entity
   * @param password - Plain text password to validate
   * @returns True if password is valid
   */
  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  /**
   * Update user's last login timestamp
   *
   * @param userId - User ID
   * @returns Updated user entity
   */
  async updateLastLogin(userId: string): Promise<User> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
    });

    return this.findById(userId);
  }

  /**
   * Update user profile information
   *
   * @param userId - User ID
   * @param params - Update parameters
   * @returns Updated user entity
   * @throws ConflictException if email already exists (when updating email)
   */
  async updateProfile(userId: string, params: UpdateUserParams): Promise<User> {
    const user = await this.findById(userId);

    // Check if email is being updated and if it already exists
    if (params.email && params.email.toLowerCase() !== user.email) {
      const existingUser = await this.findByEmail(params.email);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Update user properties
    if (params.firstName !== undefined) {
      user.firstName = params.firstName.trim();
    }
    if (params.lastName !== undefined) {
      user.lastName = params.lastName.trim();
    }
    if (params.email !== undefined) {
      user.email = params.email.toLowerCase();
      // Reset email verification when email changes
      user.isEmailVerified = false;
      user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationTokenExpiry = new Date();
      user.emailVerificationTokenExpiry.setHours(
        user.emailVerificationTokenExpiry.getHours() + 24,
      );
    }

    return this.userRepository.save(user);
  }

  /**
   * Update user password
   *
   * @param userId - User ID
   * @param newPassword - New plain text password
   * @returns Updated user entity
   */
  async updatePassword(userId: string, newPassword: string): Promise<User> {
    const user = await this.findById(userId);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, this.bcryptRounds);

    user.passwordHash = passwordHash;
    user.passwordResetToken = null;
    user.passwordResetTokenExpiry = null;

    return this.userRepository.save(user);
  }

  /**
   * Generate password reset token
   *
   * @param userId - User ID
   * @returns Updated user entity with reset token
   */
  async generatePasswordResetToken(userId: string): Promise<User> {
    const user = await this.findById(userId);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 2); // 2 hours expiry

    user.passwordResetToken = resetToken;
    user.passwordResetTokenExpiry = resetTokenExpiry;

    return this.userRepository.save(user);
  }

  /**
   * Verify email using verification token
   *
   * @param token - Email verification token
   * @returns Updated user entity
   * @throws NotFoundException if token is invalid or expired
   */
  async verifyEmail(token: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user || !user.isEmailVerificationTokenValid()) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiry = null;

    return this.userRepository.save(user);
  }

  /**
   * Reset password using reset token
   *
   * @param token - Password reset token
   * @param newPassword - New plain text password
   * @returns Updated user entity
   * @throws NotFoundException if token is invalid or expired
   */
  async resetPassword(token: string, newPassword: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: token },
    });

    if (!user || !user.isPasswordResetTokenValid()) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    return this.updatePassword(user.id, newPassword);
  }

  /**
   * Deactivate user account
   *
   * @param userId - User ID
   * @returns Updated user entity
   */
  async deactivateUser(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.isActive = false;
    return this.userRepository.save(user);
  }

  /**
   * Activate user account
   *
   * @param userId - User ID
   * @returns Updated user entity
   */
  async activateUser(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.isActive = true;
    return this.userRepository.save(user);
  }

  /**
   * Get user statistics
   *
   * @returns Object with user count statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    verified: number;
    byRole: Record<UserRole, number>;
  }> {
    const [total, active, verified, adminCount, moderatorCount, userCount] =
      await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ where: { isActive: true } }),
        this.userRepository.count({ where: { isEmailVerified: true } }),
        this.userRepository.count({ where: { role: 'admin' } }),
        this.userRepository.count({ where: { role: 'moderator' } }),
        this.userRepository.count({ where: { role: 'user' } }),
      ]);

    return {
      total,
      active,
      verified,
      byRole: {
        admin: adminCount,
        moderator: moderatorCount,
        user: userCount,
      },
    };
  }
}
