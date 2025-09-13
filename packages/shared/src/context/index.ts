/**
 * Context management types and utilities
 *
 * This module provides type definitions for the context management system,
 * including brand boards, color palettes, product overviews, and brand assets.
 */

// Core context types
export * from './types/context.types';
export * from './types/brand-board.types';
export * from './types/color-palette.types';
export * from './types/product-overview.types';
export * from './types/brand-assets.types';
export * from './errors';

// Re-export commonly used types with convenient aliases
export type {
  Context,
  FetchContextRequest,
  ContextSummary,
} from './types/context.types';

export type {
  BrandImage,
  UploadBrandImageRequest,
} from './types/brand-board.types';

export type { Color, ColorPalette } from './types/color-palette.types';

export type {
  ProductOverview,
  CreateProductOverviewRequest,
  UpdateProductOverviewRequest,
} from './types/product-overview.types';

export type {
  BrandAsset,
  BrandAssetType,
  UploadBrandAssetRequest,
} from './types/brand-assets.types';
