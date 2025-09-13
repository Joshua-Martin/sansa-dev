import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RbacGuard } from '../../../shared/guards/rbac.guard';
import { CurrentUserId } from '../../../shared/decorators/current-user.decorator';
import { BrandAssetService } from '../services/brand-asset.service';
import {
  UploadBrandAssetDto,
  UpdateBrandAssetMetadataDto,
} from '../dto/brand-asset.dto';
import type {
  BrandAsset,
  BrandAssetType as BrandAssetTypeEnum,
} from '@sansa-dev/shared';

/**
 * BrandAssetController
 *
 * REST API endpoints for managing brand assets (logos, wordmarks, icons) within workspaces.
 * Handles file uploads and metadata management.
 */
@ApiTags('context')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('brand-assets')
export class BrandAssetController {
  constructor(private readonly brandAssetService: BrandAssetService) {}

  @Post(':workspaceId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload brand asset for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Brand asset upload data',
    type: UploadBrandAssetDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Brand asset uploaded successfully',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or request data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async uploadBrandAsset(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UploadBrandAssetDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(png|jpeg|jpg|svg|webp)/,
          }),
        ],
      }),
    )
    file: any,
  ): Promise<BrandAsset> {
    dto.workspaceId = workspaceId;

    return this.brandAssetService.uploadBrandAsset(
      userId,
      file.buffer,
      file.originalname,
      file.mimetype,
      dto,
    );
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get all brand assets for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiQuery({
    name: 'assetType',
    required: false,
    description: 'Filter by asset type (logo, wordmark, icon)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand assets retrieved successfully',
    type: [Object],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getBrandAssets(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Query('assetType') assetType?: BrandAssetTypeEnum,
  ): Promise<BrandAsset[]> {
    return this.brandAssetService.getBrandAssets(
      workspaceId,
      userId,
      assetType,
    );
  }

  @Get(':workspaceId/:assetId')
  @ApiOperation({ summary: 'Get specific brand asset' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand asset retrieved successfully',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Brand asset not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getBrandAsset(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('assetId') assetId: string,
  ): Promise<BrandAsset | null> {
    return this.brandAssetService.getBrandAsset(assetId, userId);
  }

  @Put(':workspaceId/:assetId/metadata')
  @ApiOperation({ summary: 'Update brand asset metadata' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand asset metadata updated successfully',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Brand asset not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async updateBrandAssetMetadata(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('assetId') assetId: string,
    @Body() dto: UpdateBrandAssetMetadataDto,
  ): Promise<BrandAsset> {
    return this.brandAssetService.updateBrandAssetMetadata(
      assetId,
      userId,
      dto,
    );
  }

  @Delete(':workspaceId/:assetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete brand asset' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Brand asset deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Brand asset not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async deleteBrandAsset(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('assetId') assetId: string,
  ): Promise<void> {
    return this.brandAssetService.deleteBrandAsset(assetId, userId);
  }
}
