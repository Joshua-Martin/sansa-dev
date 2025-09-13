import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for uploading a brand image
 */
export class UploadBrandImageDto {
  @ApiProperty({
    description: 'Workspace ID where the brand image belongs',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;

  @ApiPropertyOptional({
    description: 'Alternative text for the image',
    example: 'Brand inspiration image',
  })
  @IsString()
  @IsOptional()
  altText?: string;

  @ApiPropertyOptional({
    description: 'Description of the image',
    example: 'Image showing our brand aesthetic and style',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * DTO for updating brand image metadata
 */
export class UpdateBrandImageMetadataDto {
  @ApiPropertyOptional({
    description: 'Alternative text for the image',
    example: 'Updated brand inspiration image',
  })
  @IsString()
  @IsOptional()
  altText?: string;

  @ApiPropertyOptional({
    description: 'Description of the image',
    example: 'Updated description of brand aesthetic',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
