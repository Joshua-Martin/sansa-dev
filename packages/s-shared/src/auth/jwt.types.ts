import { UserRole } from './auth.types';

/**
 * Shared JWT types for frontend and backend
 *
 * These types define the structure of JWT tokens and related
 * authentication mechanisms used across the application.
 */

/**
 * JWT payload structure (matches RFC 7519 standard claims)
 */
export interface JwtPayload {
  /** Subject (User ID) */
  sub: string;
  /** User email */
  email: string;
  /** User role */
  role: UserRole;
  /** Issued at (timestamp) */
  iat: number;
  /** Expires at (timestamp) */
  exp: number;
  /** Issuer */
  iss: string;
  /** Audience */
  aud: string;
  /** Token type (access or refresh) */
  type?: 'access' | 'refresh';
  /** JWT ID (unique identifier for the token) */
  jti?: string;
}

/**
 * Decoded JWT token structure
 */
export interface DecodedToken {
  header: {
    alg: string;
    typ: string;
  };
  payload: JwtPayload;
  signature: string;
}

/**
 * JWT header structure
 */
export interface JwtHeader {
  /** Algorithm used for signing */
  alg: string;
  /** Token type */
  typ: string;
  /** Key ID (optional) */
  kid?: string;
}

/**
 * JWT token configuration
 */
export interface JwtConfig {
  /** Secret key for signing tokens */
  secret: string;
  /** Access token expiration time */
  accessTokenExpiresIn: string;
  /** Refresh token expiration time */
  refreshTokenExpiresIn: string;
  /** Token issuer */
  issuer?: string;
  /** Token audience */
  audience?: string;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  /** Whether the token is valid */
  isValid: boolean;
  /** Decoded payload if valid */
  payload?: JwtPayload;
  /** Error message if invalid */
  error?: string;
  /** Error type */
  errorType?:
    | 'EXPIRED'
    | 'INVALID_SIGNATURE'
    | 'MALFORMED'
    | 'INVALID_ISSUER'
    | 'INVALID_AUDIENCE';
}

/**
 * Token generation options
 */
export interface TokenGenerationOptions {
  /** User ID */
  userId: string;
  /** User email */
  email: string;
  /** User role */
  role: UserRole;
  /** Custom expiration time (overrides default) */
  expiresIn?: string;
  /** Additional claims */
  additionalClaims?: Record<string, string | number | boolean>;
}

/**
 * Token pair (access + refresh)
 */
export interface TokenPair {
  /** Access token for API requests */
  accessToken: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
  /** Access token expiration in seconds */
  expiresIn: number;
  /** Token type (always 'Bearer') */
  tokenType?: string;
}

/**
 * Refresh token entity data
 */
export interface RefreshTokenData {
  /** Unique token ID */
  id: string;
  /** Token string */
  token: string;
  /** User ID this token belongs to */
  userId: string;
  /** Expiration date */
  expiresAt: Date;
  /** Whether the token is revoked */
  isRevoked: boolean;
  /** IP address where token was created */
  ipAddress?: string;
  /** User agent where token was created */
  userAgent?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
}

/**
 * Token blacklist entry
 */
export interface TokenBlacklistEntry {
  /** JWT ID */
  jti: string;
  /** Token expiration time */
  expiresAt: Date;
  /** Reason for blacklisting */
  reason:
    | 'LOGOUT'
    | 'PASSWORD_CHANGE'
    | 'SECURITY_BREACH'
    | 'MANUAL_REVOCATION';
  /** When the token was blacklisted */
  blacklistedAt: Date;
}

/**
 * Authorization header structure
 */
export interface AuthorizationHeader {
  /** Authorization scheme (should be 'Bearer') */
  scheme: string;
  /** JWT token */
  token: string;
}

/**
 * Token extraction result from request headers
 */
export interface TokenExtractionResult {
  /** Whether token was found */
  found: boolean;
  /** Extracted token if found */
  token?: string;
  /** Error message if not found or invalid format */
  error?: string;
}
