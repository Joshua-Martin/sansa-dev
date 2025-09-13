/**
 * Queue Module
 *
 * Configures and registers Bull queues for the application.
 * Provides centralized queue management with Redis integration.
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { QueueConfigService } from './queue.config';
import { WorkspaceCleanupQueueService } from './workspace-cleanup-queue.service';
import { WorkspaceCleanupProcessor } from './workspace-cleanup.processor';
import { WorkspaceSessionEntity } from '../database/entities/session.entity';
import { DockerService } from '../services/docker.service';
import { RedisService } from '../redis/redis.service';

/**
 * Queue module configuration
 *
 * Registers all Bull queues used in the application with proper Redis configuration.
 * Provides queue services and processors for job management.
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([WorkspaceSessionEntity]),
    // Register the workspace-cleanup queue with Redis configuration
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (queueConfigService: QueueConfigService) => {
        const config = queueConfigService.getQueueConfig();
        return {
          redis: config.redis,
          defaultJobOptions: config.defaultJobOptions,
          settings: config.settings,
        };
      },
      inject: [QueueConfigService],
    }),
    // Register the workspace-cleanup queue
    BullModule.registerQueue({
      name: 'workspace-cleanup',
    }),
  ],
  providers: [
    RedisService,
    DockerService,
    QueueConfigService,
    WorkspaceCleanupQueueService,
    WorkspaceCleanupProcessor,
  ],
  exports: [BullModule, QueueConfigService, WorkspaceCleanupQueueService],
})
export class QueueModule {}
