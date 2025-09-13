import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { OpenWorkspaceSessionRequest } from '@sansa-dev/shared';

/**
 * DTO for opening a workspace session
 *
 * This creates a new container session for an existing workspace.
 * The workspace must exist and be owned by the authenticated user.
 */
export class CreateSessionDto implements OpenWorkspaceSessionRequest {
  /**
   * Workspace ID to open a session for
   */
  @ApiProperty({
    description:
      'ID of the workspace to open a session for. The workspace must exist and be owned by the authenticated user.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  workspaceId: string;
}
