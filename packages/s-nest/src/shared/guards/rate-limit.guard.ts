import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GlobalBlockListService } from '../services/global-block-list.service';
import { RedisService } from '../redis/redis.service';
import { Request } from 'express';

// Extended request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    [key: string]: any;
  };
}

/**
 * Guard that implements multi-window rate limiting using Redis and browser fingerprinting
 *
 * Supports multiple time windows for more granular control and uses
 * browser fingerprinting for more accurate client identification
 * alongside standard authentication.
 */
@Injectable()
export class RateLimitGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly BLOCK_DURATION = 300; // 5 minutes block in seconds

  constructor(
    private configService: ConfigService,
    private globalBlockListService: GlobalBlockListService,
    private redisService: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Redis client is now managed by RedisService
    // No need to initialize a new connection here
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse();
    const user = request.user;
    const endpoint = request.route.path;
    const redis = this.redisService.getClient();

    // Get or create client identifier, preferring authenticated user if available
    let clientId: string;

    if (user && user.uid) {
      // Use authenticated user ID
      clientId = user.uid;
    }

    // Check if client is blocked
    const blockKey = `ratelimit:blocked:${clientId}:${endpoint}`;
    const isBlocked = await redis.get(blockKey);

    if (isBlocked) {
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const limits = this.getEndpointLimits(endpoint);
    const pipeline = redis.pipeline();
    const keys = limits.map(
      (limit) => `ratelimit:${clientId}:${endpoint}:${limit.windowMs}`,
    );

    keys.forEach((key) => pipeline.incr(key));
    const results = await pipeline.exec();

    // Check each window's limits
    for (let i = 0; i < limits.length; i++) {
      const current = results[i][1] as number;
      const limit = limits[i];

      if (current === 1) {
        await redis.expire(keys[i], limit.windowMs / 1000);
      }

      // Add rate limit headers
      response.header('X-RateLimit-Limit', limit.maxRequests.toString());
      response.header(
        'X-RateLimit-Remaining',
        Math.max(0, limit.maxRequests - current).toString(),
      );
      response.header(
        'X-RateLimit-Reset',
        (Date.now() + limit.windowMs).toString(),
      );

      // If limit exceeded by more than 50%, add a strike and block
      if (current > limit.maxRequests * 1.5) {
        // If it's an authenticated user, add a strike to their account
        if (user?.uid) {
          await this.globalBlockListService.addStrike(user.uid);
        }

        throw new HttpException(
          'Too Many Requests',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Regular rate limit exceeded
      if (current > limit.maxRequests) {
        throw new HttpException(
          'Too Many Requests',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return true;
  }

  private getEndpointLimits(
    endpoint: string,
  ): Array<{ maxRequests: number; windowMs: number }> {
    switch (endpoint) {
      case '/schedule-mod/init':
        return [
          { maxRequests: 2, windowMs: 1000 }, // 2 requests per second
          { maxRequests: 5, windowMs: 60000 }, // 5 requests per minute
          { maxRequests: 20, windowMs: 3600000 }, // 20 requests per hour
        ];
      case '/schedule-mod/mod':
        return [
          { maxRequests: 2, windowMs: 1000 }, // 2 requests per second
          { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
          { maxRequests: 30, windowMs: 3600000 }, // 30 requests per hour
        ];
      default:
        return [
          { maxRequests: 5, windowMs: 1000 }, // 5 requests per second
          { maxRequests: 30, windowMs: 60000 }, // 30 requests per minute
          { maxRequests: 100, windowMs: 3600000 }, // 100 requests per hour
        ];
    }
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
