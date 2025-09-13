import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandAsset } from '../entities/brand-asset.entity';
import { BrandAssetType } from '@sansa-dev/shared';

/**
 * Database service for managing BrandAsset entities
 *
 * Provides all database operations for brand asset data with proper
 * error handling, validation, and type safety.
 */
@Injectable()
export class BrandAssetService {
  private readonly logger = new Logger(BrandAssetService.name);

  constructor(
    @InjectRepository(BrandAsset)
    private readonly brandAssetRepository: Repository<BrandAsset>,
  ) {}

  /**
   * Create a new brand asset
   *
   * @param data - Brand asset data
   * @returns Created brand asset entity
   */
  async create(data: {
    userId: string;
    workspaceId: string;
    assetType: BrandAssetType;
    filename: string;
    storageKey: string;
    mimeType: string;
    size: number;
    url?: string;
    metadata?: any;
  }): Promise<BrandAsset> {
    try {
      this.logger.debug(
        `Creating brand asset: ${data.filename} for workspace: ${data.workspaceId}`,
      );

      const brandAsset = this.brandAssetRepository.create({
        userId: data.userId,
        workspaceId: data.workspaceId,
        assetType: data.assetType,
        filename: data.filename,
        storageKey: data.storageKey,
        mimeType: data.mimeType,
        size: data.size,
        url: data.url,
        metadata: data.metadata,
      });

      const saved = await this.brandAssetRepository.save(brandAsset);
      this.logger.log(`Created brand asset ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `Failed to create brand asset ${data.filename}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find brand asset by ID
   *
   * @param id - Brand asset ID
   * @returns Brand asset entity
   * @throws NotFoundException if not found
   */
  async findById(id: string): Promise<BrandAsset> {
    try {
      const brandAsset = await this.brandAssetRepository.findOne({
        where: { id },
      });

      if (!brandAsset) {
        throw new NotFoundException(`Brand asset with ID ${id} not found`);
      }

      return brandAsset;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find brand asset ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find brand asset by ID and user ID
   *
   * @param id - Brand asset ID
   * @param userId - User ID
   * @returns Brand asset entity
   * @throws NotFoundException if not found
   */
  async findByIdAndUser(id: string, userId: string): Promise<BrandAsset> {
    try {
      const brandAsset = await this.brandAssetRepository.findOne({
        where: { id, userId },
      });

      if (!brandAsset) {
        throw new NotFoundException(`Brand asset with ID ${id} not found`);
      }

      return brandAsset;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find brand asset ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find all brand assets for a workspace and user
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   * @param assetType - Optional asset type filter
   * @returns Array of brand asset entities
   */
  async findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
    assetType?: BrandAssetType,
  ): Promise<BrandAsset[]> {
    try {
      const where: any = { workspaceId, userId };
      if (assetType) {
        where.assetType = assetType;
      }

      return await this.brandAssetRepository.find({
        where,
        order: { uploadedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find brand assets for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update brand asset
   *
   * @param id - Brand asset ID
   * @param data - Update data
   * @returns Updated brand asset entity
   * @throws NotFoundException if not found
   */
  async update(
    id: string,
    data: Partial<{
      filename: string;
      storageKey: string;
      mimeType: string;
      size: number;
      url: string;
      metadata: any;
    }>,
  ): Promise<BrandAsset> {
    try {
      this.logger.debug(`Updating brand asset ${id}`);

      const brandAsset = await this.findById(id);

      // Update fields
      if (data.filename !== undefined) brandAsset.filename = data.filename;
      if (data.storageKey !== undefined)
        brandAsset.storageKey = data.storageKey;
      if (data.mimeType !== undefined) brandAsset.mimeType = data.mimeType;
      if (data.size !== undefined) brandAsset.size = data.size;
      if (data.url !== undefined) brandAsset.url = data.url;
      if (data.metadata !== undefined) brandAsset.metadata = data.metadata;

      const saved = await this.brandAssetRepository.save(brandAsset);
      this.logger.log(`Updated brand asset ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to update brand asset ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete brand asset by ID
   *
   * @param id - Brand asset ID
   * @throws NotFoundException if not found
   */
  async delete(id: string): Promise<void> {
    try {
      this.logger.debug(`Deleting brand asset ${id}`);

      const brandAsset = await this.findById(id);
      await this.brandAssetRepository.remove(brandAsset);

      this.logger.log(`Deleted brand asset ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete brand asset ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete all brand assets for a workspace and user
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   */
  async deleteByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    try {
      this.logger.debug(`Deleting brand assets for workspace ${workspaceId}`);

      const brandAssets = await this.findByWorkspaceAndUser(
        workspaceId,
        userId,
      );
      if (brandAssets.length > 0) {
        await this.brandAssetRepository.remove(brandAssets);
        this.logger.log(
          `Deleted ${brandAssets.length} brand assets for workspace ${workspaceId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete brand assets for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if brand asset exists by ID and user ID
   *
   * @param id - Brand asset ID
   * @param userId - User ID
   * @returns True if exists, false otherwise
   */
  async exists(id: string, userId: string): Promise<boolean> {
    try {
      const count = await this.brandAssetRepository.count({
        where: { id, userId },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check brand asset existence ${id}:`, error);
      return false;
    }
  }

  /**
   * Count brand assets for a workspace and user
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   * @param assetType - Optional asset type filter
   * @returns Count of brand assets
   */
  async countByWorkspace(
    workspaceId: string,
    userId: string,
    assetType?: BrandAssetType,
  ): Promise<number> {
    try {
      const where: any = { workspaceId, userId };
      if (assetType) {
        where.assetType = assetType;
      }

      return await this.brandAssetRepository.count({ where });
    } catch (error) {
      this.logger.error(
        `Failed to count brand assets for workspace ${workspaceId}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Get all brand assets for a user
   *
   * @param userId - User ID
   * @returns Array of brand asset entities
   */
  async findByUser(userId: string): Promise<BrandAsset[]> {
    try {
      return await this.brandAssetRepository.find({
        where: { userId },
        order: { uploadedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find brand assets for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get brand assets by asset type for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   * @param assetType - Asset type
   * @returns Array of brand asset entities
   */
  async findByAssetType(
    workspaceId: string,
    userId: string,
    assetType: BrandAssetType,
  ): Promise<BrandAsset[]> {
    try {
      return await this.brandAssetRepository.find({
        where: { workspaceId, userId, assetType },
        order: { uploadedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find ${assetType} assets for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }
}
