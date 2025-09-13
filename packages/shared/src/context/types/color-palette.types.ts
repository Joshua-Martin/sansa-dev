/**
 * Color palette types for managing brand color schemes
 *
 * Color palettes define the visual color identity of a brand. They include
 * primary, secondary, and accent colors with support for accessibility validation,
 * harmony analysis, and export to various formats for design tools.
 */

/**
 * Basic color object for the design system
 */
export interface Color {
  /** Unique identifier */
  id: string;

  /** Human-readable name for the color */
  name: string;

  /** Hex color value (e.g., "#FF5733") */
  hex: string;

  /** Role of the color in the design system */
  role:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'neutral'
    | 'success'
    | 'warning'
    | 'error'
    | 'info';

  /** Category for organizing the color */
  category: 'brand' | 'semantic' | 'neutral' | 'accent';
}

/**
 * Color palette object for the design system
 */
export interface ColorPalette {
  /** Unique identifier */
  id: string;

  /** ID of the user who owns this palette */
  userId: string;

  /** ID of the project this palette belongs to */
  workspaceId: string;

  /** Name of the palette */
  name: string;

  /** Array of colors in this palette */
  colors: Color[];

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}
