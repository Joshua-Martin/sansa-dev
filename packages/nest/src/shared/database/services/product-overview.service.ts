import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductOverview } from '../entities/product-overview.entity';

/**
 * Database service for managing ProductOverview entities
 *
 * Provides all database operations for product overview data with proper
 * error handling, validation, and type safety.
 */
@Injectable()
export class ProductOverviewService {
  private readonly logger = new Logger(ProductOverviewService.name);

  constructor(
    @InjectRepository(ProductOverview)
    private readonly productOverviewRepository: Repository<ProductOverview>,
  ) {}

  /**
   * Create a new product overview
   *
   * @param data - Product overview data
   * @returns Created product overview entity
   */
  async create(data: {
    userId: string;
    workspaceId: string;
    content: string;
  }): Promise<ProductOverview> {
    try {
      this.logger.debug(
        `Creating product overview for workspace: ${data.workspaceId}`,
      );

      const productOverview = this.productOverviewRepository.create({
        userId: data.userId,
        workspaceId: data.workspaceId,
        content: data.content,
      });

      const saved = await this.productOverviewRepository.save(productOverview);
      this.logger.log(`Created product overview ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `Failed to create product overview for workspace ${data.workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find product overview by workspace ID and user ID
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   * @returns Product overview entity or null if not found
   */
  async findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<ProductOverview | null> {
    try {
      return await this.productOverviewRepository.findOne({
        where: { workspaceId, userId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find product overview for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find product overview by ID
   *
   * @param id - Product overview ID
   * @returns Product overview entity
   * @throws NotFoundException if not found
   */
  async findById(id: string): Promise<ProductOverview> {
    try {
      const productOverview = await this.productOverviewRepository.findOne({
        where: { id },
      });

      if (!productOverview) {
        throw new NotFoundException(`Product overview with ID ${id} not found`);
      }

      return productOverview;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find product overview ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update product overview
   *
   * @param id - Product overview ID
   * @param data - Update data
   * @returns Updated product overview entity
   * @throws NotFoundException if not found
   */
  async update(
    id: string,
    data: Partial<{
      content: string;
    }>,
  ): Promise<ProductOverview> {
    try {
      this.logger.debug(`Updating product overview ${id}`);

      const productOverview = await this.findById(id);

      // Update fields
      if (data.content !== undefined) productOverview.content = data.content;

      const saved = await this.productOverviewRepository.save(productOverview);
      this.logger.log(`Updated product overview ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to update product overview ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete product overview by ID
   *
   * @param id - Product overview ID
   * @throws NotFoundException if not found
   */
  async delete(id: string): Promise<void> {
    try {
      this.logger.debug(`Deleting product overview ${id}`);

      const productOverview = await this.findById(id);
      await this.productOverviewRepository.remove(productOverview);

      this.logger.log(`Deleted product overview ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete product overview ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete product overview by workspace ID and user ID
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   */
  async deleteByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Deleting product overview for workspace ${workspaceId}`,
      );

      const productOverview = await this.findByWorkspaceAndUser(
        workspaceId,
        userId,
      );
      if (productOverview) {
        await this.productOverviewRepository.remove(productOverview);
        this.logger.log(
          `Deleted product overview ${productOverview.id} for workspace ${workspaceId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete product overview for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if product overview exists for workspace and user
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   * @returns True if exists, false otherwise
   */
  async exists(workspaceId: string, userId: string): Promise<boolean> {
    try {
      const count = await this.productOverviewRepository.count({
        where: { workspaceId, userId },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(
        `Failed to check product overview existence for workspace ${workspaceId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Get all product overviews for a user
   *
   * @param userId - User ID
   * @returns Array of product overview entities
   */
  async findByUser(userId: string): Promise<ProductOverview[]> {
    try {
      return await this.productOverviewRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find product overviews for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Count product overviews for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   * @returns Count of product overviews
   */
  async countByWorkspace(workspaceId: string, userId: string): Promise<number> {
    try {
      return await this.productOverviewRepository.count({
        where: { workspaceId, userId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to count product overviews for workspace ${workspaceId}:`,
        error,
      );
      return 0;
    }
  }
}
