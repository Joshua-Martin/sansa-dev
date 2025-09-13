import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a product overview
 */
export class CreateProductOverviewDto {
  @ApiProperty({
    description: 'Workspace ID where the product overview belongs',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({
    description: 'Content of the product overview',
    example:
      'Our product helps businesses automate their marketing workflows...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

/**
 * DTO for updating a product overview
 */
export class UpdateProductOverviewDto {
  @ApiProperty({
    description: 'Updated content of the product overview',
    example:
      'Our updated product helps businesses automate their marketing workflows...',
    required: false,
  })
  @IsString()
  content?: string;
}
