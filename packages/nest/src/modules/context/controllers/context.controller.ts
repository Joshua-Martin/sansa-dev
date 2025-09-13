import {
  Controller,
  Get,
  Delete,
  Param,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RbacGuard } from '../../../shared/guards/rbac.guard';
import { CurrentUserId } from '../../../shared/decorators/current-user.decorator';
import { ContextService } from '../services/context.service';
import type { Context, ContextSummary } from '@sansa-dev/shared';

/**
 * ContextController
 *
 * Main REST API endpoints for managing complete context data within workspaces.
 * Provides unified API for fetching all context items at once.
 */
@ApiTags('context')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('context')
export class ContextController {
  constructor(private readonly contextService: ContextService) {}

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get complete context for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Complete context retrieved successfully',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getContext(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<Context> {
    return this.contextService.getContext(workspaceId, userId);
  }

  @Get(':workspaceId/summary')
  @ApiOperation({ summary: 'Get context summary for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Context summary retrieved successfully',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getContextSummary(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<ContextSummary> {
    return this.contextService.getContextSummary(workspaceId, userId);
  }

  @Delete(':workspaceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all context data for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'All context data deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async deleteWorkspaceContext(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<void> {
    return this.contextService.deleteWorkspaceContext(workspaceId, userId);
  }
}
