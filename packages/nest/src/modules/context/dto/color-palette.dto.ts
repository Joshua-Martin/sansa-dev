import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a color palette
 */
export class CreateColorPaletteDto {
  @ApiProperty({
    description: 'Workspace ID where the color palette belongs',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({
    description: 'Name of the color palette',
    example: 'Brand Primary Colors',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Primary brand color (hex value)',
    example: '#FF5733',
  })
  @IsString()
  @IsNotEmpty()
  primary: string;

  @ApiProperty({
    description: 'Secondary brand color (hex value)',
    example: '#33FF57',
  })
  @IsString()
  @IsNotEmpty()
  secondary: string;

  @ApiProperty({
    description: 'Accent color for highlights (hex value)',
    example: '#3357FF',
  })
  @IsString()
  @IsNotEmpty()
  accent: string;

  @ApiProperty({
    description: 'Neutral color for backgrounds (hex value)',
    example: '#F5F5F5',
  })
  @IsString()
  @IsNotEmpty()
  neutral: string;

  @ApiPropertyOptional({
    description: 'Whether this palette is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO for updating a color palette
 */
export class UpdateColorPaletteDto {
  @ApiPropertyOptional({
    description: 'Name of the color palette',
    example: 'Updated Brand Colors',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Primary brand color (hex value)',
    example: '#FF5733',
  })
  @IsString()
  @IsOptional()
  primary?: string;

  @ApiPropertyOptional({
    description: 'Secondary brand color (hex value)',
    example: '#33FF57',
  })
  @IsString()
  @IsOptional()
  secondary?: string;

  @ApiPropertyOptional({
    description: 'Accent color for highlights (hex value)',
    example: '#3357FF',
  })
  @IsString()
  @IsOptional()
  accent?: string;

  @ApiPropertyOptional({
    description: 'Neutral color for backgrounds (hex value)',
    example: '#F5F5F5',
  })
  @IsString()
  @IsOptional()
  neutral?: string;

  @ApiPropertyOptional({
    description: 'Whether this palette is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO for color palette metadata update
 */
export class UpdateColorPaletteMetadataDto {
  @ApiPropertyOptional({
    description: 'Description of the color palette',
    example: 'Professional color scheme for tech companies',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Tags for the color palette',
    example: ['professional', 'tech', 'modern'],
    type: [String],
  })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Source of the color palette',
    example: 'manual',
    enum: ['manual', 'generated', 'imported'],
  })
  @IsString()
  @IsOptional()
  source?: 'manual' | 'generated' | 'imported';
}
