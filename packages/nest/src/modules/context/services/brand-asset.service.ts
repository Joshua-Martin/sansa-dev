import { Injectable, Logger } from '@nestjs/common';
import { BrandAsset } from '../../../shared/database/entities/brand-asset.entity';
import { BrandAssetService as BrandAssetDatabaseService } from '../../../shared/database/services/brand-asset.service';
import { StorageService } from '../../../shared/storage/storage.service';
import {
  UploadBrandAssetDto,
  UpdateBrandAssetMetadataDto,
} from '../dto/brand-asset.dto';
import type {
  BrandAsset as BrandAssetType,
  BrandAssetType as BrandAssetTypeEnum,
} from '@sansa-dev/shared';
import { ContextErrorFactory } from '@sansa-dev/shared';

/**
 * BrandAssetService
 *
 * Service for managing brand assets (logos, wordmarks, icons) within workspaces.
 * Handles file uploads to storage and metadata management.
 */
@Injectable()
export class BrandAssetService {
  private readonly logger = new Logger(BrandAssetService.name);

  constructor(
    private readonly brandAssetDatabaseService: BrandAssetDatabaseService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Upload a brand asset file
   *
   * @param userId - ID of the user uploading the asset
   * @param file - File buffer to upload
   * @param filename - Original filename
   * @param mimeType - MIME type of the file
   * @param dto - Upload metadata
   * @returns Created brand asset
   */
  async uploadBrandAsset(
    userId: string,
    file: Buffer,
    filename: string,
    mimeType: string,
    dto: UploadBrandAssetDto,
  ): Promise<BrandAssetType> {
    try {
      this.logger.debug(
        `Uploading brand asset: ${filename} for workspace: ${dto.workspaceId}`,
      );

      // Validate file type
      this.validateFileType(mimeType, dto.assetType);

      // Upload file to storage
      const uploadResult = await this.storageService.uploadFile({
        file,
        filename,
        mimeType,
        userId,
        workspaceId: dto.workspaceId,
        category: `brand-asset-${dto.assetType}`,
        metadata: {
          assetType: dto.assetType,
          altText: dto.altText,
          description: dto.description,
          color: dto.color,
        },
      });

      // Create database record
      const saved = await this.brandAssetDatabaseService.create({
        userId,
        workspaceId: dto.workspaceId,
        assetType: dto.assetType,
        filename,
        storageKey: uploadResult.storageKey,
        mimeType,
        size: uploadResult.size,
        metadata: {
          dimensions: undefined, // Will be populated later if needed
        },
      });

      this.logger.log(
        `Uploaded brand asset ${saved.id} for workspace ${dto.workspaceId}`,
      );
      return this.entityToBrandAsset(saved);
    } catch (error) {
      this.logger.error(`Failed to upload brand asset ${filename}:`, error);
      if (error instanceof Error && error.name === 'ValidationError') {
        throw ContextErrorFactory.brandAssetUploadFailed(error.message);
      }
      throw ContextErrorFactory.brandAssetUploadFailed(
        'Unknown error occurred',
      );
    }
  }

  /**
   * Get all brand assets for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   * @param assetType - Optional filter by asset type
   * @returns Array of brand assets
   */
  async getBrandAssets(
    workspaceId: string,
    userId: string,
    assetType?: BrandAssetTypeEnum,
  ): Promise<BrandAssetType[]> {
    try {
      this.logger.debug(`Getting brand assets for workspace: ${workspaceId}`);

      const where: any = { workspaceId, userId };
      if (assetType) {
        where.assetType = assetType;
      }

      const assets =
        await this.brandAssetDatabaseService.findByWorkspaceAndUser(
          workspaceId,
          userId,
          assetType,
        );

      return assets.map((asset) => this.entityToBrandAsset(asset));
    } catch (error) {
      this.logger.error(
        `Failed to get brand assets for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get a specific brand asset by ID
   *
   * @param assetId - Asset ID
   * @param userId - User ID (for access control)
   * @returns Brand asset or null if not found
   */
  async getBrandAsset(
    assetId: string,
    userId: string,
  ): Promise<BrandAssetType | null> {
    try {
      this.logger.debug(`Getting brand asset: ${assetId}`);

      const asset = await this.brandAssetDatabaseService.findByIdAndUser(
        assetId,
        userId,
      );

      if (!asset) {
        return null;
      }

      return this.entityToBrandAsset(asset);
    } catch (error) {
      this.logger.error(`Failed to get brand asset ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Update brand asset metadata
   *
   * @param assetId - Asset ID
   * @param userId - User ID (for access control)
   * @param dto - Metadata update data
   * @returns Updated brand asset
   */
  async updateBrandAssetMetadata(
    assetId: string,
    userId: string,
    dto: UpdateBrandAssetMetadataDto,
  ): Promise<BrandAssetType> {
    try {
      this.logger.debug(`Updating brand asset metadata: ${assetId}`);

      const asset = await this.brandAssetDatabaseService.findByIdAndUser(
        assetId,
        userId,
      );

      if (!asset) {
        throw ContextErrorFactory.brandAssetNotFound(assetId);
      }

      // Update metadata
      const metadata: any = {};
      if (dto.altText !== undefined) {
        metadata.altText = dto.altText;
      }
      if (dto.description !== undefined) {
        metadata.description = dto.description;
      }
      if (dto.color !== undefined) {
        metadata.color = dto.color;
      }

      const saved = await this.brandAssetDatabaseService.update(assetId, {
        metadata,
      });

      this.logger.log(`Updated brand asset metadata ${saved.id}`);
      return this.entityToBrandAsset(saved);
    } catch (error) {
      this.logger.error(
        `Failed to update brand asset metadata ${assetId}:`,
        error,
      );
      if (error instanceof Error) {
        throw ContextErrorFactory.brandAssetUpdateFailed(
          assetId,
          error.message,
        );
      }
      throw ContextErrorFactory.brandAssetUpdateFailed(
        assetId,
        'Unknown error occurred',
      );
    }
  }

  /**
   * Delete a brand asset
   *
   * @param assetId - Asset ID
   * @param userId - User ID (for access control)
   */
  async deleteBrandAsset(assetId: string, userId: string): Promise<void> {
    try {
      this.logger.debug(`Deleting brand asset: ${assetId}`);

      const asset = await this.brandAssetDatabaseService.findByIdAndUser(
        assetId,
        userId,
      );

      if (!asset) {
        throw ContextErrorFactory.brandAssetNotFound(assetId);
      }

      // Delete from storage
      try {
        await this.storageService.deleteFile(asset.storageKey);
      } catch (error) {
        this.logger.warn(
          `Failed to delete file from storage: ${asset.storageKey}`,
          error,
        );
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      await this.brandAssetDatabaseService.delete(assetId);

      this.logger.log(`Deleted brand asset ${assetId}`);
    } catch (error) {
      this.logger.error(`Failed to delete brand asset ${assetId}:`, error);
      if (error instanceof Error) {
        throw ContextErrorFactory.brandAssetDeleteFailed(
          assetId,
          error.message,
        );
      }
      throw ContextErrorFactory.brandAssetDeleteFailed(
        assetId,
        'Unknown error occurred',
      );
    }
  }

  /**
   * Delete all brand assets for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   */
  async deleteWorkspaceBrandAssets(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Deleting all brand assets for workspace: ${workspaceId}`,
      );

      // Get assets to delete from storage
      const assets =
        await this.brandAssetDatabaseService.findByWorkspaceAndUser(
          workspaceId,
          userId,
        );

      // Delete files from storage
      const storageKeys = assets.map((asset) => asset.storageKey);
      if (storageKeys.length > 0) {
        try {
          await this.storageService.deleteFiles(storageKeys);
        } catch (error) {
          this.logger.warn(
            `Failed to delete some files from storage for workspace ${workspaceId}`,
            error,
          );
        }
      }

      // Delete from database
      await this.brandAssetDatabaseService.deleteByWorkspaceAndUser(
        workspaceId,
        userId,
      );

      this.logger.log(
        `Deleted ${assets.length} brand assets for workspace ${workspaceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete brand assets for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get brand assets count for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   * @param assetType - Optional filter by asset type
   * @returns Count of brand assets
   */
  async getBrandAssetsCount(
    workspaceId: string,
    userId: string,
    assetType?: BrandAssetTypeEnum,
  ): Promise<number> {
    try {
      return await this.brandAssetDatabaseService.countByWorkspace(
        workspaceId,
        userId,
        assetType,
      );
    } catch (error) {
      this.logger.error(
        `Failed to count brand assets for workspace ${workspaceId}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Validate file type based on asset type
   *
   * @param mimeType - MIME type of the file
   * @param assetType - Type of brand asset
   * @throws BadRequestException if file type is invalid
   */
  private validateFileType(mimeType: string, assetType: string): void {
    const allowedTypes = {
      logo: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
      wordmark: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
      icon: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
    };

    const allowed = allowedTypes[assetType as keyof typeof allowedTypes];
    if (!allowed || !allowed.includes(mimeType)) {
      throw ContextErrorFactory.brandAssetInvalidType(
        mimeType,
        allowed || [],
        assetType,
      );
    }
  }

  /**
   * Convert entity to shared type
   *
   * @param entity - BrandAsset entity
   * @returns BrandAsset shared type
   */
  private entityToBrandAsset(entity: BrandAsset): BrandAssetType {
    return {
      id: entity.id,
      userId: entity.userId,
      workspaceId: entity.workspaceId,
      assetType: entity.assetType,
      filename: entity.filename,
      storageKey: entity.storageKey,
      mimeType: entity.mimeType,
      size: Number(entity.size),
      url: entity.url || undefined,
      metadata: {
        dimensions: entity.metadata?.dimensions,
      },
      uploadedAt: entity.uploadedAt,
    };
  }
}
