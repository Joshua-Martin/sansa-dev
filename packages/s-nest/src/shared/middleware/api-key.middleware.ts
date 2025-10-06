import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../database/services/api-key.service';

/**
 * Extended Request interface to include API key authentication data
 */
export interface ApiKeyAuthenticatedRequest extends Request {
  user: {
    id: string;
    appId: string;
    email: string;
  };
  apiKey: {
    id: string;
    name: string;
  };
}

/**
 * Middleware for authenticating requests using API keys
 *
 * This middleware extracts API keys from the Authorization header
 * and validates them against the database. It attaches user and API key
 * information to the request object for use in controllers.
 */
@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiKeyMiddleware.name);

  constructor(private readonly apiKeyService: ApiKeyService) {}

  /**
   * Middleware function to authenticate API key requests
   */
  async use(
    req: ApiKeyAuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Extract API key from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedException('Authorization header is required');
      }

      // Expect format: "Bearer <api_key>"
      const [scheme, token] = authHeader.split(' ');

      if (scheme.toLowerCase() !== 'bearer' || !token) {
        throw new UnauthorizedException(
          'Invalid authorization header format. Expected: Bearer <api_key>',
        );
      }

      // Get client IP for usage tracking
      const clientIp = this.getClientIp(req);

      // Validate API key
      const { user, apiKey } = await this.apiKeyService.validateApiKey(
        token,
        clientIp,
      );

      // Attach user and API key info to request
      req.user = {
        id: user.id,
        appId: user.appId,
        email: user.email,
      };

      req.apiKey = {
        id: apiKey.id,
        name: apiKey.name,
      };

      this.logger.debug(
        `API key authenticated: user=${user.id}, appId=${user.appId}, key=${apiKey.name}`,
      );

      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`API key authentication failed: ${errorMessage}`);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Wrap other errors as unauthorized
      throw new UnauthorizedException('Invalid API key');
    }
  }

  /**
   * Extract client IP address from request
   */
  private getClientIp(req: Request): string | undefined {
    // Check for forwarded headers (useful behind proxies/load balancers)
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
      // Take the first IP if multiple are present
      return forwardedFor.split(',')[0].trim();
    }

    // Check for other proxy headers
    const realIp = req.headers['x-real-ip'] as string;
    if (realIp) {
      return realIp;
    }

    // Fall back to connection remote address
    return req.socket.remoteAddress;
  }
}
