import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ColorPalette as IColorPalette, Color } from '@sansa-dev/shared';

/**
 * Color Palette Entity
 *
 * Stores color palettes that define the visual identity of a brand.
 * Each palette contains primary, secondary, accent, and neutral colors
 * that are used to provide consistent branding across projects.
 */
@Entity('color_palettes')
@Index(['workspaceId'])
@Index(['workspaceId', 'createdAt'])
export class ColorPalette {
  /**
   * Unique identifier for the color palette
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the workspace this palette belongs to
   */
  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  /**
   * ID of the user who owns this palette (derived from workspace)
   */
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  /**
   * Name of the color palette
   */
  @Column({ length: 255 })
  name: string;

  /**
   * Array of colors in this palette
   */
  @Column({ type: 'jsonb' })
  colors: Color[];

  /**
   * Additional metadata for the palette
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    description?: string;
    tags?: string[];
    source?: 'manual' | 'generated' | 'imported';
    accessibility?: {
      contrastRatio?: number;
      wcagCompliance?: 'AA' | 'AAA';
    };
  } | null;

  /**
   * When the palette was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  /**
   * When the palette was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  /**
   * Note: workspaceId references WorkspaceSessionEntity.id
   * Palettes are scoped to workspaces for proper isolation
   */

  /**
   * Business logic methods
   */

  /**
   * Check if the palette is accessible by a user
   */
  isAccessibleBy(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Get all colors as an object
   */
  getColors(): {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
  } {
    const colorMap = this.colors.reduce((acc, color) => {
      acc[color.role as keyof typeof acc] = color.hex;
      return acc;
    }, {} as any);

    return {
      primary: colorMap.primary || '',
      secondary: colorMap.secondary || '',
      accent: colorMap.accent || '',
      neutral: colorMap.neutral || '',
    };
  }

  /**
   * Get all colors as an array
   */
  getColorsArray(): Array<{ role: string; hex: string }> {
    return this.colors.map((color) => ({
      role: color.role,
      hex: color.hex,
    }));
  }

  /**
   * Validate that all colors are valid hex values
   */
  validateColors(): boolean {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    return this.colors.every((color) => hexRegex.test(color.hex));
  }

  /**
   * Update colors
   */
  updateColors(colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
    neutral?: string;
  }): void {
    // Update existing colors or add new ones
    const updatedColors = [...this.colors];

    Object.entries(colors).forEach(([role, hex]) => {
      if (hex) {
        const existingIndex = updatedColors.findIndex((c) => c.role === role);
        if (existingIndex >= 0) {
          updatedColors[existingIndex] = {
            ...updatedColors[existingIndex],
            hex,
          };
        } else {
          updatedColors.push({
            id: `${this.id}-${role}`,
            name: role.charAt(0).toUpperCase() + role.slice(1),
            hex,
            role: role as any,
            category: role === 'neutral' ? 'neutral' : 'brand',
          });
        }
      }
    });

    this.colors = updatedColors;
  }

  /**
   * Update metadata
   */
  updateMetadata(metadata: Partial<NonNullable<typeof this.metadata>>): void {
    this.metadata = {
      ...this.metadata,
      ...metadata,
    } as typeof this.metadata;
  }
}
