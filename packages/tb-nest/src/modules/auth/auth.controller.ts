import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpStatus,
  UseGuards,
  Logger,
  Param,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from '../../shared/auth/auth.service';
import { UserService } from '../../shared/database/services/user.service';
import {
  SignUpRequest,
  SignInRequest,
  AuthResponse,
  UserProfileResponse,
  UpdateUserParams,
} from '../../../../tb-shared/src';
import {
  JwtAuthGuard,
  AuthenticatedRequest,
} from '../../shared/guards/jwt-auth.guard';
import { RbacGuard, RequireRoles } from '../../shared/guards/rbac.guard';
import { Public } from '../../shared/guards/jwt-auth.guard';

/**
 * Response DTOs
 */
class ApiSignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

class ApiSignInRequest {
  email: string;
  password: string;
}

class ApiTokenRefreshRequest {
  refreshToken: string;
}

class ApiPasswordResetRequest {
  email: string;
}

class ApiPasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

class ApiUpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

class ApiAuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
    isEmailVerified: boolean;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

class ApiUserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

class ApiTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class ApiMessageResponse {
  message: string;
}

/**
 * Authentication Controller
 *
 * Handles user authentication, registration, profile management,
 * and token operations via REST API endpoints.
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  /**
   * Register a new user account
   */
  @Post('signup')
  @Public()
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: ApiSignUpRequest })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
    type: ApiAuthResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  async signUp(@Body() signUpRequest: SignUpRequest): Promise<AuthResponse> {
    this.logger.log(`Sign up request for email: ${signUpRequest.email}`);
    return this.authService.signUp(signUpRequest);
  }

  /**
   * Authenticate user and return tokens
   */
  @Post('signin')
  @Public()
  @ApiOperation({ summary: 'Authenticate user and return access tokens' })
  @ApiBody({ type: ApiSignInRequest })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully authenticated',
    type: ApiAuthResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async signIn(@Body() signInRequest: SignInRequest): Promise<AuthResponse> {
    this.logger.log(`Sign in request for email: ${signInRequest.email}`);
    return this.authService.signIn(signInRequest);
  }

  /**
   * Refresh access token using refresh token
   */
  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: ApiTokenRefreshRequest })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens successfully refreshed',
    type: ApiTokenResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token',
  })
  async refreshTokens(@Body('refreshToken') refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    this.logger.log('Token refresh request');
    return this.authService.refreshTokens(refreshToken);
  }

  /**
   * Get current user profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: ApiUserProfileResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async getProfile(
    @Req() request: AuthenticatedRequest,
  ): Promise<UserProfileResponse> {
    const user = await this.userService.findById(request.user.userId);
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

  /**
   * Update user profile
   */
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: ApiUpdateProfileRequest })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: ApiUserProfileResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() updateParams: UpdateUserParams,
  ): Promise<UserProfileResponse> {
    const updatedUser = await this.userService.updateProfile(
      request.user.userId,
      updateParams,
    );
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      isEmailVerified: updatedUser.isEmailVerified,
      isActive: updatedUser.isActive,
      lastLoginAt: updatedUser.lastLoginAt
        ? updatedUser.lastLoginAt.toISOString()
        : null,
      createdAt: updatedUser.createdAt.toISOString(),
    };
  }

  /**
   * Verify email address
   */
  @Get('verify-email/:token')
  @Public()
  @ApiOperation({ summary: 'Verify email address using verification token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
    type: ApiMessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invalid or expired token',
  })
  async verifyEmail(
    @Param('token') token: string,
  ): Promise<{ message: string }> {
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }

  /**
   * Request password reset
   */
  @Post('forgot-password')
  @Public()
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiBody({ type: ApiPasswordResetRequest })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset link sent if account exists',
    type: ApiMessageResponse,
  })
  async requestPasswordReset(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(email);
  }

  /**
   * Reset password using reset token
   */
  @Post('reset-password')
  @Public()
  @ApiOperation({ summary: 'Reset password using reset token' })
  @ApiBody({ type: ApiPasswordResetConfirmRequest })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
    type: ApiMessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invalid or expired token',
  })
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(token, newPassword);
  }

  /**
   * Get user statistics (admin only)
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRoles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user statistics (admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin access required',
  })
  async getUserStats(): Promise<{
    total: number;
    active: number;
    verified: number;
    byRole: Record<string, number>;
  }> {
    return this.userService.getUserStats();
  }

  /**
   * Logout (placeholder - client should discard tokens)
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout current user',
    description: 'Client should discard tokens after calling this endpoint',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully logged out',
    type: ApiMessageResponse,
  })
  async logout(
    @Req() request: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    this.logger.log(`User logged out: ${request.user.userId}`);

    // In a production system, you might want to:
    // 1. Add token to a blacklist
    // 2. Revoke refresh tokens in database
    // 3. Clear any server-side sessions

    return { message: 'Successfully logged out' };
  }
}
