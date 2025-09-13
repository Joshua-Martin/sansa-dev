import {
  BaseFile,
  BaseFileUploadRequest,
} from '../../storage/types/file.types';

/**
 * Brand assets types for managing logos, wordmarks, and brand files
 *
 * Assets are either uploaded or not - no complex state management
 */

/**
 * Type of brand asset
 */
export type BrandAssetType = 'logo' | 'wordmark' | 'icon';

/**
 * Brand asset entity representing an individual brand file
 *
 * Extends BaseFile to inherit all common file properties while adding
 * domain-specific context data.
 */
export interface BrandAsset extends BaseFile {
  /** ID of the context this asset belongs to */
  workspaceId: string;

  /** Type of brand asset */
  assetType: BrandAssetType;
}

/**
 * Request payload for uploading a brand asset
 *
 * Extends BaseFileUploadRequest to include brand asset-specific parameters
 */
export interface UploadBrandAssetRequest extends BaseFileUploadRequest {
  /** Type of brand asset */
  assetType: BrandAssetType;
}
