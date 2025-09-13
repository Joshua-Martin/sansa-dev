import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandImage } from '../entities/brand-image.entity';

/**
 * Database service for managing BrandImage entities
 *
 * Provides all database operations for brand image data with proper
 * error handling, validation, and type safety.
 */
@Injectable()
export class BrandImageService {
  private readonly logger = new Logger(BrandImageService.name);

  constructor(
    @InjectRepository(BrandImage)
    private readonly brandImageRepository: Repository<BrandImage>,
  ) {}

  /**
   * Create a new brand image
   *
   * @param data - Brand image data
   * @returns Created brand image entity
   */
  async create(data: {
    userId: string;
    workspaceId: string;
    filename: string;
    storageKey: string;
    mimeType: string;
    size: number;
    url?: string;
    metadata?: any;
  }): Promise<BrandImage> {
    try {
      this.logger.debug(
        `Creating brand image: ${data.filename} for workspace: ${data.workspaceId}`,
      );

      const brandImage = this.brandImageRepository.create({
        userId: data.userId,
        workspaceId: data.workspaceId,
        filename: data.filename,
        storageKey: data.storageKey,
        mimeType: data.mimeType,
        size: data.size,
        url: data.url,
        metadata: data.metadata,
      });

      const saved = await this.brandImageRepository.save(brandImage);
      this.logger.log(`Created brand image ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `Failed to create brand image ${data.filename}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find brand image by ID
   *
   * @param id - Brand image ID
   * @returns Brand image entity
   * @throws NotFoundException if not found
   */
  async findById(id: string): Promise<BrandImage> {
    try {
      const brandImage = await this.brandImageRepository.findOne({
        where: { id },
      });

      if (!brandImage) {
        throw new NotFoundException(`Brand image with ID ${id} not found`);
      }

      return brandImage;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find brand image ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find brand image by ID and user ID
   *
   * @param id - Brand image ID
   * @param userId - User ID
   * @returns Brand image entity
   * @throws NotFoundException if not found
   */
  async findByIdAndUser(id: string, userId: string): Promise<BrandImage> {
    try {
      const brandImage = await this.brandImageRepository.findOne({
        where: { id, userId },
      });

      if (!brandImage) {
        throw new NotFoundException(`Brand image with ID ${id} not found`);
      }

      return brandImage;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find brand image ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find all brand images for a workspace and user
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   * @returns Array of brand image entities
   */
  async findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<BrandImage[]> {
    try {
      return await this.brandImageRepository.find({
        where: { workspaceId, userId },
        order: { uploadedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find brand images for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update brand image
   *
   * @param id - Brand image ID
   * @param data - Update data
   * @returns Updated brand image entity
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
  ): Promise<BrandImage> {
    try {
      this.logger.debug(`Updating brand image ${id}`);

      const brandImage = await this.findById(id);

      // Update fields
      if (data.filename !== undefined) brandImage.filename = data.filename;
      if (data.storageKey !== undefined)
        brandImage.storageKey = data.storageKey;
      if (data.mimeType !== undefined) brandImage.mimeType = data.mimeType;
      if (data.size !== undefined) brandImage.size = data.size;
      if (data.url !== undefined) brandImage.url = data.url;
      if (data.metadata !== undefined) brandImage.metadata = data.metadata;

      const saved = await this.brandImageRepository.save(brandImage);
      this.logger.log(`Updated brand image ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to update brand image ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete brand image by ID
   *
   * @param id - Brand image ID
   * @throws NotFoundException if not found
   */
  async delete(id: string): Promise<void> {
    try {
      this.logger.debug(`Deleting brand image ${id}`);

      const brandImage = await this.findById(id);
      await this.brandImageRepository.remove(brandImage);

      this.logger.log(`Deleted brand image ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete brand image ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete all brand images for a workspace and user
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   */
  async deleteByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    try {
      this.logger.debug(`Deleting brand images for workspace ${workspaceId}`);

      const brandImages = await this.findByWorkspaceAndUser(
        workspaceId,
        userId,
      );
      if (brandImages.length > 0) {
        await this.brandImageRepository.remove(brandImages);
        this.logger.log(
          `Deleted ${brandImages.length} brand images for workspace ${workspaceId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete brand images for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if brand image exists by ID and user ID
   *
   * @param id - Brand image ID
   * @param userId - User ID
   * @returns True if exists, false otherwise
   */
  async exists(id: string, userId: string): Promise<boolean> {
    try {
      const count = await this.brandImageRepository.count({
        where: { id, userId },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check brand image existence ${id}:`, error);
      return false;
    }
  }

  /**
   * Count brand images for a workspace and user
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   * @returns Count of brand images
   */
  async countByWorkspace(workspaceId: string, userId: string): Promise<number> {
    try {
      return await this.brandImageRepository.count({
        where: { workspaceId, userId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to count brand images for workspace ${workspaceId}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Get all brand images for a user
   *
   * @param userId - User ID
   * @returns Array of brand image entities
   */
  async findByUser(userId: string): Promise<BrandImage[]> {
    try {
      return await this.brandImageRepository.find({
        where: { userId },
        order: { uploadedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find brand images for user ${userId}:`,
        error,
      );
      throw error;
    }
  }
}
