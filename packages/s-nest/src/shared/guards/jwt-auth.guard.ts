import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '../auth/jwt.service';
import { Principal } from '@sansa-dev/s-shared';

/**
 * Custom request interface with user principal
 */
export interface AuthenticatedRequest extends Request {
  user: Principal;
}

/**
 * Metadata key for marking routes as public (no auth required)
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark routes as public (skip authentication)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * JWT Authentication Guard
 *
 * Validates JWT tokens from Authorization header and injects
 * user principal into request context for authenticated routes.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  /**
   * Determine if the request can proceed based on authentication
   *
   * @param context - Execution context
   * @returns True if request is authorized
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    try {
      // Extract token from Authorization header
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedException('Authorization header is required');
      }

      const token = this.jwtService.extractTokenFromHeader(authHeader);

      // Validate token and get user principal
      const principal = await this.authService.validateToken(token);

      // Attach principal to request
      request.user = principal;

      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(
          `Authentication successful for user: ${principal.userId}`,
        );
      }
      return true;
    } catch (error) {
      this.logger.debug(
        `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
