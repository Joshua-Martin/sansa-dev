import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';

// Entities
import { ProductOverview } from '../../shared/database/entities/product-overview.entity';
import { ColorPalette } from '../../shared/database/entities/color-palette.entity';
import { BrandAsset } from '../../shared/database/entities/brand-asset.entity';
import { BrandImage } from '../../shared/database/entities/brand-image.entity';

// Database Services
import { ProductOverviewService as ProductOverviewDatabaseService } from '../../shared/database/services/product-overview.service';
import { ColorPaletteService as ColorPaletteDatabaseService } from '../../shared/database/services/color-palette.service';
import { BrandAssetService as BrandAssetDatabaseService } from '../../shared/database/services/brand-asset.service';
import { BrandImageService as BrandImageDatabaseService } from '../../shared/database/services/brand-image.service';

// Module Services
import { ProductOverviewService } from './services/product-overview.service';
import { ColorPaletteService } from './services/color-palette.service';
import { BrandAssetService } from './services/brand-asset.service';
import { BrandImageService } from './services/brand-image.service';
import { ContextService } from './services/context.service';

// Controllers
import { ProductOverviewController } from './controllers/product-overview.controller';
import { ColorPaletteController } from './controllers/color-palette.controller';
import { BrandAssetController } from './controllers/brand-asset.controller';
import { BrandImageController } from './controllers/brand-image.controller';
import { ContextController } from './controllers/context.controller';

// Storage
import { StorageModule } from '../../shared/storage/storage.module';

// Auth
import { AuthModule } from '../auth/auth.module';

/**
 * ContextModule
 *
 * Module for managing workspace context including:
 * - Product overviews (textual descriptions)
 * - Color palettes (brand colors)
 * - Brand assets (logos, wordmarks, icons)
 * - Brand images (inspiration images)
 *
 * Provides complete CRUD operations for all context items
 * with file storage integration for assets and images.
 */
@Module({
  imports: [
    // Database entities
    TypeOrmModule.forFeature([
      ProductOverview,
      ColorPalette,
      BrandAsset,
      BrandImage,
    ]),

    // File storage
    StorageModule,

    // Authentication (required for guards)
    AuthModule,

    // File upload support
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [
    ProductOverviewController,
    ColorPaletteController,
    BrandAssetController,
    BrandImageController,
    ContextController,
  ],
  providers: [
    // Database Services
    ProductOverviewDatabaseService,
    ColorPaletteDatabaseService,
    BrandAssetDatabaseService,
    BrandImageDatabaseService,

    // Module Services (depend on database services)
    ProductOverviewService,
    ColorPaletteService,
    BrandAssetService,
    BrandImageService,
    ContextService,
  ],
  exports: [
    // Database Services
    ProductOverviewDatabaseService,
    ColorPaletteDatabaseService,
    BrandAssetDatabaseService,
    BrandImageDatabaseService,

    // Module Services
    ProductOverviewService,
    ColorPaletteService,
    BrandAssetService,
    BrandImageService,
    ContextService,
  ],
})
export class ContextModule {}
