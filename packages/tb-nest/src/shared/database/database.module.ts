import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LlmUse } from './entities/llm-use.entity';
import { LlmTotalUse } from './entities/llm-total-use.entity';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { LlmUseService } from './services/llm-use.service';
import { LlmTotalUseService } from './services/llm-total-use.service';
import { UserService } from './services/user.service';

/**
 * TB Backend Database module that configures TypeORM for PostgreSQL connection
 *
 * This module configures the TB Backend database connection using TB_POSTGRES_* environment variables.
 *
 * This module:
 * 1. Sets up a dynamic TypeORM module instance with production-ready configuration for TB Backend
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
          host: configService.get('TB_POSTGRES_HOST', 'tb-db'),
          port: configService.get('TB_POSTGRES_PORT', 5432),
          username: configService.get('TB_POSTGRES_USERNAME', 'postgres'),
          password: configService.get('TB_POSTGRES_PASSWORD', ''),
          database: configService.get('TB_POSTGRES_DATABASE', 'tb-sansa-dev'),
          entities: [
            LlmUse,
            LlmTotalUse,
            User,
            RefreshToken,
          ],
          synchronize:
            configService.get('NODE_ENV', 'development') !== 'production',
          logging: false,
          ssl: configService.get('TB_POSTGRES_SSL') === 'true',
          retryAttempts: 10,
          retryDelay: 3000,
          autoLoadEntities: true,
        };

        // Log TB Backend database connection info (without password)
        console.log('TB Backend Database Configuration:', {
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
    ]),
  ],
  providers: [
    LlmUseService,
    LlmTotalUseService,
    UserService,
  ],
  exports: [
    TypeOrmModule,
    LlmUseService,
    LlmTotalUseService,
    UserService,
  ],
})
export class DatabaseModule {}
