import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
  Res,
  HttpException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SessionService } from '../services/session/session.service';
import { CreateSessionDto } from '../dto/session.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../shared/decorators/current-user.decorator';
import type {
  CreateWorkspaceResponse,
  WorkspaceStatusResponse,
  SaveWorkspaceResponse,
} from '@sansa-dev/shared';
import { Response } from 'express';
import { createHash } from 'crypto';

/**
 * Session Controller
 *
 * Handles workspace session operations including:
 * - Creating new sessions for existing workspaces
 * - Managing session lifecycle (status, activity, deletion)
 * - Container operations and metrics
 * - Session-specific operations like activity tracking
 */
@ApiTags('sessions')
@Controller({ path: 'sessions', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  // Simple in-memory rate limiter for status endpoint
  private rateLimitCache = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute per user

  /**
   * Check and update rate limit for a user
   */
  private checkRateLimit(userId: string): void {
    const now = Date.now();
    const userLimit = this.rateLimitCache.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize rate limit
      this.rateLimitCache.set(userId, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW,
      });
      return;
    }

    if (userLimit.count >= this.RATE_LIMIT_MAX_REQUESTS) {
      throw new HttpException(
        `Rate limit exceeded. Maximum ${this.RATE_LIMIT_MAX_REQUESTS} requests per minute.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    userLimit.count++;
  }

  /**
   * Generate ETag for workspace status
   */
  private generateETag(status: WorkspaceStatusResponse): string {
    const hash = createHash('md5');
    hash.update(
      JSON.stringify({
        sessionId: status.sessionId,
        status: status.status,
        isReady: status.isReady,
        error: status.error,
        metrics: status.metrics,
      }),
    );
    return `"${hash.digest('hex')}"`;
  }

  /**
   * Create a new session for an existing workspace
   */
  @Post()
  @ApiOperation({
    summary: 'Create workspace session',
    description:
      'Opens a new session for an existing workspace by creating a Docker container and loading saved workspace files.',
  })
  @ApiBody({
    type: CreateSessionDto,
    description: 'Session creation parameters',
  })
  @ApiResponse({
    status: 201,
    description: 'Workspace session created successfully',
    schema: {
      type: 'object',
      properties: {
        session: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            workspaceId: { type: 'string', format: 'uuid' },
            containerName: { type: 'string' },
            status: {
              type: 'string',
              enum: [
                'creating',
                'initializing',
                'running',
                'stopping',
                'stopped',
                'error',
              ],
            },
            previewUrl: { type: 'string' },
            port: { type: 'number' },
            isReady: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        estimatedReadyTime: {
          type: 'number',
          description: 'Estimated time in seconds until session is ready',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters or session creation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Workspace not found or not owned by user',
  })
  async createSession(
    @CurrentUserId() userId: string,
    @Body() createDto: CreateSessionDto,
  ): Promise<CreateWorkspaceResponse> {
    // Create session for the workspace
    return this.sessionService.createSession(userId, createDto);
  }

  /**
   * Get workspace session status and metrics
   */
  @Get(':sessionId/status')
  @ApiOperation({
    summary: 'Get session status',
    description:
      'Retrieves current status, readiness, and performance metrics for a workspace session',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Workspace session UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Session status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', format: 'uuid' },
        status: {
          type: 'string',
          enum: [
            'creating',
            'initializing',
            'running',
            'stopping',
            'stopped',
            'error',
          ],
        },
        isReady: { type: 'boolean' },
        previewUrl: { type: 'string', nullable: true },
        error: { type: 'string', nullable: true },
        metrics: {
          type: 'object',
          properties: {
            cpuUsage: { type: 'number', description: 'CPU usage percentage' },
            memoryUsage: {
              type: 'number',
              description: 'Memory usage in MB',
            },
            networkIn: {
              type: 'number',
              description: 'Network bytes received',
            },
            networkOut: { type: 'number', description: 'Network bytes sent' },
            uptime: {
              type: 'number',
              description: 'Container uptime in seconds',
            },
            buildTime: {
              type: 'number',
              description: 'Last build time in seconds',
              nullable: true,
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async getSessionStatus(
    @CurrentUserId() userId: string,
    @Param('sessionId') sessionId: string,
    @Headers('if-none-match') ifNoneMatch?: string,
    @Res({ passthrough: true }) response?: Response,
  ): Promise<WorkspaceStatusResponse> {
    // Check rate limit
    this.checkRateLimit(userId);

    // Update activity
    await this.sessionService.updateActivity(sessionId, userId);

    const status = await this.sessionService.getSessionStatus(
      sessionId,
      userId,
    );

    // Generate ETag for conditional requests
    const etag = this.generateETag(status);

    // Set ETag header
    if (response) {
      response.setHeader('ETag', etag);

      // Check conditional request
      if (ifNoneMatch && ifNoneMatch === etag) {
        response.status(HttpStatus.NOT_MODIFIED);
        return {} as WorkspaceStatusResponse; // This won't be returned due to 304
      }
    }

    return status;
  }

  /**
   * Delete workspace session and cleanup resources
   */
  @Delete(':sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete session',
    description:
      'Stops container, cleans up resources, and removes workspace session',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Workspace session UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Session deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async deleteSession(
    @CurrentUserId() userId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<void> {
    await this.sessionService.deleteSession(sessionId, userId);
  }

  /**
   * Update workspace session activity (for activity tracking)
   */
  @Post(':sessionId/activity')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update session activity',
    description:
      'Updates the activity level and timestamp for the workspace session',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Workspace session UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Activity updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async updateActivity(
    @CurrentUserId() userId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<void> {
    await this.sessionService.updateActivity(sessionId, userId);
  }

  /**
   * Save workspace session changes to persistent storage
   */
  @Post(':sessionId/save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save session',
    description:
      'Creates a compressed archive of the workspace files and saves it to persistent storage',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Workspace session UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Session saved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        savedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or save operation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async saveSession(
    @CurrentUserId() userId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<SaveWorkspaceResponse> {
    return this.sessionService.saveSession(sessionId, userId);
  }
}
