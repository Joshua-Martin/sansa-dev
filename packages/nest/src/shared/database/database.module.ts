import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LlmUse } from './entities/llm-use.entity';
import { LlmTotalUse } from './entities/llm-total-use.entity';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { WorkspaceSessionEntity } from './entities/session.entity';
import { ProductOverview } from './entities/product-overview.entity';
import { ColorPalette } from './entities/color-palette.entity';
import { BrandAsset } from './entities/brand-asset.entity';
import { BrandImage } from './entities/brand-image.entity';
import { Workspace } from './entities/workspace.entity';
import { LlmUseService } from './services/llm-use.service';
import { LlmTotalUseService } from './services/llm-total-use.service';
import { UserService } from './services/user.service';
import { ProductOverviewService } from './services/product-overview.service';
import { ColorPaletteService } from './services/color-palette.service';
import { BrandAssetService } from './services/brand-asset.service';
import { BrandImageService } from './services/brand-image.service';

/**
 * Database module that configures TypeORM for PostgreSQL connection
 *
 * This module:
 * 1. Sets up a dynamic TypeORM module instance with production-ready configuration
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
          host: configService.get('POSTGRES_HOST', 'localhost'),
          port: configService.get('POSTGRES_PORT', 5432),
          username: configService.get('POSTGRES_USERNAME', 'postgres'),
          password: configService.get('POSTGRES_PASSWORD', ''),
          database: configService.get('POSTGRES_DATABASE', 'postgres'),
          entities: [
            LlmUse,
            LlmTotalUse,
            User,
            RefreshToken,
            WorkspaceSessionEntity,
            Workspace,
            ProductOverview,
            ColorPalette,
            BrandAsset,
            BrandImage,
          ],
          synchronize:
            configService.get('NODE_ENV', 'development') !== 'production',
          logging: false,
          ssl: configService.get('POSTGRES_SSL') === 'true',
          retryAttempts: 10,
          retryDelay: 3000,
          autoLoadEntities: true,
        };

        // Log database connection info (without password)
        console.log('Database Configuration:', {
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
      WorkspaceSessionEntity,
      Workspace,
      ProductOverview,
      ColorPalette,
      BrandAsset,
      BrandImage,
    ]),
  ],
  providers: [
    LlmUseService,
    LlmTotalUseService,
    UserService,
    ProductOverviewService,
    ColorPaletteService,
    BrandAssetService,
    BrandImageService,
  ],
  exports: [
    TypeOrmModule,
    LlmUseService,
    LlmTotalUseService,
    UserService,
    ProductOverviewService,
    ColorPaletteService,
    BrandAssetService,
    BrandImageService,
  ],
})
export class DatabaseModule {}
