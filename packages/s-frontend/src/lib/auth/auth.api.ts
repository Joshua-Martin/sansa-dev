import { api } from '../api';
import type {
  SignUpRequest,
  SignInRequest,
  AuthResponse,
  UserProfileResponse,
  UpdateUserParams,
  TokenResponse,
  MessageResponse,
  UserStats,
} from '@sansa-dev/shared';

/**
 * Authentication API Service
 *
 * Provides secure, production-ready authentication functions for the frontend
 * that communicate with the NestJS backend auth endpoints.
 */
export class AuthApi {
  private static readonly AUTH_ENDPOINTS = {
    SIGNUP: '/api/v1/auth/signup',
    SIGNIN: '/api/v1/auth/signin',
    REFRESH: '/api/v1/auth/refresh',
    PROFILE: '/api/v1/auth/profile',
    LOGOUT: '/api/v1/auth/logout',
    VERIFY_EMAIL: '/api/v1/auth/verify-email',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    STATS: '/api/v1/auth/stats',
  } as const;

  /**
   * Register a new user account
   *
   * @param signUpRequest - User registration data
   * @returns Promise resolving to auth response with user and tokens
   * @throws BadRequestException if validation fails
   * @throws ConflictException if email already exists
   */
  static async signUp(signUpRequest: SignUpRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      this.AUTH_ENDPOINTS.SIGNUP,
      signUpRequest
    );

    // Store tokens after successful registration
    if (response.tokens) {
      api.tokens.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken
      );
    }

    return response;
  }

  /**
   * Authenticate user and return tokens
   *
   * @param signInRequest - User login credentials
   * @returns Promise resolving to auth response with user and tokens
   * @throws UnauthorizedException if credentials are invalid
   */
  static async signIn(signInRequest: SignInRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      this.AUTH_ENDPOINTS.SIGNIN,
      signInRequest
    );

    // Store tokens after successful authentication
    if (response.tokens) {
      api.tokens.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken
      );
    }

    return response;
  }

  /**
   * Refresh access token using refresh token
   *
   * @param refreshToken - JWT refresh token
   * @returns Promise resolving to new token pair
   * @throws UnauthorizedException if refresh token is invalid
   */
  static async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>(
      this.AUTH_ENDPOINTS.REFRESH,
      { refreshToken }
    );

    // Update stored tokens
    api.tokens.setTokens(response.accessToken, response.refreshToken);

    return response;
  }

  /**
   * Get current user profile
   *
   * @returns Promise resolving to user profile data
   * @throws UnauthorizedException if not authenticated
   */
  static async getProfile(): Promise<UserProfileResponse> {
    return api.get<UserProfileResponse>(this.AUTH_ENDPOINTS.PROFILE);
  }

  /**
   * Update current user profile
   *
   * @param updateParams - Profile update data
   * @returns Promise resolving to updated user profile
   * @throws UnauthorizedException if not authenticated
   * @throws ConflictException if email already exists
   */
  static async updateProfile(
    updateParams: UpdateUserParams
  ): Promise<UserProfileResponse> {
    return api.put<UserProfileResponse>(
      this.AUTH_ENDPOINTS.PROFILE,
      updateParams
    );
  }

  /**
   * Verify email address using verification token
   *
   * @param token - Email verification token
   * @returns Promise resolving to success message
   * @throws NotFoundException if token is invalid or expired
   */
  static async verifyEmail(token: string): Promise<MessageResponse> {
    return api.get<MessageResponse>(
      `${this.AUTH_ENDPOINTS.VERIFY_EMAIL}/${token}`
    );
  }

  /**
   * Request password reset link
   *
   * @param email - User email address
   * @returns Promise resolving to message (doesn't reveal if email exists)
   */
  static async requestPasswordReset(email: string): Promise<MessageResponse> {
    return api.post<MessageResponse>(this.AUTH_ENDPOINTS.FORGOT_PASSWORD, {
      email,
    });
  }

  /**
   * Reset password using reset token
   *
   * @param token - Password reset token
   * @param newPassword - New password
   * @returns Promise resolving to success message
   * @throws NotFoundException if token is invalid or expired
   * @throws BadRequestException if password is too weak
   */
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<MessageResponse> {
    return api.post<MessageResponse>(this.AUTH_ENDPOINTS.RESET_PASSWORD, {
      token,
      newPassword,
    });
  }

  /**
   * Logout current user
   *
   * @returns Promise resolving to logout message
   * @throws UnauthorizedException if not authenticated
   */
  static async logout(): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(
      this.AUTH_ENDPOINTS.LOGOUT
    );

    // Clear stored tokens after successful logout
    api.tokens.clearTokens();

    return response;
  }

  /**
   * Get user statistics (admin only)
   *
   * @returns Promise resolving to user statistics
   * @throws UnauthorizedException if not authenticated
   * @throws ForbiddenException if not admin
   */
  static async getUserStats(): Promise<UserStats> {
    return api.get<UserStats>(this.AUTH_ENDPOINTS.STATS);
  }

  /**
   * Check if user is currently authenticated
   *
   * @returns boolean indicating authentication status
   */
  static isAuthenticated(): boolean {
    return api.tokens.hasTokens();
  }

  /**
   * Clear authentication state (logout locally)
   *
   * This method clears tokens without calling the server logout endpoint.
   * Use this for client-side logout or when server logout fails.
   */
  static clearAuthState(): void {
    api.tokens.clearTokens();
  }

  /**
   * Get current access token
   *
   * @returns Access token string or null if not authenticated
   */
  static getAccessToken(): string | null {
    return api.tokens.getAccessToken();
  }

  /**
   * Get current refresh token
   *
   * @returns Refresh token string or null if not authenticated
   */
  static getRefreshToken(): string | null {
    return api.tokens.getRefreshToken();
  }
}

/**
 * Convenience functions for common auth operations
 */
export const authApi = {
  // Authentication
  signUp: AuthApi.signUp.bind(AuthApi),
  signIn: AuthApi.signIn.bind(AuthApi),
  logout: AuthApi.logout.bind(AuthApi),

  // Token management
  refreshTokens: AuthApi.refreshTokens.bind(AuthApi),
  isAuthenticated: AuthApi.isAuthenticated.bind(AuthApi),
  clearAuthState: AuthApi.clearAuthState.bind(AuthApi),

  // Profile management
  getProfile: AuthApi.getProfile.bind(AuthApi),
  updateProfile: AuthApi.updateProfile.bind(AuthApi),

  // Email verification
  verifyEmail: AuthApi.verifyEmail.bind(AuthApi),

  // Password reset
  requestPasswordReset: AuthApi.requestPasswordReset.bind(AuthApi),
  resetPassword: AuthApi.resetPassword.bind(AuthApi),

  // Admin functions
  getUserStats: AuthApi.getUserStats.bind(AuthApi),

  // Token access
  getAccessToken: AuthApi.getAccessToken.bind(AuthApi),
  getRefreshToken: AuthApi.getRefreshToken.bind(AuthApi),
};

/**
 * Export default for convenience
 */
export default authApi;
