import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LlmUse } from './entities/llm-use.entity';
import { LlmTotalUse } from './entities/llm-total-use.entity';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { ApiKey } from './entities/api-key.entity';
import { LLMApiCallRecord } from './entities/llm-api-call-record.entity';
import { LlmUseService } from './services/llm-use.service';
import { LlmTotalUseService } from './services/llm-total-use.service';
import { UserService } from './services/user.service';
import { ApiKeyService } from './services/api-key.service';
import { LLMApiCallRecordService } from './services/llm-api-call-record.service';

/**
 * S Backend Database module that configures TypeORM for PostgreSQL connection
 *
 * This module configures the S Backend database connection using S_POSTGRES_* environment variables.
 *
 * This module:
 * 1. Sets up a dynamic TypeORM module instance with production-ready configuration for S Backend
 * 2. Registers all application entities including User and RefreshToken for auth
 * 3. Provides database services for other modules to consume
 * 4. Provides automatic reconnection capabilities with exponential backoff
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = {
          type: 'postgres' as const,
          host: configService.get('S_POSTGRES_HOST', 's-db'),
          port: configService.get('S_POSTGRES_PORT', 5432),
          username: configService.get('S_POSTGRES_USERNAME', 'postgres'),
          password: configService.get('S_POSTGRES_PASSWORD', ''),
          database: configService.get('S_POSTGRES_DATABASE', 's-sansa-dev'),
          entities: [
            LlmUse,
            LlmTotalUse,
            User,
            RefreshToken,
            ApiKey,
            LLMApiCallRecord,
          ],
          synchronize:
            configService.get('NODE_ENV', 'development') !== 'production',
          logging: false,
          ssl: configService.get('S_POSTGRES_SSL') === 'true',
          retryAttempts: 10,
          retryDelay: 3000,
          autoLoadEntities: true,
        };

        // Log S Backend database connection info (without password)
        console.log('S Backend Database Configuration:', {
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          database: dbConfig.database,
          ssl: dbConfig.ssl,
        });

        return dbConfig;
      },
    }),
    TypeOrmModule.forFeature([
      LlmUse,
      LlmTotalUse,
      User,
      RefreshToken,
      ApiKey,
      LLMApiCallRecord,
    ]),
  ],
  providers: [
    LlmUseService,
    LlmTotalUseService,
    UserService,
    ApiKeyService,
    LLMApiCallRecordService,
  ],
  exports: [
    TypeOrmModule,
    LlmUseService,
    LlmTotalUseService,
    UserService,
    ApiKeyService,
    LLMApiCallRecordService,
  ],
})
export class DatabaseModule {}
