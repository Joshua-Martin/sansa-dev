/**
 * Context Error Types and Constants
 *
 * Standardized error handling for all context-related operations including:
 * - Brand Assets (logos, wordmarks, icons)
 * - Brand Images (brand board images)
 * - Color Palettes
 * - Product Overviews
 * - General Context operations
 */

import {
  BaseDaError,
  X21ErrorCategory,
  X21ErrorSeverity,
} from '../../app/error.types';

/**
 * Context-specific error codes
 */
export const CONTEXT_ERROR_CODES = {
  // General Context Errors
  WORKSPACE_NOT_FOUND: 'CTX_WORKSPACE_NOT_FOUND',
  WORKSPACE_ACCESS_DENIED: 'CTX_WORKSPACE_ACCESS_DENIED',
  CONTEXT_NOT_FOUND: 'CTX_CONTEXT_NOT_FOUND',
  CONTEXT_OPERATION_FAILED: 'CTX_OPERATION_FAILED',

  // Brand Asset Errors
  BRAND_ASSET_NOT_FOUND: 'CTX_BRAND_ASSET_NOT_FOUND',
  BRAND_ASSET_UPLOAD_FAILED: 'CTX_BRAND_ASSET_UPLOAD_FAILED',
  BRAND_ASSET_INVALID_TYPE: 'CTX_BRAND_ASSET_INVALID_TYPE',
  BRAND_ASSET_TOO_LARGE: 'CTX_BRAND_ASSET_TOO_LARGE',
  BRAND_ASSET_DELETE_FAILED: 'CTX_BRAND_ASSET_DELETE_FAILED',
  BRAND_ASSET_UPDATE_FAILED: 'CTX_BRAND_ASSET_UPDATE_FAILED',

  // Brand Image Errors
  BRAND_IMAGE_NOT_FOUND: 'CTX_BRAND_IMAGE_NOT_FOUND',
  BRAND_IMAGE_UPLOAD_FAILED: 'CTX_BRAND_IMAGE_UPLOAD_FAILED',
  BRAND_IMAGE_INVALID_TYPE: 'CTX_BRAND_IMAGE_INVALID_TYPE',
  BRAND_IMAGE_TOO_LARGE: 'CTX_BRAND_IMAGE_TOO_LARGE',
  BRAND_IMAGE_DELETE_FAILED: 'CTX_BRAND_IMAGE_DELETE_FAILED',
  BRAND_IMAGE_UPDATE_FAILED: 'CTX_BRAND_IMAGE_UPDATE_FAILED',

  // Color Palette Errors
  COLOR_PALETTE_NOT_FOUND: 'CTX_COLOR_PALETTE_NOT_FOUND',
  COLOR_PALETTE_ALREADY_EXISTS: 'CTX_COLOR_PALETTE_ALREADY_EXISTS',
  COLOR_PALETTE_INVALID_HEX: 'CTX_COLOR_PALETTE_INVALID_HEX',
  COLOR_PALETTE_CREATE_FAILED: 'CTX_COLOR_PALETTE_CREATE_FAILED',
  COLOR_PALETTE_UPDATE_FAILED: 'CTX_COLOR_PALETTE_UPDATE_FAILED',
  COLOR_PALETTE_DELETE_FAILED: 'CTX_COLOR_PALETTE_DELETE_FAILED',

  // Product Overview Errors
  PRODUCT_OVERVIEW_NOT_FOUND: 'CTX_PRODUCT_OVERVIEW_NOT_FOUND',
  PRODUCT_OVERVIEW_ALREADY_EXISTS: 'CTX_PRODUCT_OVERVIEW_ALREADY_EXISTS',
  PRODUCT_OVERVIEW_CREATE_FAILED: 'CTX_PRODUCT_OVERVIEW_CREATE_FAILED',
  PRODUCT_OVERVIEW_UPDATE_FAILED: 'CTX_PRODUCT_OVERVIEW_UPDATE_FAILED',
  PRODUCT_OVERVIEW_DELETE_FAILED: 'CTX_PRODUCT_OVERVIEW_DELETE_FAILED',

  // Storage Errors
  STORAGE_UPLOAD_FAILED: 'CTX_STORAGE_UPLOAD_FAILED',
  STORAGE_DELETE_FAILED: 'CTX_STORAGE_DELETE_FAILED',
  STORAGE_OPERATION_FAILED: 'CTX_STORAGE_OPERATION_FAILED',

  // Database Errors
  DATABASE_OPERATION_FAILED: 'CTX_DATABASE_OPERATION_FAILED',
  DATABASE_CONNECTION_FAILED: 'CTX_DATABASE_CONNECTION_FAILED',

  // Validation Errors
  VALIDATION_FAILED: 'CTX_VALIDATION_FAILED',
  INVALID_REQUEST_DATA: 'CTX_INVALID_REQUEST_DATA',
} as const;

