import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ColorPalette } from '../entities/color-palette.entity';
import { Color } from '@sansa-dev/shared';

/**
 * Database service for managing ColorPalette entities
 *
 * Provides all database operations for color palette data with proper
 * error handling, validation, and type safety.
 */
@Injectable()
export class ColorPaletteService {
  private readonly logger = new Logger(ColorPaletteService.name);

  constructor(
    @InjectRepository(ColorPalette)
    private readonly colorPaletteRepository: Repository<ColorPalette>,
  ) {}

  /**
   * Create a new color palette
   *
   * @param data - Color palette data
   * @returns Created color palette entity
   */
  async create(data: {
    userId: string;
    workspaceId: string;
    name: string;
    colors: Color[];
    metadata?: any;
  }): Promise<ColorPalette> {
    try {
      this.logger.debug(
        `Creating color palette for workspace: ${data.workspaceId}`,
      );

      const colorPalette = this.colorPaletteRepository.create({
        userId: data.userId,
        workspaceId: data.workspaceId,
        name: data.name,
        colors: data.colors,
        metadata: data.metadata,
      });

      const saved = await this.colorPaletteRepository.save(colorPalette);
      this.logger.log(`Created color palette ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `Failed to create color palette for workspace ${data.workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find color palette by workspace ID and user ID
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   * @returns Color palette entity or null if not found
   */
  async findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<ColorPalette | null> {
    try {
      return await this.colorPaletteRepository.findOne({
        where: { workspaceId, userId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find color palette for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find color palette by ID
   *
   * @param id - Color palette ID
   * @returns Color palette entity
   * @throws NotFoundException if not found
   */
  async findById(id: string): Promise<ColorPalette> {
    try {
      const colorPalette = await this.colorPaletteRepository.findOne({
        where: { id },
      });

      if (!colorPalette) {
        throw new NotFoundException(`Color palette with ID ${id} not found`);
      }

      return colorPalette;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find color palette ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update color palette
   *
   * @param id - Color palette ID
   * @param data - Update data
   * @returns Updated color palette entity
   * @throws NotFoundException if not found
   */
  async update(
    id: string,
    data: Partial<{
      name: string;
      colors: Array<{
        id: string;
        name: string;
        hex: string;
        role:
          | 'primary'
          | 'secondary'
          | 'accent'
          | 'neutral'
          | 'success'
          | 'warning'
          | 'error'
          | 'info';
        category: 'brand' | 'semantic' | 'neutral' | 'accent';
      }>;
      metadata: any;
    }>,
  ): Promise<ColorPalette> {
    try {
      this.logger.debug(`Updating color palette ${id}`);

      const colorPalette = await this.findById(id);

      // Update fields
      if (data.name !== undefined) colorPalette.name = data.name;
      if (data.colors !== undefined) colorPalette.colors = data.colors;
      if (data.metadata !== undefined) colorPalette.metadata = data.metadata;

      const saved = await this.colorPaletteRepository.save(colorPalette);
      this.logger.log(`Updated color palette ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to update color palette ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete color palette by ID
   *
   * @param id - Color palette ID
   * @throws NotFoundException if not found
   */
  async delete(id: string): Promise<void> {
    try {
      this.logger.debug(`Deleting color palette ${id}`);

      const colorPalette = await this.findById(id);
      await this.colorPaletteRepository.remove(colorPalette);

      this.logger.log(`Deleted color palette ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete color palette ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete color palette by workspace ID and user ID
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   */
  async deleteByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    try {
      this.logger.debug(`Deleting color palette for workspace ${workspaceId}`);

      const colorPalette = await this.findByWorkspaceAndUser(
        workspaceId,
        userId,
      );
      if (colorPalette) {
        await this.colorPaletteRepository.remove(colorPalette);
        this.logger.log(
          `Deleted color palette ${colorPalette.id} for workspace ${workspaceId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete color palette for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if color palette exists for workspace and user
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   * @returns True if exists, false otherwise
   */
  async exists(workspaceId: string, userId: string): Promise<boolean> {
    try {
      const count = await this.colorPaletteRepository.count({
        where: { workspaceId, userId },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(
        `Failed to check color palette existence for workspace ${workspaceId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Get all color palettes for a user
   *
   * @param userId - User ID
   * @returns Array of color palette entities
   */
  async findByUser(userId: string): Promise<ColorPalette[]> {
    try {
      return await this.colorPaletteRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find color palettes for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Count color palettes for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID
   * @returns Count of color palettes
   */
  async countByWorkspace(workspaceId: string, userId: string): Promise<number> {
    try {
      return await this.colorPaletteRepository.count({
        where: { workspaceId, userId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to count color palettes for workspace ${workspaceId}:`,
        error,
      );
      return 0;
    }
  }
}
