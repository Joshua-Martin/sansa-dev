import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ColorPalette } from '../../../shared/database/entities/color-palette.entity';
import { ColorPaletteService as ColorPaletteDatabaseService } from '../../../shared/database/services/color-palette.service';
import {
  CreateColorPaletteDto,
  UpdateColorPaletteDto,
  UpdateColorPaletteMetadataDto,
} from '../dto/color-palette.dto';
import type { ColorPalette as ColorPaletteType } from '@sansa-dev/shared';
import { ContextErrorFactory } from '@sansa-dev/shared';

/**
 * ColorPaletteService
 *
 * Service for managing color palettes within workspaces.
 * Provides CRUD operations for brand color schemes.
 */
@Injectable()
export class ColorPaletteService {
  private readonly logger = new Logger(ColorPaletteService.name);

  constructor(
    private readonly colorPaletteDatabaseService: ColorPaletteDatabaseService,
  ) {}

  /**
   * Create a new color palette for a workspace
   *
   * @param userId - ID of the user creating the palette
   * @param dto - Color palette creation data
   * @returns Created color palette
   */
  async createColorPalette(
    userId: string,
    dto: CreateColorPaletteDto,
  ): Promise<ColorPaletteType> {
    try {
      this.logger.debug(
        `Creating color palette for workspace: ${dto.workspaceId}`,
      );

      // Validate hex colors
      this.validateHexColors([
        dto.primary,
        dto.secondary,
        dto.accent,
        dto.neutral,
      ]);

      // Check if a palette already exists for this workspace
      const existing =
        await this.colorPaletteDatabaseService.findByWorkspaceAndUser(
          dto.workspaceId,
          userId,
        );

      if (existing) {
        throw ContextErrorFactory.colorPaletteAlreadyExists(dto.workspaceId);
      }

      // Create color palette with Color[] structure
      const colors = [
        {
          id: `${Date.now()}-primary`,
          name: 'Primary',
          hex: dto.primary,
          role: 'primary' as const,
          category: 'brand' as const,
        },
        {
          id: `${Date.now()}-secondary`,
          name: 'Secondary',
          hex: dto.secondary,
          role: 'secondary' as const,
          category: 'brand' as const,
        },
        {
          id: `${Date.now()}-accent`,
          name: 'Accent',
          hex: dto.accent,
          role: 'accent' as const,
          category: 'accent' as const,
        },
        {
          id: `${Date.now()}-neutral`,
          name: 'Neutral',
          hex: dto.neutral,
          role: 'neutral' as const,
          category: 'neutral' as const,
        },
      ];

      // Create new color palette
      const saved = await this.colorPaletteDatabaseService.create({
        userId,
        workspaceId: dto.workspaceId,
        name: dto.name,
        colors,
      });

      this.logger.log(
        `Created color palette ${saved.id} for workspace ${dto.workspaceId}`,
      );
      return this.entityToColorPalette(saved);
    } catch (error) {
      this.logger.error(
        `Failed to create color palette for workspace ${dto.workspaceId}:`,
        error,
      );
      if (error instanceof Error) {
        throw ContextErrorFactory.colorPaletteCreateFailed(
          dto.workspaceId,
          error.message,
        );
      }
      throw ContextErrorFactory.colorPaletteCreateFailed(
        dto.workspaceId,
        'Unknown error occurred',
      );
    }
  }

