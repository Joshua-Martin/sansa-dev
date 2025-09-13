import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BrandAssetType } from '@sansa-dev/shared';

/**
 * DTO for uploading a brand asset
 */
export class UploadBrandAssetDto {
  @ApiProperty({
    description: 'Workspace ID where the brand asset belongs',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({
    description: 'Type of brand asset',
    example: 'logo',
    enum: ['logo', 'wordmark', 'icon'],
  })
  @IsEnum(['logo', 'wordmark', 'icon'])
  @IsNotEmpty()
  assetType: BrandAssetType;

  @ApiPropertyOptional({
    description: 'Alternative text for the asset',
    example: 'Company logo',
  })
  @IsString()
  @IsOptional()
  altText?: string;

  @ApiPropertyOptional({
    description: 'Description of the asset',
    example: 'Primary company logo for marketing materials',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Dominant color of the asset (hex value)',
    example: '#FF5733',
  })
  @IsString()
  @IsOptional()
  color?: string;
}

/**
 * DTO for updating brand asset metadata
 */
export class UpdateBrandAssetMetadataDto {
  @ApiPropertyOptional({
    description: 'Alternative text for the asset',
    example: 'Updated company logo',
  })
  @IsString()
  @IsOptional()
  altText?: string;

  @ApiPropertyOptional({
    description: 'Description of the asset',
    example: 'Updated description for marketing materials',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Dominant color of the asset (hex value)',
    example: '#33FF57',
  })
  @IsString()
  @IsOptional()
  color?: string;
}
