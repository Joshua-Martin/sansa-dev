/**
 * Shared authentication types for frontend and backend
 *
 * These types ensure consistency across the application stack
 * and enable type-safe communication between client and server.
 */

/**
 * User role definitions
 */
export type UserRole = 'admin' | 'moderator' | 'user';

/**
 * Sign up request payload
 */
export interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Sign in request payload
 */
export interface SignInRequest {
  email: string;
  password: string;
}

/**
 * Token refresh request payload
 */
export interface TokenRefreshRequest {
  refreshToken: string;
}

/**
 * Password reset request payload
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation payload
 */
export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

/**
 * Update profile request payload
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * User profile response (public user data)
 */
export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  appId: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Complete authentication response
 */
export interface AuthResponse {
  user: UserProfileResponse;
  tokens: AuthTokens;
}

/**
 * Token response for refresh operations
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Standard message response
 */
export interface MessageResponse {
  message: string;
}

/**
 * Principal (authenticated user context)
 */
export interface Principal {
  userId: string;
  email: string;
  role: UserRole;
  appId: string;
  isEmailVerified: boolean;
  isActive: boolean;
}

/**
 * User statistics (admin only)
 */
export interface UserStats {
  total: number;
  active: number;
  verified: number;
  byRole: Record<UserRole, number>;
}

/**
 * Email verification response
 */
export interface EmailVerificationResponse {
  message: string;
  isVerified: boolean;
}

/**
 * Password strength requirements
 */
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

/**
 * User creation parameters (internal use)
 */
export interface CreateUserParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

/**
 * User update parameters (internal use)
 */
export interface UpdateUserParams {
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * Authentication error types
 */
export type AuthErrorType =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_DEACTIVATED'
  | 'EMAIL_NOT_VERIFIED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_EMAIL'
  | 'ACCOUNT_NOT_FOUND'
  | 'PASSWORD_RESET_EXPIRED'
  | 'EMAIL_VERIFICATION_EXPIRED';

/**
 * Authentication error response
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: Record<string, string | number | boolean>;
}

/**
 * Session information
 */
export interface SessionInfo {
  userId: string;
  email: string;
  role: UserRole;
  issuedAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * API Key creation request
 */
export interface CreateApiKeyRequest {
  name: string;
  expiresAt?: Date;
}

/**
 * API Key response (includes the secret key - only shown on creation)
 */
export interface ApiKeyResponse {
  id: string;
  name: string;
  key: string; // Only included in creation response
  isActive: boolean;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  lastUsedIp: string | null;
  requestCount: number;
  createdAt: Date;
}

/**
 * API Key list item (without the secret key)
 */
export interface ApiKeyListItem {
  id: string;
  name: string;
  isActive: boolean;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  lastUsedIp: string | null;
  requestCount: number;
  createdAt: Date;
}
