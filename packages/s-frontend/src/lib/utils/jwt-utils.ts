/**
 * Client-side JWT utilities for token validation and expiration checking
 *
 * IMPORTANT: This is for client-side UX only. Server-side validation is still required
 * for security as client-side validation can be bypassed.
 */

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  type?: 'access' | 'refresh';
  jti?: string;
}

/**
 * Client-side JWT utility functions
 * Provides basic validation without cryptographic verification
 */
export class JwtUtils {
  /**
   * Decode JWT payload without cryptographic verification
   * Only for client-side UX - server must verify signatures
   */
  static decodePayload(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.warn('Failed to decode JWT payload:', error);
      return null;
    }
  }

  /**
   * Check if token is expired (with optional buffer time)
   * @param token - JWT token string
   * @param bufferSeconds - Buffer time before expiration (default: 30 seconds)
   */
  static isTokenExpired(token: string, bufferSeconds: number = 30): boolean {
    const payload = this.decodePayload(token);
    if (!payload) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp - bufferSeconds <= now;
  }

  /**
   * Get time until token expires (in seconds)
   * @param token - JWT token string
   * @returns Seconds until expiration (0 if expired or invalid)
   */
  static getTimeUntilExpiry(token: string): number {
    const payload = this.decodePayload(token);
    if (!payload) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  }

  /**
   * Check if token is valid format and not expired
   * @param token - JWT token string
   * @param bufferSeconds - Buffer time before expiration (default: 30 seconds)
   */
  static isTokenValid(token: string, bufferSeconds: number = 30): boolean {
    if (!token || typeof token !== 'string') return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    return !this.isTokenExpired(token, bufferSeconds);
  }

  /**
   * Get token type from payload
   * @param token - JWT token string
   */
  static getTokenType(token: string): 'access' | 'refresh' | null {
    const payload = this.decodePayload(token);
    return payload?.type || null;
  }

  /**
   * Check if token is an access token
   * @param token - JWT token string
   */
  static isAccessToken(token: string): boolean {
    return this.getTokenType(token) === 'access';
  }

  /**
   * Check if token is a refresh token
   * @param token - JWT token string
   */
  static isRefreshToken(token: string): boolean {
    return this.getTokenType(token) === 'refresh';
  }

  /**
   * Get user ID from token payload
   * @param token - JWT token string
   */
  static getUserId(token: string): string | null {
    const payload = this.decodePayload(token);
    return payload?.sub || null;
  }

  /**
   * Get user email from token payload
   * @param token - JWT token string
   */
  static getUserEmail(token: string): string | null {
    const payload = this.decodePayload(token);
    return payload?.email || null;
  }

  /**
   * Get user role from token payload
   * @param token - JWT token string
   */
  static getUserRole(token: string): string | null {
    const payload = this.decodePayload(token);
    return payload?.role || null;
  }

  /**
   * Get token issuer from payload
   * @param token - JWT token string
   */
  static getIssuer(token: string): string | null {
    const payload = this.decodePayload(token);
    return payload?.iss || null;
  }

  /**
   * Validate basic token structure and claims
   * @param token - JWT token string
   * @param expectedIssuer - Expected issuer (optional)
   * @param expectedAudience - Expected audience (optional)
   */
  static validateTokenStructure(
    token: string,
    expectedIssuer?: string,
    expectedAudience?: string
  ): { isValid: boolean; error?: string } {
    const payload = this.decodePayload(token);
    if (!payload) {
      return { isValid: false, error: 'Invalid token format' };
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      return { isValid: false, error: 'Token expired' };
    }

    // Check issuer if provided
    if (expectedIssuer && payload.iss !== expectedIssuer) {
      return { isValid: false, error: 'Invalid token issuer' };
    }

    // Check audience if provided
    if (expectedAudience && payload.aud !== expectedAudience) {
      return { isValid: false, error: 'Invalid token audience' };
    }

    return { isValid: true };
  }
}
