import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { WorkspaceService } from '../services/workspace.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  ListWorkspacesQueryDto,
  SaveWorkspaceDto,
} from '../dto/workspace.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../shared/decorators/current-user.decorator';
import type {
  WorkspaceResponse,
  ListWorkspacesResponse,
  SaveWorkspaceResponse,
  Workspace,
} from '@sansa-dev/shared';

/**
 * Workspace Controller
 *
 * Provides REST API endpoints for managing persistent workspace entities.
 * This controller handles all workspace-related operations that don't involve
 * active container sessions (those are handled by SessionController).
 *
 * Endpoints:
 * - POST /workspaces - Create new workspace
 * - GET /workspaces - List user's workspaces
 * - GET /workspaces/:workspaceId - Get workspace details
 * - PUT /workspaces/:workspaceId - Update workspace metadata
 * - DELETE /workspaces/:workspaceId - Delete workspace
 * - POST /workspaces/:workspaceId/save - Save workspace data from active session
 */
@ApiTags('workspaces')
@Controller({ path: 'workspaces', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  /**
   * Create a new persistent workspace
   */
  @Post()
  @ApiOperation({
    summary: 'Create workspace',
    description:
      'Creates a new persistent workspace with default configuration. The workspace will be ready to have sessions opened against it.',
  })
  @ApiBody({
    type: CreateWorkspaceDto,
    description: 'Workspace creation parameters',
  })
  @ApiResponse({
    status: 201,
    description: 'Workspace created successfully',
    schema: {
      type: 'object',
      properties: {
        workspace: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string', nullable: true },
            templateId: { type: 'string' },
            storageKey: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            lastAccessedAt: { type: 'string', format: 'date-time' },
            lastSavedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            metadata: { type: 'object', nullable: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters or workspace creation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async createWorkspace(
    @CurrentUserId() userId: string,
    @Body() createDto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponse> {
    return this.workspaceService.createWorkspace(userId, createDto);
  }

  /**
   * List user's workspaces with filtering and pagination
   */
  @Get()
  @ApiOperation({
    summary: 'List workspaces',
    description:
      "Retrieves a paginated list of the authenticated user's workspaces with optional filtering and sorting.",
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of workspaces to return',
    type: 'number',
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of workspaces to skip',
    type: 'number',
    required: false,
    example: 0,
  })
  @ApiQuery({
    name: 'orderBy',
    description: 'Field to sort by',
    enum: ['createdAt', 'lastAccessedAt', 'name'],
    required: false,
    example: 'lastAccessedAt',
  })
  @ApiQuery({
    name: 'orderDirection',
    description: 'Sort direction',
    enum: ['ASC', 'DESC'],
    required: false,
    example: 'DESC',
  })
  @ApiQuery({
    name: 'templateId',
    description: 'Filter by template ID',
    type: 'string',
    required: false,
    example: 'base',
  })
  @ApiQuery({
    name: 'search',
    description: 'Search by workspace name',
    type: 'string',
    required: false,
    example: 'landing',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspaces retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        workspaces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              userId: { type: 'string', format: 'uuid' },
              name: { type: 'string', nullable: true },
              templateId: { type: 'string' },
              storageKey: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              lastAccessedAt: { type: 'string', format: 'date-time' },
              lastSavedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              metadata: { type: 'object', nullable: true },
              activeSessionId: {
                type: 'string',
                format: 'uuid',
                nullable: true,
              },
              hasActiveSession: { type: 'boolean' },
              sessionStatus: { type: 'string', nullable: true },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async listWorkspaces(
    @CurrentUserId() userId: string,
    @Query() query: ListWorkspacesQueryDto,
  ): Promise<ListWorkspacesResponse> {
    return this.workspaceService.listWorkspaces(userId, query);
  }

  /**
   * Get workspace details by ID
   */
  @Get(':workspaceId')
  @ApiOperation({
    summary: 'Get workspace',
    description:
      'Retrieves detailed information about a specific workspace owned by the authenticated user.',
  })
  @ApiParam({
    name: 'workspaceId',
    description: 'Workspace UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: 'string', format: 'uuid' },
        name: { type: 'string', nullable: true },
        templateId: { type: 'string' },
        storageKey: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        lastAccessedAt: { type: 'string', format: 'date-time' },
        lastSavedAt: { type: 'string', format: 'date-time', nullable: true },
        metadata: { type: 'object', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Workspace not found or not owned by user',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async getWorkspace(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<Workspace> {
    return this.workspaceService.getWorkspace(workspaceId, userId);
  }

  /**
   * Update workspace metadata
   */
  @Put(':workspaceId')
  @ApiOperation({
    summary: 'Update workspace',
    description:
      'Updates workspace metadata such as name. Only non-functional properties can be updated through this endpoint.',
  })
  @ApiParam({
    name: 'workspaceId',
    description: 'Workspace UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateWorkspaceDto,
    description: 'Workspace update parameters',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace updated successfully',
    schema: {
      type: 'object',
      properties: {
        workspace: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string', nullable: true },
            templateId: { type: 'string' },
            storageKey: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            lastAccessedAt: { type: 'string', format: 'date-time' },
            lastSavedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            metadata: { type: 'object', nullable: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Workspace not found or not owned by user',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async updateWorkspace(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() updateDto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponse> {
    return this.workspaceService.updateWorkspace(
      workspaceId,
      userId,
      updateDto,
    );
  }

  /**
   * Delete workspace
   */
  @Delete(':workspaceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete workspace',
    description:
      'Deletes a workspace and all associated data. Requires that all active sessions are closed first.',
  })
  @ApiParam({
    name: 'workspaceId',
    description: 'Workspace UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Workspace deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Workspace not found or not owned by user',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete workspace with active sessions',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async deleteWorkspace(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<void> {
    await this.workspaceService.deleteWorkspace(workspaceId, userId);
  }

  /**
   * Save workspace data from active session
   */
  @Post(':workspaceId/save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save workspace',
    description:
      'Saves the current state of the workspace by creating an archive from the active session container and updating workspace metadata.',
  })
  @ApiParam({
    name: 'workspaceId',
    description: 'Workspace UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: SaveWorkspaceDto,
    description: 'Save operation parameters',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace saved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        savedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'No active session found for workspace or save operation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Workspace not found or not owned by user',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async saveWorkspace(
    @CurrentUserId() userId: string,
    @Body() saveDto: SaveWorkspaceDto,
  ): Promise<SaveWorkspaceResponse> {
    return this.workspaceService.saveWorkspace(saveDto, userId);
  }
}
