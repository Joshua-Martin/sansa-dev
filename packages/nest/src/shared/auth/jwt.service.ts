import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { JwtPayload, DecodedToken, UserRole } from '@sansa-dev/shared';

/**
 * JWT Service for token management
 *
 * Handles JWT token creation, validation, and parsing using built-in crypto
 * without external dependencies for security and performance.
 */
@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private readonly algorithm = 'HS256';
  private readonly issuer = 'prompt-training-auth';
  private readonly audience = 'prompt-training-app';

  constructor(private configService: ConfigService) {}

  /**
   * Get JWT secret from environment
   */
  private getSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return secret;
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(data: string): string {
    return Buffer.from(data, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(data: string): string {
    // Add padding if needed
    const padding = '='.repeat((4 - (data.length % 4)) % 4);
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/') + padding;
    return Buffer.from(base64, 'base64').toString();
  }

  /**
   * Create HMAC signature
   */
  private createSignature(data: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate access token
   *
   * @param userId - User ID
   * @param email - User email
   * @param role - User role
   * @returns JWT access token
   */
  generateAccessToken(userId: string, email: string, role: UserRole): string {
    const now = Math.floor(Date.now() / 1000);
    const expirationTime = now + 15 * 60; // 15 minutes

    const header = {
      alg: this.algorithm,
      typ: 'JWT',
    };

    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
      iat: now,
      exp: expirationTime,
      iss: this.issuer,
      aud: this.audience,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = this.createSignature(data, this.getSecret());

    return `${data}.${signature}`;
  }

  /**
   * Generate refresh token
   *
   * @param userId - User ID
   * @param email - User email
   * @param role - User role
   * @returns JWT refresh token
   */
  generateRefreshToken(userId: string, email: string, role: UserRole): string {
    const now = Math.floor(Date.now() / 1000);
    const expirationTime = now + 7 * 24 * 60 * 60; // 7 days

    const header = {
      alg: this.algorithm,
      typ: 'JWT',
    };

    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
      iat: now,
      exp: expirationTime,
      iss: this.issuer,
      aud: this.audience,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = this.createSignature(data, this.getSecret());

    return `${data}.${signature}`;
  }

  /**
   * Decode JWT token without verification
   *
   * @param token - JWT token
   * @returns Decoded token parts
   */
  private decodeToken(token: string): DecodedToken {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const header = JSON.parse(this.base64UrlDecode(parts[0]));
      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      const signature = parts[2];

      return { header, payload, signature };
    } catch (error) {
      this.logger.error('Failed to decode token:', error);
      throw new UnauthorizedException('Invalid token format');
    }
  }

  /**
   * Verify JWT token signature and expiration
   *
   * @param token - JWT token to verify
   * @returns JWT payload if valid
   * @throws UnauthorizedException if token is invalid
   */
  verifyToken(token: string): JwtPayload {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedException('Invalid token format');
      }

      const [encodedHeader, encodedPayload, signature] = parts;
      const data = `${encodedHeader}.${encodedPayload}`;
      const expectedSignature = this.createSignature(data, this.getSecret());

      // Verify signature
      if (signature !== expectedSignature) {
        throw new UnauthorizedException('Invalid token signature');
      }

      // Decode payload
      const decoded = this.decodeToken(token);
      const payload = decoded.payload;

      // Verify expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new UnauthorizedException('Token has expired');
      }

      // Verify issuer and audience
      if (payload.iss !== this.issuer) {
        throw new UnauthorizedException('Invalid token issuer');
      }

      if (payload.aud !== this.audience) {
        throw new UnauthorizedException('Invalid token audience');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Token verification failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Extract token from Authorization header
   *
   * @param authHeader - Authorization header value
   * @returns JWT token string
   * @throws UnauthorizedException if header format is invalid
   */
  extractTokenFromHeader(authHeader: string): string {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    return parts[1];
  }

  /**
   * Get token expiration time
   *
   * @param token - JWT token
   * @returns Expiration timestamp
   */
  getTokenExpiration(token: string): number {
    const decoded = this.decodeToken(token);
    return decoded.payload.exp;
  }

  /**
   * Check if token is expired
   *
   * @param token - JWT token
   * @returns True if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const exp = this.getTokenExpiration(token);
      const now = Math.floor(Date.now() / 1000);
      return exp < now;
    } catch {
      return true;
    }
  }

  /**
   * Generate token pair (access + refresh)
   *
   * @param userId - User ID
   * @param email - User email
   * @param role - User role
   * @returns Object with access and refresh tokens
   */
  generateTokenPair(
    userId: string,
    email: string,
    role: UserRole,
  ): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    const accessToken = this.generateAccessToken(userId, email, role);
    const refreshToken = this.generateRefreshToken(userId, email, role);
    const expiresIn = 15 * 60; // 15 minutes in seconds

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }
}
