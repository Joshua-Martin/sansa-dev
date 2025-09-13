import {
  BaseFile,
  BaseFileUploadRequest,
} from '../../storage/types/file.types';

/**
 * Brand board types for managing visual brand inspiration
 *
 * All photos are active - users can only upload or delete them
 */

/**
 * Brand image entity representing an individual image in a brand board
 *
 * Extends BaseFile to inherit all common file properties while adding
 * domain-specific context data.
 */
export interface BrandImage extends BaseFile {
  /** ID of the context this image belongs to */
  workspaceId: string;
}

/**
 * Request payload for uploading a brand image
 *
 * Uses BaseFileUploadRequest for all file-related properties
 */
export interface UploadBrandImageRequest extends BaseFileUploadRequest {
  /** ID of the context this image belongs to */
  workspaceId: string;
}
