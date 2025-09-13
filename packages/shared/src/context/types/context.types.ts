import { BrandImage } from './brand-board.types';
import { BrandAsset } from './brand-assets.types';
import { ColorPalette } from './color-palette.types';
import { ProductOverview } from './product-overview.types';

/**
 * Context types for managing complete brand context data
 *
 * The Context represents the complete brand information for a project,
 * aggregating all brand assets, images, colors, and product information.
 */

/**
 * Complete context object containing all brand data for a project
 *
 * This is primarily used for API responses when fetching the full context.
 * Not typically stored as a single entity in the database, but rather
 * composed from individual context components.
 */
export interface Context {
  /** ID of the project this context belongs to */
  workspaceId: string;

  /** ID of the user who owns this context */
  userId: string;

  /** Brand board images for visual inspiration */
  brandImages: BrandImage[];

  /** Brand assets (logos, wordmarks, icons) */
  brandAssets: BrandAsset[];

  /** Color palette for the brand */
  colorPalette?: ColorPalette;

  /** Product/service overview description */
  productOverview?: ProductOverview;

  /** When this context was last updated */
  lastUpdatedAt: string;
}

/**
 * Request payload for fetching complete context data
 */
export interface FetchContextRequest {
  /** ID of the project to fetch context for */
  workspaceId: string;
}

/**
 * Lightweight context summary for listings
 *
 * Used when displaying multiple contexts or project listings
 * without loading all the detailed brand data.
 */
export interface ContextSummary {
  /** ID of the project */
  workspaceId: string;

  /** ID of the user who owns this context */
  userId: string;

  /** Number of brand images */
  brandImageCount: number;

  /** Number of brand assets */
  brandAssetCount: number;

  /** Whether a color palette exists */
  hasColorPalette: boolean;

  /** Whether a product overview exists */
  hasProductOverview: boolean;

  /** When this context was last updated */
  lastUpdatedAt: string;
}
