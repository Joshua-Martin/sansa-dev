import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from '../redis/redis.service';

/**
 * Global service for managing blocked users across the entire application
 * Uses Redis for distributed blocking across multiple server instances
 */
@Injectable()
export class GlobalBlockListService implements OnModuleInit {
  private readonly logger = new Logger(GlobalBlockListService.name);
  private redis: Redis;
  private readonly GLOBAL_BLOCK_DURATION = 3600; // 1 hour
  private readonly BURST_THRESHOLD = 10; // Number of requests in burst window
  private readonly BURST_WINDOW = 2; // Window in seconds to detect bursts
  private burstDetectionScript: string;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Use the centralized Redis client
    this.redis = this.redisService.getClient();

    // Load Lua script for atomic burst detection
    await this.loadBurstDetectionScript();
  }

  private async loadBurstDetectionScript(): Promise<void> {
    const luaScript = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowSize = tonumber(ARGV[2])
      local threshold = tonumber(ARGV[3])
      local blockDuration = tonumber(ARGV[4])
      
      -- Clean old entries
      redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowSize)
      
      -- Add current request
      redis.call('ZADD', key, now, now .. ':' .. math.random())
      
      -- Count requests in window
      local count = redis.call('ZCARD', key)
      
      -- If count exceeds threshold, block user
      if count >= threshold then
        -- Set block key
        local blockKey = 'globalblock:' .. string.sub(key, 7) -- Remove 'burst:' prefix
        redis.call('SETEX', blockKey, blockDuration, '1')
        
        -- Clear burst counter
        redis.call('DEL', key)
        
        return 'BLOCKED'
      end
      
      return 'OK'
    `;

    this.burstDetectionScript = (await this.redis.script(
      'LOAD',
      luaScript,
    )) as string;
  }

  /**
   * Checks if a user has burst activity and updates their status
   *
   * @param {string} uid - The user ID to check
   * @returns {Promise<boolean>} True if user is now blocked due to burst activity
   */
  async checkAndUpdateBurst(uid: string): Promise<boolean> {
    const result = await this.redis.evalsha(
      this.burstDetectionScript,
      1, // number of keys
      `burst:${uid}`, // key
      // arguments
      Math.floor(Date.now() / 1000), // current timestamp
      this.BURST_WINDOW,
      this.BURST_THRESHOLD,
      this.GLOBAL_BLOCK_DURATION,
    );

    return result === 'BLOCKED';
  }

  /**
   * Checks if a user is globally blocked
   *
   * @param {string} uid - The user ID to check
   * @returns {Promise<boolean>} True if the user is blocked
   */
  async isGloballyBlocked(uid: string): Promise<boolean> {
    // First check if already blocked
    const isBlocked = await this.redis.get(`globalblock:${uid}`);
    if (isBlocked) return true;

    // Then check for burst activity
    const isBurst = await this.checkAndUpdateBurst(uid);
    return isBurst;
  }

  /**
   * Adds a strike for a user and blocks them if they exceed the maximum strikes
   *
   * @param {string} uid - The user's ID to add a strike for
   * @returns {Promise<void>}
   */
  async addStrike(uid: string): Promise<void> {
    const key = `strikes:${uid}`;
    const strikes = await this.redis.incr(key);
    await this.redis.expire(key, 86400); // Expire after 24 hours

    if (strikes >= 3) {
      await this.blockUser(uid);
    }
  }

  /**
   * Blocks a user globally
   *
   * @param {string} uid - The user ID to block
   * @returns {Promise<void>}
   */
  private async blockUser(uid: string): Promise<void> {
    await this.redis.set(`blocked:${uid}`, '1', 'EX', 86400); // Block for 24 hours
  }
}
