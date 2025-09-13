import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProductOverview } from '../../../shared/database/entities/product-overview.entity';
import { ProductOverviewService as ProductOverviewDatabaseService } from '../../../shared/database/services/product-overview.service';
import {
  CreateProductOverviewDto,
  UpdateProductOverviewDto,
} from '../dto/product-overview.dto';
import type { ProductOverview as ProductOverviewType } from '@sansa-dev/shared';
import { ContextErrorFactory } from '@sansa-dev/shared';

/**
 * ProductOverviewService
 *
 * Service for managing product overview content within workspaces.
 * Provides CRUD operations for product descriptions and business context.
 */
@Injectable()
export class ProductOverviewService {
  private readonly logger = new Logger(ProductOverviewService.name);

  constructor(
    private readonly productOverviewDatabaseService: ProductOverviewDatabaseService,
  ) {}

  /**
   * Create a new product overview for a workspace
   *
   * @param userId - ID of the user creating the overview
   * @param dto - Product overview creation data
   * @returns Created product overview
   */
  async createProductOverview(
    userId: string,
    dto: CreateProductOverviewDto,
  ): Promise<ProductOverviewType> {
    try {
      this.logger.debug(
        `Creating product overview for workspace: ${dto.workspaceId}`,
      );

      // Check if an overview already exists for this workspace
      const existing =
        await this.productOverviewDatabaseService.findByWorkspaceAndUser(
          dto.workspaceId,
          userId,
        );

      if (existing) {
        throw ContextErrorFactory.productOverviewAlreadyExists(dto.workspaceId);
      }

      // Create new product overview
      const saved = await this.productOverviewDatabaseService.create({
        userId,
        workspaceId: dto.workspaceId,
        content: dto.content,
      });

      this.logger.log(
        `Created product overview ${saved.id} for workspace ${dto.workspaceId}`,
      );
      return this.entityToProductOverview(saved);
    } catch (error) {
      this.logger.error(
        `Failed to create product overview for workspace ${dto.workspaceId}:`,
        error,
      );
      if (error instanceof Error) {
        throw ContextErrorFactory.productOverviewCreateFailed(
          dto.workspaceId,
          error.message,
        );
      }
      throw ContextErrorFactory.productOverviewCreateFailed(
        dto.workspaceId,
        'Unknown error occurred',
      );
    }
  }

  /**
   * Get product overview for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   * @returns Product overview or null if not found
   */
  async getProductOverview(
    workspaceId: string,
    userId: string,
  ): Promise<ProductOverviewType | null> {
    try {
      this.logger.debug(
        `Getting product overview for workspace: ${workspaceId}`,
      );

      const overview =
        await this.productOverviewDatabaseService.findByWorkspaceAndUser(
          workspaceId,
          userId,
        );

      if (!overview) {
        return null;
      }

      return this.entityToProductOverview(overview);
    } catch (error) {
      this.logger.error(
        `Failed to get product overview for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update product overview for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   * @param dto - Update data
   * @returns Updated product overview
   */
  async updateProductOverview(
    workspaceId: string,
    userId: string,
    dto: UpdateProductOverviewDto,
  ): Promise<ProductOverviewType> {
    try {
      this.logger.debug(
        `Updating product overview for workspace: ${workspaceId}`,
      );

      const overview =
        await this.productOverviewDatabaseService.findByWorkspaceAndUser(
          workspaceId,
          userId,
        );

      if (!overview) {
        throw ContextErrorFactory.productOverviewNotFound(workspaceId);
      }

      // Update fields
      const updateData: any = {};
      if (dto.content !== undefined) {
        updateData.content = dto.content;
      }

      const saved = await this.productOverviewDatabaseService.update(
        overview.id,
        updateData,
      );

      this.logger.log(
        `Updated product overview ${saved.id} for workspace ${workspaceId}`,
      );
      return this.entityToProductOverview(saved);
    } catch (error) {
      this.logger.error(
        `Failed to update product overview for workspace ${workspaceId}:`,
        error,
      );
      if (error instanceof Error) {
        throw ContextErrorFactory.productOverviewUpdateFailed(
          workspaceId,
          error.message,
        );
      }
      throw ContextErrorFactory.productOverviewUpdateFailed(
        workspaceId,
        'Unknown error occurred',
      );
    }
  }

  /**
   * Delete product overview for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   */
  async deleteProductOverview(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Deleting product overview for workspace: ${workspaceId}`,
      );

      await this.productOverviewDatabaseService.deleteByWorkspaceAndUser(
        workspaceId,
        userId,
      );

      this.logger.log(`Deleted product overview for workspace ${workspaceId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete product overview for workspace ${workspaceId}:`,
        error,
      );
      if (error instanceof Error) {
        throw ContextErrorFactory.productOverviewDeleteFailed(
          workspaceId,
          error.message,
        );
      }
      throw ContextErrorFactory.productOverviewDeleteFailed(
        workspaceId,
        'Unknown error occurred',
      );
    }
  }

  /**
   * Check if a product overview exists for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   * @returns True if overview exists, false otherwise
   */
  async productOverviewExists(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      return await this.productOverviewDatabaseService.exists(
        workspaceId,
        userId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to check product overview existence for workspace ${workspaceId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Convert entity to shared type
   *
   * @param entity - ProductOverview entity
   * @returns ProductOverview shared type
   */
  private entityToProductOverview(
    entity: ProductOverview,
  ): ProductOverviewType {
    return {
      id: entity.id,
      workspaceId: entity.workspaceId,
      userId: entity.userId,
      content: entity.content,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
