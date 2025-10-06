import { Module, MiddlewareConsumer } from '@nestjs/common';
import { SansaXController } from './sansa-x.controller';
import { SansaXService } from './sansa-x.service';
import { DatabaseModule } from '../../shared/database/database.module';
import { ApiKeyMiddleware } from '../../shared/middleware/api-key.middleware';

/**
 * Sansa-X Integration Module
 *
 * Handles incoming Sansa-X monitoring data from external clients.
 * Provides endpoints for receiving pre-request and post-response payloads
 * and stores them for analytics and monitoring.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [SansaXController],
  providers: [SansaXService],
})
export class SansaXModule {
  /**
   * Configure middleware for API key authentication on Sansa-X endpoints
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiKeyMiddleware).forRoutes('sansa-x');
  }
}
