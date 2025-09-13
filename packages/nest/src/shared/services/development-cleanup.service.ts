import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from '../redis/redis.service';

/**
 * Service to clean up Redis keys during development
 * Only runs cleanup when NODE_ENV is 'development'
 */
@Injectable()
export class DevelopmentCleanupService implements OnModuleInit {
  private readonly logger = new Logger(DevelopmentCleanupService.name);
  private redis: Redis;

  constructor(private redisService: RedisService) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Use the centralized Redis configuration
    const redisConfig = this.redisService.getRedisConfig();
    this.redis = new Redis(redisConfig);

    await this.cleanupRedisKeys();
  }

  private async cleanupRedisKeys(): Promise<void> {
    try {
      // Clean up rate limit keys
      let cursor = '0';
      do {
        const [newCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          'ratelimit:*',
          'COUNT',
          '100',
        );
        cursor = newCursor;

        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');

      // Clean up block list keys
      cursor = '0';
      do {
        const [newCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          'globalblock:*',
          'COUNT',
          '100',
        );
        cursor = newCursor;

        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');

      this.logger.debug(
        'Successfully cleaned up Redis keys in development mode',
      );
    } catch (error) {
      this.logger.error('Error cleaning up Redis keys:', error);
    }
  }
}