/**
 * Union type of all context error codes
 */
export type ContextErrorCode =
  (typeof CONTEXT_ERROR_CODES)[keyof typeof CONTEXT_ERROR_CODES];

/**
 * Context error factory for creating standardized context errors
 */
export class ContextErrorFactory {
  /**
   * Create a generic context error
   */
  private static createError(
    code: ContextErrorCode,
    category: X21ErrorCategory,
    message: string,
    userMessage: string,
    severity: X21ErrorSeverity = 'MEDIUM',
    details?: Record<string, unknown>,
    suggestions?: string[],
    helpUrl?: string
  ): BaseDaError {
    return new BaseDaError(
      category,
      code,
      message,
      userMessage,
      severity,
      details,
      suggestions,
      helpUrl
    );
  }

  // ===== GENERAL CONTEXT ERRORS =====

  /**
   * Workspace not found error
   */
  static workspaceNotFound(workspaceId?: string): BaseDaError {
    const hasWorkspaceId =
      typeof workspaceId === 'string' && workspaceId.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.WORKSPACE_NOT_FOUND,
      'NOT_FOUND',
      'Workspace not found',
      'The requested workspace could not be found.',
      'HIGH',
      hasWorkspaceId ? { workspaceId } : undefined,
      [
        'Check if the workspace ID is correct',
        'Make sure you have access to this workspace',
        'Try refreshing the page',
      ]
    );
  }

  /**
   * Workspace access denied error
   */
  static workspaceAccessDenied(workspaceId?: string): BaseDaError {
    const hasWorkspaceId =
      typeof workspaceId === 'string' && workspaceId.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.WORKSPACE_ACCESS_DENIED,
      'AUTHORIZATION',
      'Access denied to workspace',
      'You do not have permission to access this workspace.',
      'HIGH',
      hasWorkspaceId ? { workspaceId } : undefined,
      [
        'Make sure you are signed in to the correct account',
        'Contact the workspace owner for access',
      ]
    );
  }

  /**
   * Context operation failed error
   */
  static contextOperationFailed(
    operation: string,
    reason?: string
  ): BaseDaError {
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.CONTEXT_OPERATION_FAILED,
      'SERVER_ERROR',
      `Context operation failed: ${operation}`,
      'An error occurred while performing the requested operation.',
      'MEDIUM',
      hasReason ? { operation, reason } : { operation },
      [
        'Try again in a few moments',
        'Refresh the page if the problem persists',
        'Contact support if the issue continues',
      ]
    );
  }

  // ===== BRAND ASSET ERRORS =====

  /**
   * Brand asset not found error
   */
  static brandAssetNotFound(assetId?: string): BaseDaError {
    const hasAssetId = typeof assetId === 'string' && assetId.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.BRAND_ASSET_NOT_FOUND,
      'NOT_FOUND',
      'Brand asset not found',
      'The requested brand asset could not be found.',
      'MEDIUM',
      hasAssetId ? { assetId } : undefined,
      [
        'Check if the asset ID is correct',
        "Make sure the asset hasn't been deleted",
        'Try refreshing the page',
      ]
    );
  }

  /**
   * Brand asset upload failed error
   */
  static brandAssetUploadFailed(
    reason?: string,
    assetType?: string
  ): BaseDaError {
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    const hasAssetType =
      typeof assetType === 'string' && assetType.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.BRAND_ASSET_UPLOAD_FAILED,
      'SERVER_ERROR',
      'Brand asset upload failed',
      'Failed to upload the brand asset. Please try again.',
      'MEDIUM',
      hasReason || hasAssetType
        ? {
            ...(hasReason && { reason }),
            ...(hasAssetType && { assetType }),
          }
        : undefined,
      [
        'Check your internet connection',
        'Try uploading a smaller file',
        'Try a different file format',
        'Contact support if the problem persists',
      ]
    );
  }

  /**
   * Brand asset invalid type error
   */
  static brandAssetInvalidType(
    providedType: string,
    allowedTypes: string[],
    assetType?: string
  ): BaseDaError {
    const hasAssetType =
      typeof assetType === 'string' && assetType.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.BRAND_ASSET_INVALID_TYPE,
      'VALIDATION',
      `Invalid file type for ${assetType ?? 'brand asset'}: ${providedType}`,
      `The file type ${providedType} is not allowed for ${assetType ?? 'this asset type'}.`,
      'LOW',
      { providedType, allowedTypes, ...(hasAssetType && { assetType }) },
      [
        `Use one of these file types: ${allowedTypes.join(', ')}`,
        'Convert your file to a supported format',
      ]
    );
  }

  /**
   * Brand asset too large error
   */
  static brandAssetTooLarge(
    fileSize: number,
    maxSize: number,
    assetType?: string
  ): BaseDaError {
    const hasAssetType =
      typeof assetType === 'string' && assetType.trim().length > 0;
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    const fileSizeMB = Math.round(fileSize / (1024 * 1024));
    return this.createError(
      CONTEXT_ERROR_CODES.BRAND_ASSET_TOO_LARGE,
      'VALIDATION',
      `Brand asset file too large: ${fileSizeMB}MB (max: ${maxSizeMB}MB)`,
      `Your file is too large (${fileSizeMB}MB). Please use a file smaller than ${maxSizeMB}MB.`,
      'LOW',
      { fileSize, maxSize, ...(hasAssetType && { assetType }) },
      [
        `Reduce file size to under ${maxSizeMB}MB`,
        'Compress the image',
        'Use a different image with lower resolution',
      ]
    );
  }

  /**
   * Brand asset delete failed error
   */
  static brandAssetDeleteFailed(
    assetId?: string,
    reason?: string
  ): BaseDaError {
    const hasAssetId = typeof assetId === 'string' && assetId.trim().length > 0;
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.BRAND_ASSET_DELETE_FAILED,
      'SERVER_ERROR',
      'Brand asset delete failed',
      'Failed to delete the brand asset. Please try again.',
      'MEDIUM',
      hasAssetId || hasReason
        ? {
            ...(hasAssetId && { assetId }),
            ...(hasReason && { reason }),
          }
        : undefined,
      [
        'Try again in a few moments',
        'Refresh the page to see if the asset was deleted',
        'Contact support if the issue continues',
      ]
    );
  }

  /**
   * Brand asset update failed error
   */
  static brandAssetUpdateFailed(
    assetId?: string,
    reason?: string
  ): BaseDaError {
    const hasAssetId = typeof assetId === 'string' && assetId.trim().length > 0;
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.BRAND_ASSET_UPDATE_FAILED,
      'SERVER_ERROR',
      'Brand asset update failed',
      'Failed to update the brand asset metadata. Please try again.',
      'MEDIUM',
      hasAssetId || hasReason
        ? {
            ...(hasAssetId && { assetId }),
            ...(hasReason && { reason }),
          }
        : undefined,
      [
        'Try again in a few moments',
        'Check your internet connection',
        'Contact support if the issue continues',
      ]
    );
  }

  // ===== BRAND IMAGE ERRORS =====

  /**
   * Brand image not found error
   */
  static brandImageNotFound(imageId?: string): BaseDaError {
    const hasImageId = typeof imageId === 'string' && imageId.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.BRAND_IMAGE_NOT_FOUND,
      'NOT_FOUND',
      'Brand image not found',
      'The requested brand image could not be found.',
      'MEDIUM',
      hasImageId ? { imageId } : undefined,
      [
        'Check if the image ID is correct',
        "Make sure the image hasn't been deleted",
        'Try refreshing the page',
      ]
    );
  }

  /**
   * Brand image upload failed error
   */
  static brandImageUploadFailed(reason?: string): BaseDaError {
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.BRAND_IMAGE_UPLOAD_FAILED,
      'SERVER_ERROR',
      'Brand image upload failed',
      'Failed to upload the brand image. Please try again.',
      'MEDIUM',
      hasReason ? { reason } : undefined,
      [
        'Check your internet connection',
        'Try uploading a smaller file',
        'Try a different file format',
        'Contact support if the problem persists',
      ]
    );
  }

  /**
   * Brand image invalid type error
   */
  static brandImageInvalidType(
    providedType: string,
    allowedTypes: string[]
  ): BaseDaError {
    return this.createError(
      CONTEXT_ERROR_CODES.BRAND_IMAGE_INVALID_TYPE,
      'VALIDATION',
      `Invalid file type for brand image: ${providedType}`,
      `The file type ${providedType} is not allowed for brand images.`,
      'LOW',
      { providedType, allowedTypes },
      [
        `Use one of these file types: ${allowedTypes.join(', ')}`,
        'Convert your file to a supported format',
      ]
    );
  }

  /**
   * Brand image too large error
   */
  static brandImageTooLarge(fileSize: number, maxSize: number): BaseDaError {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    const fileSizeMB = Math.round(fileSize / (1024 * 1024));
    return this.createError(
      CONTEXT_ERROR_CODES.BRAND_IMAGE_TOO_LARGE,
      'VALIDATION',
      `Brand image file too large: ${fileSizeMB}MB (max: ${maxSizeMB}MB)`,
      `Your file is too large (${fileSizeMB}MB). Please use a file smaller than ${maxSizeMB}MB.`,
      'LOW',
      { fileSize, maxSize },
      [
        `Reduce file size to under ${maxSizeMB}MB`,
        'Compress the image',
        'Use a different image with lower resolution',
      ]
    );
  }

  /**
   * Brand image delete failed error
   */
  static brandImageDeleteFailed(
    imageId?: string,
    reason?: string
  ): BaseDaError {
    const hasImageId = typeof imageId === 'string' && imageId.trim().length > 0;
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.BRAND_IMAGE_DELETE_FAILED,
      'SERVER_ERROR',
      'Brand image delete failed',
      'Failed to delete the brand image. Please try again.',
      'MEDIUM',
      hasImageId || hasReason
        ? {
            ...(hasImageId && { imageId }),
            ...(hasReason && { reason }),
          }
        : undefined,
      [
        'Try again in a few moments',
        'Refresh the page to see if the image was deleted',
        'Contact support if the issue continues',
      ]
    );
  }

  /**
   * Brand image update failed error
   */
  static brandImageUpdateFailed(
    imageId?: string,
    reason?: string
  ): BaseDaError {
    const hasImageId = typeof imageId === 'string' && imageId.trim().length > 0;
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.BRAND_IMAGE_UPDATE_FAILED,
      'SERVER_ERROR',
      'Brand image update failed',
      'Failed to update the brand image metadata. Please try again.',
      'MEDIUM',
      hasImageId || hasReason
        ? {
            ...(hasImageId && { imageId }),
            ...(hasReason && { reason }),
          }
        : undefined,
      [
        'Try again in a few moments',
        'Check your internet connection',
        'Contact support if the issue continues',
      ]
    );
  }

  // ===== COLOR PALETTE ERRORS =====

  /**
   * Color palette not found error
   */
  static colorPaletteNotFound(workspaceId?: string): BaseDaError {
    const hasWorkspaceId =
      typeof workspaceId === 'string' && workspaceId.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.COLOR_PALETTE_NOT_FOUND,
      'NOT_FOUND',
      'Color palette not found',
      'No color palette exists for this workspace.',
      'MEDIUM',
      hasWorkspaceId ? { workspaceId } : undefined,
      [
        'Create a new color palette for this workspace',
        'Check if you have access to this workspace',
      ]
    );
  }

  /**
   * Color palette already exists error
   */
  static colorPaletteAlreadyExists(workspaceId?: string): BaseDaError {
    const hasWorkspaceId =
      typeof workspaceId === 'string' && workspaceId.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.COLOR_PALETTE_ALREADY_EXISTS,
      'CONFLICT',
      'Color palette already exists',
      'A color palette already exists for this workspace.',
      'LOW',
      hasWorkspaceId ? { workspaceId } : undefined,
      [
        'Update the existing color palette instead',
        'Delete the existing palette first if you want to create a new one',
      ]
    );
  }

  /**
   * Color palette invalid hex error
   */
  static colorPaletteInvalidHex(invalidColor: string): BaseDaError {
    return this.createError(
      CONTEXT_ERROR_CODES.COLOR_PALETTE_INVALID_HEX,
      'VALIDATION',
      `Invalid hex color format: ${invalidColor}`,
      `The color ${invalidColor} is not a valid hex color. Please use the format #RRGGBB.`,
      'LOW',
      { invalidColor },
      [
        'Use a valid hex color format like #FF5733',
        'Use a color picker to ensure correct format',
        'Remove the # symbol if present and ensure 6 characters',
      ]
    );
  }

  /**
   * Color palette create failed error
   */
  static colorPaletteCreateFailed(
    workspaceId?: string,
    reason?: string
  ): BaseDaError {
    const hasWorkspaceId =
      typeof workspaceId === 'string' && workspaceId.trim().length > 0;
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.COLOR_PALETTE_CREATE_FAILED,
      'SERVER_ERROR',
      'Color palette create failed',
      'Failed to create the color palette. Please try again.',
      'MEDIUM',
      hasWorkspaceId || hasReason
        ? {
            ...(hasWorkspaceId && { workspaceId }),
            ...(hasReason && { reason }),
          }
        : undefined,
      [
        'Try again in a few moments',
        'Check your internet connection',
        'Contact support if the issue continues',
      ]
    );
  }

  /**
   * Color palette update failed error
   */
  static colorPaletteUpdateFailed(
    workspaceId?: string,
    reason?: string
  ): BaseDaError {
    const hasWorkspaceId =
      typeof workspaceId === 'string' && workspaceId.trim().length > 0;
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.COLOR_PALETTE_UPDATE_FAILED,
      'SERVER_ERROR',
      'Color palette update failed',
      'Failed to update the color palette. Please try again.',
      'MEDIUM',
      hasWorkspaceId || hasReason
        ? {
            ...(hasWorkspaceId && { workspaceId }),
            ...(hasReason && { reason }),
          }
        : undefined,
      [
        'Try again in a few moments',
        'Check your internet connection',
        'Contact support if the issue continues',
      ]
    );
  }

  /**
   * Color palette delete failed error
   */
  static colorPaletteDeleteFailed(
    workspaceId?: string,
    reason?: string
  ): BaseDaError {
    const hasWorkspaceId =
      typeof workspaceId === 'string' && workspaceId.trim().length > 0;
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.COLOR_PALETTE_DELETE_FAILED,
      'SERVER_ERROR',
      'Color palette delete failed',
      'Failed to delete the color palette. Please try again.',
      'MEDIUM',
      hasWorkspaceId || hasReason
        ? {
            ...(hasWorkspaceId && { workspaceId }),
            ...(hasReason && { reason }),
          }
        : undefined,
      [
        'Try again in a few moments',
        'Refresh the page to see if the palette was deleted',
        'Contact support if the issue continues',
      ]
    );
  }

  // ===== PRODUCT OVERVIEW ERRORS =====

  /**
   * Product overview not found error
   */
  static productOverviewNotFound(workspaceId?: string): BaseDaError {
    const hasWorkspaceId =
      typeof workspaceId === 'string' && workspaceId.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.PRODUCT_OVERVIEW_NOT_FOUND,
      'NOT_FOUND',
      'Product overview not found',
      'No product overview exists for this workspace.',
      'MEDIUM',
      hasWorkspaceId ? { workspaceId } : undefined,
      [
        'Create a new product overview for this workspace',
        'Check if you have access to this workspace',
      ]
    );
  }

  /**
   * Product overview already exists error
   */
  static productOverviewAlreadyExists(workspaceId?: string): BaseDaError {
    const hasWorkspaceId =
      typeof workspaceId === 'string' && workspaceId.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.PRODUCT_OVERVIEW_ALREADY_EXISTS,
      'CONFLICT',
      'Product overview already exists',
      'A product overview already exists for this workspace.',
      'LOW',
      hasWorkspaceId ? { workspaceId } : undefined,
      [
        'Update the existing product overview instead',
        'Delete the existing overview first if you want to create a new one',
      ]
    );
  }

  /**
   * Product overview create failed error
   */
  static productOverviewCreateFailed(
    workspaceId?: string,
    reason?: string
  ): BaseDaError {
    const hasWorkspaceId =
      typeof workspaceId === 'string' && workspaceId.trim().length > 0;
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.PRODUCT_OVERVIEW_CREATE_FAILED,
      'SERVER_ERROR',
      'Product overview create failed',
      'Failed to create the product overview. Please try again.',
      'MEDIUM',
      hasWorkspaceId || hasReason
        ? {
            ...(hasWorkspaceId && { workspaceId }),
            ...(hasReason && { reason }),
          }
        : undefined,
      [
        'Try again in a few moments',
        'Check your internet connection',
        'Contact support if the issue continues',
      ]
    );
  }

  /**
   * Product overview update failed error
   */
  static productOverviewUpdateFailed(
    workspaceId?: string,
    reason?: string
  ): BaseDaError {
    const hasWorkspaceId =
      typeof workspaceId === 'string' && workspaceId.trim().length > 0;
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.PRODUCT_OVERVIEW_UPDATE_FAILED,
      'SERVER_ERROR',
      'Product overview update failed',
      'Failed to update the product overview. Please try again.',
      'MEDIUM',
      hasWorkspaceId || hasReason
        ? {
            ...(hasWorkspaceId && { workspaceId }),
            ...(hasReason && { reason }),
          }
        : undefined,
      [
        'Try again in a few moments',
        'Check your internet connection',
        'Contact support if the issue continues',
      ]
    );
  }

  /**
   * Product overview delete failed error
   */
  static productOverviewDeleteFailed(
    workspaceId?: string,
    reason?: string
  ): BaseDaError {
    const hasWorkspaceId =
      typeof workspaceId === 'string' && workspaceId.trim().length > 0;
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.PRODUCT_OVERVIEW_DELETE_FAILED,
      'SERVER_ERROR',
      'Product overview delete failed',
      'Failed to delete the product overview. Please try again.',
      'MEDIUM',
      hasWorkspaceId || hasReason
        ? {
            ...(hasWorkspaceId && { workspaceId }),
            ...(hasReason && { reason }),
          }
        : undefined,
      [
        'Try again in a few moments',
        'Refresh the page to see if the overview was deleted',
        'Contact support if the issue continues',
      ]
    );
  }

  // ===== STORAGE ERRORS =====

  /**
   * Storage upload failed error
   */
  static storageUploadFailed(reason?: string): BaseDaError {
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.STORAGE_UPLOAD_FAILED,
      'SERVER_ERROR',
      'File upload to storage failed',
      'Failed to save the file. Please try again.',
      'HIGH',
      hasReason ? { reason } : undefined,
      [
        'Try again in a few moments',
        'Check your internet connection',
        'Try uploading a smaller file',
        'Contact support if the problem persists',
      ]
    );
  }

  /**
   * Storage delete failed error
   */
  static storageDeleteFailed(
    storageKey?: string,
    reason?: string
  ): BaseDaError {
    const hasStorageKey =
      typeof storageKey === 'string' && storageKey.trim().length > 0;
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.STORAGE_DELETE_FAILED,
      'SERVER_ERROR',
      'File delete from storage failed',
      'Failed to delete the file from storage.',
      'MEDIUM',
      hasStorageKey || hasReason
        ? {
            ...(hasStorageKey && { storageKey }),
            ...(hasReason && { reason }),
          }
        : undefined,
      [
        'The file may still exist in storage',
        'Try refreshing the page',
        'Contact support if this continues',
      ]
    );
  }

  // ===== DATABASE ERRORS =====

  /**
   * Database operation failed error
   */
  static databaseOperationFailed(
    operation?: string,
    reason?: string
  ): BaseDaError {
    const hasOperation =
      typeof operation === 'string' && operation.trim().length > 0;
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.DATABASE_OPERATION_FAILED,
      'SERVER_ERROR',
      `Database operation failed${hasOperation ? `: ${operation}` : ''}`,
      'A database error occurred. Please try again.',
      'HIGH',
      hasOperation || hasReason
        ? {
            ...(hasOperation && { operation }),
            ...(hasReason && { reason }),
          }
        : undefined,
      [
        'Try again in a few moments',
        'Refresh the page',
        'Contact support if the problem persists',
      ]
    );
  }

  // ===== VALIDATION ERRORS =====

  /**
   * Validation failed error
   */
  static validationFailed(field: string, reason: string): BaseDaError {
    return this.createError(
      CONTEXT_ERROR_CODES.VALIDATION_FAILED,
      'VALIDATION',
      `Validation failed for ${field}: ${reason}`,
      'Please check your input and try again.',
      'LOW',
      { field, reason },
      [
        'Check your input for any errors',
        'Make sure all required fields are filled',
        'Follow the input format requirements',
      ]
    );
  }

  /**
   * Invalid request data error
   */
  static invalidRequestData(reason?: string): BaseDaError {
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      CONTEXT_ERROR_CODES.INVALID_REQUEST_DATA,
      'VALIDATION',
      'Invalid request data',
      'The request data is invalid or malformed.',
      'MEDIUM',
      hasReason ? { reason } : undefined,
      [
        'Check your request format',
        'Make sure all required fields are provided',
        'Verify data types match expectations',
      ]
    );
  }
}
