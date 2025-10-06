import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.redisClient = new Redis(this.getRedisConfig());

    this.redisClient.on('connect', () => {
      this.logger.log('Redis client connected');
    });

    this.redisClient.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redisClient.on('reconnecting', () => {
      this.logger.warn('Redis client reconnecting');
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis client disconnected');
    }
  }

  /**
   * Returns the Redis client instance
   * @returns {Redis} The Redis client
   */
  getClient(): Redis {
    return this.redisClient;
  }

  /**
   * Returns a standardized Redis configuration object that can be used
   * across different Redis clients in the application.
   *
   * @returns {RedisOptions} The standardized Redis configuration
   */
  getRedisConfig(): RedisOptions {
    const isProd = this.configService.get('NODE_ENV') === 'production';

    this.logger.log(
      `Initializing Redis connection in ${isProd ? 'production' : 'development'} mode`,
    );
    this.logger.log(`Redis Host: ${this.configService.get('REDIS_HOST')}`);
    this.logger.log(`Redis Port: ${this.configService.get('REDIS_PORT')}`);
    this.logger.log(
      `Redis TLS Enabled: ${this.configService.get('REDIS_TLS')}`,
    );
    this.logger.log(
      `Redis Password: ${this.configService.get('REDIS_PASSWORD')}`,
    );

    return {
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: parseInt(this.configService.get('REDIS_PORT', '6379')),
      tls: this.configService.get('REDIS_TLS') === 'true' ? {} : undefined,
      password: this.configService.get('REDIS_PASSWORD'),
      connectTimeout: parseInt(
        this.configService.get('REDIS_CONNECT_TIMEOUT', '20000'),
      ),
      disconnectTimeout: parseInt(
        this.configService.get('REDIS_DISCONNECT_TIMEOUT', '20000'),
      ),
      maxRetriesPerRequest: null,
      enableOfflineQueue:
        this.configService.get('REDIS_ENABLE_OFFLINE_QUEUE', 'true') === 'true',
      enableReadyCheck:
        this.configService.get('REDIS_ENABLE_READY_CHECK', 'false') === 'true',
      retryStrategy: (times: number): number | null => {
        const delay = Math.min(
          times * 500,
          parseInt(this.configService.get('REDIS_MAX_RETRY_DELAY', '2000')),
        );
        this.logger.debug(`Redis retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err: Error): boolean => {
        this.logger.error('Redis reconnectOnError:', err);
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          this.logger.warn(
            'Redis connection in READONLY mode, attempting reconnect',
          );
          return true;
        }
        return false;
      },
    };
  }
}
