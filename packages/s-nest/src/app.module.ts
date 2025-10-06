import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalBlockGuard } from './shared/guards/global-block.guard';
import { CommonModule } from './shared/shared.module';
import { RequestLoggerInterceptor } from './shared/middleware/request-logger.interceptor';
import { AppController } from './app.controller';
import { DatabaseModule } from './shared/database/database.module';
import { UnifiedLLMModule } from './shared/ai-providers/unified/unified-llm.module';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './modules/auth/auth.module';
import { ChatAgentModule } from './modules/chat-agent/chat-agent.module';
import { SansaXModule } from './modules/sansa-x/sansa-x.module';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { RbacGuard } from './shared/guards/rbac.guard';

/**
 * Root module of the application that imports and configures all other modules
 *
 * This module:
 * 1. Loads environment variables via ConfigModule
 * 2. Configures PostgreSQL database connectivity
 * 3. Sets up global guards for security and tracking
 * 4. Configures request logging and monitoring
 * 5. Imports and configures feature modules
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
      expandVariables: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 60 * 1000, // 1 hour cache TTL by default
    }),
    CommonModule,
    DatabaseModule,
    UnifiedLLMModule,
    AuthModule,
    ChatAgentModule,
    SansaXModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GlobalBlockGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggerInterceptor,
    },
  ],
})
export class AppModule {}