  /**
   * Get color palette for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   * @returns Color palette or null if not found
   */
  async getColorPalette(
    workspaceId: string,
    userId: string,
  ): Promise<ColorPaletteType | null> {
    try {
      this.logger.debug(`Getting color palette for workspace: ${workspaceId}`);

      const palette =
        await this.colorPaletteDatabaseService.findByWorkspaceAndUser(
          workspaceId,
          userId,
        );

      if (!palette) {
        return null;
      }

      return this.entityToColorPalette(palette);
    } catch (error) {
      this.logger.error(
        `Failed to get color palette for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update color palette for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   * @param dto - Update data
   * @returns Updated color palette
   */
  async updateColorPalette(
    workspaceId: string,
    userId: string,
    dto: UpdateColorPaletteDto,
  ): Promise<ColorPaletteType> {
    try {
      this.logger.debug(`Updating color palette for workspace: ${workspaceId}`);

      const palette =
        await this.colorPaletteDatabaseService.findByWorkspaceAndUser(
          workspaceId,
          userId,
        );

      if (!palette) {
        throw ContextErrorFactory.colorPaletteNotFound(workspaceId);
      }

      // Validate hex colors if provided
      const colorsToValidate = [];
      if (dto.primary) colorsToValidate.push(dto.primary);
      if (dto.secondary) colorsToValidate.push(dto.secondary);
      if (dto.accent) colorsToValidate.push(dto.accent);
      if (dto.neutral) colorsToValidate.push(dto.neutral);

      if (colorsToValidate.length > 0) {
        this.validateHexColors(colorsToValidate);
      }

      // Update fields
      const updateData: any = {};
      if (dto.name !== undefined) updateData.name = dto.name;

      // Update colors if any color properties are provided
      if (
        dto.primary !== undefined ||
        dto.secondary !== undefined ||
        dto.accent !== undefined ||
        dto.neutral !== undefined
      ) {
        const updatedColors = [...palette.colors];

        // Update each color role if provided
        const colorUpdates = [
          { role: 'primary', hex: dto.primary },
          { role: 'secondary', hex: dto.secondary },
          { role: 'accent', hex: dto.accent },
          { role: 'neutral', hex: dto.neutral },
        ];

        colorUpdates.forEach(({ role, hex }) => {
          if (hex !== undefined) {
            const existingIndex = updatedColors.findIndex(
              (c) => c.role === role,
            );
            if (existingIndex >= 0) {
              updatedColors[existingIndex] = {
                ...updatedColors[existingIndex],
                hex,
              };
            }
          }
        });

        updateData.colors = updatedColors;
      }

      const saved = await this.colorPaletteDatabaseService.update(
        palette.id,
        updateData,
      );

      this.logger.log(
        `Updated color palette ${saved.id} for workspace ${workspaceId}`,
      );
      return this.entityToColorPalette(saved);
    } catch (error) {
      this.logger.error(
        `Failed to update color palette for workspace ${workspaceId}:`,
        error,
      );
      if (error instanceof Error) {
        throw ContextErrorFactory.colorPaletteUpdateFailed(
          workspaceId,
          error.message,
        );
      }
      throw ContextErrorFactory.colorPaletteUpdateFailed(
        workspaceId,
        'Unknown error occurred',
      );
    }
  }

  /**
   * Update color palette metadata
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   * @param dto - Metadata update data
   * @returns Updated color palette
   */
  async updateColorPaletteMetadata(
    workspaceId: string,
    userId: string,
    dto: UpdateColorPaletteMetadataDto,
  ): Promise<ColorPaletteType> {
    try {
      this.logger.debug(
        `Updating color palette metadata for workspace: ${workspaceId}`,
      );

      const palette =
        await this.colorPaletteDatabaseService.findByWorkspaceAndUser(
          workspaceId,
          userId,
        );

      if (!palette) {
        throw ContextErrorFactory.colorPaletteNotFound(workspaceId);
      }

      // Update metadata
      const metadata: any = {};
      if (dto.description !== undefined) {
        metadata.description = dto.description;
      }
      if (dto.tags !== undefined) {
        metadata.tags = dto.tags;
      }
      if (dto.source !== undefined) {
        metadata.source = dto.source;
      }

      const saved = await this.colorPaletteDatabaseService.update(palette.id, {
        metadata,
      });

      this.logger.log(
        `Updated color palette metadata ${saved.id} for workspace ${workspaceId}`,
      );
      return this.entityToColorPalette(saved);
    } catch (error) {
      this.logger.error(
        `Failed to update color palette metadata for workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete color palette for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   */
  async deleteColorPalette(workspaceId: string, userId: string): Promise<void> {
    try {
      this.logger.debug(`Deleting color palette for workspace: ${workspaceId}`);

      await this.colorPaletteDatabaseService.deleteByWorkspaceAndUser(
        workspaceId,
        userId,
      );

      this.logger.log(`Deleted color palette for workspace ${workspaceId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete color palette for workspace ${workspaceId}:`,
        error,
      );
      if (error instanceof Error) {
        throw ContextErrorFactory.colorPaletteDeleteFailed(
          workspaceId,
          error.message,
        );
      }
      throw ContextErrorFactory.colorPaletteDeleteFailed(
        workspaceId,
        'Unknown error occurred',
      );
    }
  }

  /**
   * Check if a color palette exists for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   * @returns True if palette exists, false otherwise
   */
  async colorPaletteExists(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      return await this.colorPaletteDatabaseService.exists(workspaceId, userId);
    } catch (error) {
      this.logger.error(
        `Failed to check color palette existence for workspace ${workspaceId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Validate hex color format
   *
   * @param colors - Array of hex color strings to validate
   * @throws BadRequestException if any color is invalid
   */
  private validateHexColors(colors: string[]): void {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;

    for (const color of colors) {
      if (!hexRegex.test(color)) {
        throw ContextErrorFactory.colorPaletteInvalidHex(color);
      }
    }
  }

  /**
   * Convert entity to shared type
   *
   * @param entity - ColorPalette entity
   * @returns ColorPalette shared type
   */
  private entityToColorPalette(entity: ColorPalette): ColorPaletteType {
    return {
      id: entity.id,
      userId: entity.userId,
      workspaceId: entity.workspaceId,
      name: entity.name,
      colors: entity.colors,
      // isActive: true, // Since we removed isActive, all palettes are considered active - removed from shared type
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
