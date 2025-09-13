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
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RbacGuard } from '../../../shared/guards/rbac.guard';
import { CurrentUserId } from '../../../shared/decorators/current-user.decorator';
import { BrandImageService } from '../services/brand-image.service';
import {
  UploadBrandImageDto,
  UpdateBrandImageMetadataDto,
} from '../dto/brand-image.dto';
import type { BrandImage } from '@sansa-dev/shared';

/**
 * BrandImageController
 *
 * REST API endpoints for managing brand images within workspaces.
 * Handles file uploads and metadata management for brand board images.
 */
@ApiTags('context')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('brand-images')
export class BrandImageController {
  constructor(private readonly brandImageService: BrandImageService) {}

  @Post(':workspaceId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload brand image for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Brand image upload data',
    type: UploadBrandImageDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Brand image uploaded successfully',
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
  async uploadBrandImage(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UploadBrandImageDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(png|jpeg|jpg|webp|gif|svg)/,
          }),
        ],
      }),
    )
    file: any,
  ): Promise<BrandImage> {
    dto.workspaceId = workspaceId;

    return this.brandImageService.uploadBrandImage(
      userId,
      file.buffer,
      file.originalname,
      file.mimetype,
      dto,
    );
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get all brand images for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand images retrieved successfully',
    type: [Object],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getBrandImages(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<BrandImage[]> {
    return this.brandImageService.getBrandImages(workspaceId, userId);
  }

  @Get(':workspaceId/:imageId')
  @ApiOperation({ summary: 'Get specific brand image' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'imageId', description: 'Image ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand image retrieved successfully',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Brand image not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getBrandImage(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('imageId') imageId: string,
  ): Promise<BrandImage | null> {
    return this.brandImageService.getBrandImage(imageId, userId);
  }

  @Put(':workspaceId/:imageId/metadata')
  @ApiOperation({ summary: 'Update brand image metadata' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'imageId', description: 'Image ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand image metadata updated successfully',
    type: 'object',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Brand image not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async updateBrandImageMetadata(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('imageId') imageId: string,
    @Body() dto: UpdateBrandImageMetadataDto,
  ): Promise<BrandImage> {
    return this.brandImageService.updateBrandImageMetadata(
      imageId,
      userId,
      dto,
    );
  }

  @Delete(':workspaceId/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete brand image' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'imageId', description: 'Image ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Brand image deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Brand image not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async deleteBrandImage(
    @CurrentUserId() userId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('imageId') imageId: string,
  ): Promise<void> {
    return this.brandImageService.deleteBrandImage(imageId, userId);
  }
}
