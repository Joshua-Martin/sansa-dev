import { Injectable, Logger } from '@nestjs/common';
import { ProductOverviewService } from './product-overview.service';
import { ColorPaletteService } from './color-palette.service';
import { BrandAssetService } from './brand-asset.service';
import { BrandImageService } from './brand-image.service';
import type { Context, ContextSummary } from '@sansa-dev/shared';
import { ContextErrorFactory } from '@sansa-dev/shared';

/**
 * ContextService
 *
 * Service for aggregating and managing complete context data for workspaces.
 * Provides unified API for fetching all context items at once.
 */
@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);

  constructor(
    private readonly productOverviewService: ProductOverviewService,
    private readonly colorPaletteService: ColorPaletteService,
    private readonly brandAssetService: BrandAssetService,
    private readonly brandImageService: BrandImageService,
  ) {}

  /**
   * Get complete context for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   * @returns Complete context data
   */
  async getContext(workspaceId: string, userId: string): Promise<Context> {
    try {
      this.logger.debug(
        `Getting complete context for workspace: ${workspaceId}`,
      );

      // Fetch all context items in parallel
      const [productOverview, colorPalette, brandImages, brandAssets] =
        await Promise.all([
          this.productOverviewService.getProductOverview(workspaceId, userId),
          this.colorPaletteService.getColorPalette(workspaceId, userId),
          this.brandImageService.getBrandImages(workspaceId, userId),
          this.brandAssetService.getBrandAssets(workspaceId, userId),
        ]);

      const context: Context = {
        workspaceId,
        userId,
        brandImages,
        brandAssets,
        colorPalette: colorPalette || undefined,
        productOverview: productOverview || undefined,
        lastUpdatedAt: this.getLastUpdatedTimestamp([
          productOverview,
          colorPalette,
          ...brandImages,
          ...brandAssets,
        ]),
      };

      this.logger.debug(`Retrieved context for workspace ${workspaceId}`);
      return context;
    } catch (error) {
      this.logger.error(
        `Failed to get context for workspace ${workspaceId}:`,
        error,
      );
      if (error instanceof Error) {
        throw ContextErrorFactory.contextOperationFailed(
          'getContext',
          error.message,
        );
      }
      throw ContextErrorFactory.contextOperationFailed(
        'getContext',
        'Unknown error occurred',
      );
    }
  }

  /**
   * Get context summary for a workspace (counts only)
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   * @returns Context summary with counts
   */
  async getContextSummary(
    workspaceId: string,
    userId: string,
  ): Promise<ContextSummary> {
    try {
      this.logger.debug(
        `Getting context summary for workspace: ${workspaceId}`,
      );

      // Fetch counts in parallel
      const [
        brandImageCount,
        brandAssetCount,
        hasColorPalette,
        hasProductOverview,
      ] = await Promise.all([
        this.brandImageService.getBrandImagesCount(workspaceId, userId),
        this.brandAssetService.getBrandAssetsCount(workspaceId, userId),
        this.colorPaletteService.colorPaletteExists(workspaceId, userId),
        this.productOverviewService.productOverviewExists(workspaceId, userId),
      ]);

      // Get last updated timestamp
      const context = await this.getContext(workspaceId, userId);

      const summary: ContextSummary = {
        workspaceId,
        userId,
        brandImageCount,
        brandAssetCount,
        hasColorPalette,
        hasProductOverview,
        lastUpdatedAt: context.lastUpdatedAt,
      };

      this.logger.debug(
        `Retrieved context summary for workspace ${workspaceId}`,
      );
      return summary;
    } catch (error) {
      this.logger.error(
        `Failed to get context summary for workspace ${workspaceId}:`,
        error,
      );
      if (error instanceof Error) {
        throw ContextErrorFactory.contextOperationFailed(
          'getContextSummary',
          error.message,
        );
      }
      throw ContextErrorFactory.contextOperationFailed(
        'getContextSummary',
        'Unknown error occurred',
      );
    }
  }

  /**
   * Delete all context data for a workspace
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for access control)
   */
  async deleteWorkspaceContext(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Deleting all context data for workspace: ${workspaceId}`,
      );

      // Delete all context items in parallel
      await Promise.all([
        this.productOverviewService
          .deleteProductOverview(workspaceId, userId)
          .catch((error) => {
            this.logger.warn(
              `Failed to delete product overview for workspace ${workspaceId}:`,
              error,
            );
          }),
        this.colorPaletteService
          .deleteColorPalette(workspaceId, userId)
          .catch((error) => {
            this.logger.warn(
              `Failed to delete color palette for workspace ${workspaceId}:`,
              error,
            );
          }),
        this.brandImageService
          .deleteWorkspaceBrandImages(workspaceId, userId)
          .catch((error) => {
            this.logger.warn(
              `Failed to delete brand images for workspace ${workspaceId}:`,
              error,
            );
          }),
        this.brandAssetService
          .deleteWorkspaceBrandAssets(workspaceId, userId)
          .catch((error) => {
            this.logger.warn(
              `Failed to delete brand assets for workspace ${workspaceId}:`,
              error,
            );
          }),
      ]);

      this.logger.log(`Deleted all context data for workspace ${workspaceId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete context data for workspace ${workspaceId}:`,
        error,
      );
      if (error instanceof Error) {
        throw ContextErrorFactory.contextOperationFailed(
          'deleteWorkspaceContext',
          error.message,
        );
      }
      throw ContextErrorFactory.contextOperationFailed(
        'deleteWorkspaceContext',
        'Unknown error occurred',
      );
    }
  }

  /**
   * Get the last updated timestamp from context items
   *
   * @param items - Array of context items with timestamps
   * @returns Latest timestamp as ISO string
   */
  private getLastUpdatedTimestamp(items: any[]): string {
    const timestamps = items
      .filter(
        (item) => item && (item.updatedAt || item.uploadedAt || item.createdAt),
      )
      .map((item) => {
        // Handle different timestamp field names
        const timestamp = item.updatedAt || item.uploadedAt || item.createdAt;
        return new Date(timestamp);
      })
      .filter((date) => !isNaN(date.getTime()));

    if (timestamps.length === 0) {
      return new Date().toISOString();
    }

    // Return the latest timestamp
    const latest = new Date(
      Math.max(...timestamps.map((date) => date.getTime())),
    );
    return latest.toISOString();
  }
}
