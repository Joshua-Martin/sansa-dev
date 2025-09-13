import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CreateWorkspaceRequest,
  ListWorkspacesRequest,
  SaveWorkspaceRequest,
  UpdateWorkspaceRequest,
} from '@sansa-dev/shared';

/**
 * DTO for creating a new persistent workspace
 */
export class CreateWorkspaceDto implements CreateWorkspaceRequest {
  /**
   * Optional user-friendly name for the workspace
   */
  @ApiPropertyOptional({
    description: 'Optional user-friendly name for the workspace',
    example: 'My Landing Page Project',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * Template ID to initialize the workspace with (optional - can create blank workspace)
   */
  @ApiPropertyOptional({
    description:
      'Template ID to initialize the workspace with. If not provided, creates a blank workspace.',
    example: 'base',
  })
  @IsOptional()
  @IsString()
  templateId?: string;
}

/**
 * DTO for updating workspace metadata
 */
export class UpdateWorkspaceDto implements UpdateWorkspaceRequest {
  /**
   * Updated workspace name
   */
  @ApiPropertyOptional({
    description: 'Updated workspace name',
    example: 'My Updated Project Name',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  name?: string;
}

/**
 * DTO for saving workspace data
 */
export class SaveWorkspaceDto implements SaveWorkspaceRequest {
  /**
   * Workspace ID to save (required for security validation)
   */
  @ApiProperty({
    description: 'Workspace ID to save',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  workspaceId: string;

  /**
   * Session ID to save (required for security validation)
   */
  @ApiProperty({
    description: 'Session ID to save',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  sessionId: string;
}

/**
 * Query parameters for listing workspaces
 */
export class ListWorkspacesQueryDto implements ListWorkspacesRequest {
  /**
   * Number of workspaces to return (pagination)
   */
  @ApiPropertyOptional({
    description: 'Number of workspaces to return',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;

  /**
   * Number of workspaces to skip (pagination)
   */
  @ApiPropertyOptional({
    description: 'Number of workspaces to skip for pagination',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number;

  /**
   * Field to sort by
   */
  @ApiPropertyOptional({
    description: 'Field to sort workspaces by',
    enum: ['createdAt', 'lastAccessedAt', 'name'],
    example: 'lastAccessedAt',
  })
  @IsOptional()
  @IsString()
  orderBy?: 'createdAt' | 'lastAccessedAt' | 'name';

  /**
   * Sort direction
   */
  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @IsOptional()
  @IsString()
  orderDirection?: 'ASC' | 'DESC';

  /**
   * Filter by template ID
   */
  @ApiPropertyOptional({
    description: 'Filter workspaces by template ID',
    example: 'base',
  })
  @IsOptional()
  @IsString()
  templateId?: string;

  /**
   * Search by workspace name (case-insensitive partial match)
   */
  @ApiPropertyOptional({
    description: 'Search workspaces by name (case-insensitive partial match)',
    example: 'landing',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
