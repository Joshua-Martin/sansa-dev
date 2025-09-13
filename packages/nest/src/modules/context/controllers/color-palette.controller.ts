import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
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
import { ColorPaletteService } from '../services/color-palette.service';
import {
  CreateColorPaletteDto,
  UpdateColorPaletteDto,
  UpdateColorPaletteMetadataDto,
} from '../dto/color-palette.dto';
import type { ColorPalette } from '@sansa-dev/shared';

/**
 * ColorPaletteController
 *
 * REST API endpoints for managing color palettes within workspaces.
 * Provides CRUD operations for brand color schemes.
 */
@ApiTags('context')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('color-palette')
export class ColorPaletteController {
  constructor(private readonly colorPaletteService: ColorPaletteService) {}

  @Post(':workspaceId')
  @ApiOperation({ summary: 'Create color palette for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Color palette created successfully',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data or palette already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async createColorPalette(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateColorPaletteDto,
  ): Promise<ColorPalette> {
    dto.workspaceId = workspaceId;
    return this.colorPaletteService.createColorPalette(userId, dto);
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get color palette for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Color palette retrieved successfully',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Color palette not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getColorPalette(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<ColorPalette | null> {
    return this.colorPaletteService.getColorPalette(workspaceId, userId);
  }

  @Put(':workspaceId')
  @ApiOperation({ summary: 'Update color palette for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Color palette updated successfully',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Color palette not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async updateColorPalette(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateColorPaletteDto,
  ): Promise<ColorPalette> {
    return this.colorPaletteService.updateColorPalette(
      workspaceId,
      userId,
      dto,
    );
  }

  @Put(':workspaceId/metadata')
  @ApiOperation({ summary: 'Update color palette metadata for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Color palette metadata updated successfully',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Color palette not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async updateColorPaletteMetadata(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateColorPaletteMetadataDto,
  ): Promise<ColorPalette> {
    return this.colorPaletteService.updateColorPaletteMetadata(
      workspaceId,
      userId,
      dto,
    );
  }

  @Delete(':workspaceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete color palette for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Color palette deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Color palette not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async deleteColorPalette(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<void> {
    return this.colorPaletteService.deleteColorPalette(workspaceId, userId);
  }
}
