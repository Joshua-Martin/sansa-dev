import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis/redis.service';
import { GlobalBlockListService } from './services/global-block-list.service';
import { DatabaseModule } from './database/database.module';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { DevelopmentCleanupService } from './services/development-cleanup.service';
import { UnifiedLLMModule } from './ai-providers/unified/unified-llm.module';
import { QueueModule } from './queue/queue.module';

/**
 * Global shared module providing common services across the application
 *
 * This module:
 * 1. Provides services that need to be available application-wide
 * 2. Imports and re-exports required modules
 * 3. Configures shared infrastructure components
 */
@Global()
@Module({
  imports: [ConfigModule, DatabaseModule, UnifiedLLMModule, QueueModule],
  providers: [
    RedisService,
    GlobalBlockListService,
    RateLimitGuard,
    DevelopmentCleanupService,
  ],
  exports: [
    RedisService,
    GlobalBlockListService,
    DatabaseModule,
    RateLimitGuard,
    UnifiedLLMModule,
    QueueModule,
  ],
})
export class CommonModule {}
