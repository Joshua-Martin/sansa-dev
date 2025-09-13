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
import { ProductOverviewService } from '../services/product-overview.service';
import {
  CreateProductOverviewDto,
  UpdateProductOverviewDto,
} from '../dto/product-overview.dto';
import type { ProductOverview } from '@sansa-dev/shared';

/**
 * ProductOverviewController
 *
 * REST API endpoints for managing product overview content within workspaces.
 * Provides CRUD operations for product descriptions and business context.
 */
@ApiTags('context')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('product-overview')
export class ProductOverviewController {
  constructor(
    private readonly productOverviewService: ProductOverviewService,
  ) {}

  @Post(':workspaceId')
  @ApiOperation({ summary: 'Create product overview for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product overview created successfully',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data or overview already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async createProductOverview(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateProductOverviewDto,
  ): Promise<ProductOverview> {
    // Override workspaceId from URL param
    dto.workspaceId = workspaceId;

    return this.productOverviewService.createProductOverview(userId, dto);
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get product overview for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product overview retrieved successfully',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product overview not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getProductOverview(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<ProductOverview | null> {
    return this.productOverviewService.getProductOverview(workspaceId, userId);
  }

  @Put(':workspaceId')
  @ApiOperation({ summary: 'Update product overview for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product overview updated successfully',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product overview not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async updateProductOverview(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateProductOverviewDto,
  ): Promise<ProductOverview> {
    return this.productOverviewService.updateProductOverview(
      workspaceId,
      userId,
      dto,
    );
  }

  @Delete(':workspaceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product overview for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Product overview deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product overview not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async deleteProductOverview(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<void> {
    return this.productOverviewService.deleteProductOverview(
      workspaceId,
      userId,
    );
  }
}
