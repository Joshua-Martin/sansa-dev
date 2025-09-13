import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UserService } from '../database/services/user.service';
import { JwtService } from './jwt.service';
import { User } from '../database/entities/user.entity';
import {
  SignUpRequest,
  SignInRequest,
  UserProfileResponse,
  AuthResponse,
  Principal,
  CreateUserParams,
} from '@sansa-dev/shared';

/**
 * Authentication Service
 *
 * Handles user authentication, registration, token management,
 * and session management operations.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   *
   * @param signUpRequest - User registration data
   * @returns Authentication response with user and tokens
   * @throws BadRequestException if validation fails
   */
  async signUp(signUpRequest: SignUpRequest): Promise<AuthResponse> {
    this.logger.log(`Sign up attempt for email: ${signUpRequest.email}`);

    // Validate input
    this.validateSignUpRequest(signUpRequest);

    try {
      // Create user
      const createUserParams: CreateUserParams = {
        email: signUpRequest.email,
        password: signUpRequest.password,
        firstName: signUpRequest.firstName,
        lastName: signUpRequest.lastName,
      };

      const user = await this.userService.createUser(createUserParams);

      // Generate tokens
      const tokens = this.jwtService.generateTokenPair(
        user.id,
        user.email,
        user.role,
      );

      this.logger.log(`User successfully registered: ${user.id}`);

      return {
        user: this.transformUserToProfileResponse(user),
        tokens,
      };
    } catch (error) {
      this.logger.error(
        `Sign up failed for email ${signUpRequest.email}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Authenticate user and generate tokens
   *
   * @param signInRequest - User login credentials
   * @returns Authentication response with user and tokens
   * @throws UnauthorizedException if credentials are invalid
   */
  async signIn(signInRequest: SignInRequest): Promise<AuthResponse> {
    this.logger.log(`Sign in attempt for email: ${signInRequest.email}`);

    // Validate input
    this.validateSignInRequest(signInRequest);

    try {
      // Find user by email
      const user = await this.userService.findByEmail(signInRequest.email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Validate password
      const isPasswordValid = await this.userService.validatePassword(
        user,
        signInRequest.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Update last login
      const updatedUser = await this.userService.updateLastLogin(user.id);

      // Generate tokens
      const tokens = this.jwtService.generateTokenPair(
        updatedUser.id,
        updatedUser.email,
        updatedUser.role,
      );

      this.logger.log(`User successfully signed in: ${updatedUser.id}`);

      return {
        user: this.transformUserToProfileResponse(updatedUser),
        tokens,
      };
    } catch (error) {
      this.logger.error(
        `Sign in failed for email ${signInRequest.email}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Refresh access token using valid refresh token
   *
   * @param refreshToken - JWT refresh token
   * @returns New token pair
   * @throws UnauthorizedException if refresh token is invalid
   */
  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    this.logger.log('Token refresh attempt');

    try {
      // Verify refresh token
      const payload = this.jwtService.verifyToken(refreshToken);

      // Get user to ensure they still exist and are active
      const user = await this.userService.findById(payload.sub);
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Generate new token pair
      const tokens = this.jwtService.generateTokenPair(
        user.id,
        user.email,
        user.role,
      );

      this.logger.log(`Tokens refreshed for user: ${user.id}`);

      return tokens;
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Validate and extract principal from JWT token
   *
   * @param token - JWT access token
   * @returns Principal object
   * @throws UnauthorizedException if token is invalid
   */
  async validateToken(token: string): Promise<Principal> {
    try {
      // Verify JWT token
      const payload = this.jwtService.verifyToken(token);

      // Get user to ensure they still exist and are active
      const user = await this.userService.findById(payload.sub);
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
      };
    } catch (error) {
      this.logger.error('Token validation failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Get user profile from JWT token
   *
   * @param token - JWT access token
   * @returns User profile
   * @throws UnauthorizedException if token is invalid
   */
  async getProfile(token: string): Promise<User> {
    const payload = this.jwtService.verifyToken(token);
    return this.userService.findById(payload.sub);
  }

  /**
   * Verify email using verification token
   *
   * @param token - Email verification token
   * @returns Updated user entity
   */
  async verifyEmail(token: string): Promise<User> {
    this.logger.log(
      `Email verification attempt with token: ${token.substring(0, 8)}...`,
    );

    try {
      const user = await this.userService.verifyEmail(token);
      this.logger.log(`Email verified for user: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   *
   * @param email - User email address
   * @returns Success message (doesn't reveal if email exists)
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    this.logger.log(`Password reset requested for email: ${email}`);

    try {
      const user = await this.userService.findByEmail(email);
      if (user && user.isActive) {
        await this.userService.generatePasswordResetToken(user.id);
      }

      // Always return success to prevent email enumeration
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (error) {
      this.logger.error(
        `Password reset request failed for email ${email}:`,
        error,
      );
      // Still return success to prevent email enumeration
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }
  }

  /**
   * Reset password using reset token
   *
   * @param token - Password reset token
   * @param newPassword - New password
   * @returns Success message
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Password reset attempt with token: ${token.substring(0, 8)}...`,
    );

    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    try {
      const user = await this.userService.resetPassword(token, newPassword);
      this.logger.log(`Password reset successfully for user: ${user.id}`);
      return { message: 'Password has been reset successfully' };
    } catch (error) {
      this.logger.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Validate sign up request
   */
  private validateSignUpRequest(request: SignUpRequest): void {
    if (!request.email || !request.email.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }

    if (!request.password || request.password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    if (!request.firstName || request.firstName.trim().length === 0) {
      throw new BadRequestException('First name is required');
    }

    if (!request.lastName || request.lastName.trim().length === 0) {
      throw new BadRequestException('Last name is required');
    }
  }

  /**
   * Validate sign in request
   */
  private validateSignInRequest(request: SignInRequest): void {
    if (!request.email || !request.email.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }

    if (!request.password) {
      throw new BadRequestException('Password is required');
    }
  }

  /**
   * Transform User entity to UserProfileResponse format
   */
  private transformUserToProfileResponse(user: User): UserProfileResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
