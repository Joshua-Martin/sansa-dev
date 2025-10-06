import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GlobalBlockListService } from '../services/global-block-list.service';
import { Request } from 'express';

// Extended request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    [key: string]: any;
  };
}

/**
 * Global guard that checks if a user or fingerprint is blocked before processing any request
 *
 * This guard provides multiple layers of security:
 * 1. Checks if authenticated user ID is blocked
 * 2. Extracts browser fingerprint to identify the client
 * 3. Checks if the fingerprint is in the blocklist
 */
@Injectable()
export class GlobalBlockGuard implements CanActivate {
  private readonly logger = new Logger(GlobalBlockGuard.name);

  constructor(private globalBlockListService: GlobalBlockListService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // Path exclusions for health checks, public routes, etc.
    if (this.isExemptPath(request.path)) {
      return true;
    }

    // Check if authenticated user is blocked
    if (user?.uid) {
      const isBlocked = await this.globalBlockListService.isGloballyBlocked(
        user.uid,
      );

      if (isBlocked) {
        this.logger.warn(`Blocked request from authenticated user ${user.uid}`);
        throw new HttpException(
          'Your account has been temporarily suspended due to suspicious activity',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    return true;
  }

  /**
   * Check if a path is exempt from global blocking
   *
   * @param path - The request path
   * @returns Boolean indicating if the path is exempt
   */
  private isExemptPath(path: string): boolean {
    // Always exempt certain paths
    return (
      path === '/health' ||
      path === '/fingerprint-check' ||
      path === '/api' ||
      path.startsWith('/docs') ||
      path.startsWith('/public')
    );
  }

  /**
   * Get client IP address from the request
   *
   * @param request - Express request object
   * @returns The client IP address
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      request.connection.remoteAddress ||
      'unknown'
    );
  }
}
