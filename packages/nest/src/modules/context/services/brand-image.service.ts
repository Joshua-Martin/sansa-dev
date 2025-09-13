import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandImage } from '../../../shared/database/entities/brand-image.entity';
import { StorageService } from '../../../shared/storage/storage.service';
import {
  UploadBrandImageDto,
  UpdateBrandImageMetadataDto,
} from '../dto/brand-image.dto';
import type { BrandImage as BrandImageType } from '@sansa-dev/shared';
import { ContextErrorFactory } from '@sansa-dev/shared';

/**
 * BrandImageService
 *
 * Service for managing brand images within workspaces.
 * Handles file uploads to storage and metadata management for brand board images.
 */
@Injectable()
export class BrandImageService {
  private readonly logger = new Logger(BrandImageService.name);

  constructor(
    @InjectRepository(BrandImage)
    private readonly brandImageRepository: Repository<BrandImage>,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Upload a brand image file
   *
   * @param userId - ID of the user uploading the image
   * @param file - File buffer to upload
   * @param filename - Original filename
   * @param mimeType - MIME type of the file
   * @param dto - Upload metadata
   * @returns Created brand image
   */
  async uploadBrandImage(
    userId: string,
    file: Buffer,
    filename: string,
    mimeType: string,
    dto: UploadBrandImageDto,
  ): Promise<BrandImageType> {
    try {
      this.logger.debug(
        `Uploading brand image: ${filename} for workspace: ${dto.workspaceId}`,
      );

      // Validate file type
      this.validateFileType(mimeType);

      // Upload file to storage
      const uploadResult = await this.storageService.uploadFile({
        file,
        filename,
        mimeType,
        userId,
        workspaceId: dto.workspaceId,
        category: 'brand-image',
        metadata: {
          altText: dto.altText,
          description: dto.description,
        },
      });

      // Create database record
      const image = this.brandImageRepository.create({
        userId,
        workspaceId: dto.workspaceId,
        filename,
        storageKey: uploadResult.storageKey,
        mimeType,
        size: uploadResult.size,
        metadata: {
          dimensions: undefined, // Will be populated later if needed
        },
      });

      const saved = await this.brandImageRepository.save(image);

      this.logger.log(
        `Uploaded brand image ${saved.id} for workspace ${dto.workspaceId}`,
      );
      return this.entityToBrandImage(saved);
    } catch (error) {
      this.logger.error(`Failed to upload brand image ${filename}:`, error);
      if (error instanceof Error && error.name === 'ValidationError') {
        throw ContextErrorFactory.brandImageUploadFailed(error.message);
      }
      throw ContextErrorFactory.brandImageUploadFailed(
        'Unknown error occurred',
      );
    }
  }

  /**
   * Get all brand images for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   * @returns Array of brand images
   */
  async getBrandImages(
    workspaceId: string,
    userId: string,
  ): Promise<BrandImageType[]> {
    try {
      this.logger.debug(`Getting brand images for workspace: ${workspaceId}`);

      const images = await this.brandImageRepository.find({
        where: { workspaceId, userId },
        order: { uploadedAt: 'DESC' },
      });

      return images.map((image) => this.entityToBrandImage(image));
    } catch (error) {
      this.logger.error(
        `Failed to get brand images for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get a specific brand image by ID
   *
   * @param imageId - Image ID
   * @param userId - User ID (for access control)
   * @returns Brand image or null if not found
   */
  async getBrandImage(
    imageId: string,
    userId: string,
  ): Promise<BrandImageType | null> {
    try {
      this.logger.debug(`Getting brand image: ${imageId}`);

      const image = await this.brandImageRepository.findOne({
        where: { id: imageId, userId },
      });

      if (!image) {
        return null;
      }

      return this.entityToBrandImage(image);
    } catch (error) {
      this.logger.error(`Failed to get brand image ${imageId}:`, error);
      throw error;
    }
  }

  /**
   * Update brand image metadata
   *
   * @param imageId - Image ID
   * @param userId - User ID (for access control)
   * @param dto - Metadata update data
   * @returns Updated brand image
   */
  async updateBrandImageMetadata(
    imageId: string,
    userId: string,
    dto: UpdateBrandImageMetadataDto,
  ): Promise<BrandImageType> {
    try {
      this.logger.debug(`Updating brand image metadata: ${imageId}`);

      const image = await this.brandImageRepository.findOne({
        where: { id: imageId, userId },
      });

      if (!image) {
        throw ContextErrorFactory.brandImageNotFound(imageId);
      }

      // Update metadata
      if (!image.metadata) {
        image.metadata = {};
      }

      if (dto.altText !== undefined) {
        image.metadata.altText = dto.altText;
      }

      if (dto.description !== undefined) {
        image.metadata.description = dto.description;
      }

      const saved = await this.brandImageRepository.save(image);

      this.logger.log(`Updated brand image metadata ${saved.id}`);
      return this.entityToBrandImage(saved);
    } catch (error) {
      this.logger.error(
        `Failed to update brand image metadata ${imageId}:`,
        error,
      );
      if (error instanceof Error) {
        throw ContextErrorFactory.brandImageUpdateFailed(
          imageId,
          error.message,
        );
      }
      throw ContextErrorFactory.brandImageUpdateFailed(
        imageId,
        'Unknown error occurred',
      );
    }
  }

  /**
   * Delete a brand image
   *
   * @param imageId - Image ID
   * @param userId - User ID (for access control)
   */
  async deleteBrandImage(imageId: string, userId: string): Promise<void> {
    try {
      this.logger.debug(`Deleting brand image: ${imageId}`);

      const image = await this.brandImageRepository.findOne({
        where: { id: imageId, userId },
      });

      if (!image) {
        throw ContextErrorFactory.brandImageNotFound(imageId);
      }

      // Delete from storage
      try {
        await this.storageService.deleteFile(image.storageKey);
      } catch (error) {
        this.logger.warn(
          `Failed to delete file from storage: ${image.storageKey}`,
          error,
        );
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      await this.brandImageRepository.remove(image);

      this.logger.log(`Deleted brand image ${imageId}`);
    } catch (error) {
      this.logger.error(`Failed to delete brand image ${imageId}:`, error);
      if (error instanceof Error) {
        throw ContextErrorFactory.brandImageDeleteFailed(
          imageId,
          error.message,
        );
      }
      throw ContextErrorFactory.brandImageDeleteFailed(
        imageId,
        'Unknown error occurred',
      );
    }
  }

  /**
   * Delete all brand images for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   */
  async deleteWorkspaceBrandImages(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Deleting all brand images for workspace: ${workspaceId}`,
      );

      const images = await this.brandImageRepository.find({
        where: { workspaceId, userId },
      });

      // Delete files from storage
      const storageKeys = images.map((image) => image.storageKey);
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
      await this.brandImageRepository.remove(images);

      this.logger.log(
        `Deleted ${images.length} brand images for workspace ${workspaceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete brand images for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get brand images count for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   * @returns Count of brand images
   */
  async getBrandImagesCount(
    workspaceId: string,
    userId: string,
  ): Promise<number> {
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
   * Validate file type for brand images
   *
   * @param mimeType - MIME type of the file
   * @throws BadRequestException if file type is invalid
   */
  private validateFileType(mimeType: string): void {
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];

    if (!allowedTypes.includes(mimeType)) {
      throw ContextErrorFactory.brandImageInvalidType(mimeType, allowedTypes);
    }
  }

  /**
   * Convert entity to shared type
   *
   * @param entity - BrandImage entity
   * @returns BrandImage shared type
   */
  private entityToBrandImage(entity: BrandImage): BrandImageType {
    return {
      id: entity.id,
      userId: entity.userId,
      workspaceId: entity.workspaceId,
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
