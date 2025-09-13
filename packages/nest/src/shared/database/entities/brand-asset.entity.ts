import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BrandAssetType, BrandAsset as IBrandAsset } from '@sansa-dev/shared';

/**
 * Brand Asset Entity
 *
 * Stores brand assets such as logos, wordmarks, and icons.
 * These assets are associated with specific projects and are used
 * to provide brand context for AI-generated content.
 */
@Entity('brand_assets')
@Index(['workspaceId'])
@Index(['workspaceId', 'assetType'])
@Index(['workspaceId', 'uploadedAt'])
@Index(['assetType'])
export class BrandAsset implements IBrandAsset {
  /**
   * Unique identifier for the brand asset
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the workspace this asset belongs to
   */
  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  /**
   * ID of the user who owns this asset (derived from workspace)
   */
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  /**
   * Type of brand asset
   */
  @Column({
    name: 'asset_type',
    type: 'enum',
    enum: ['logo', 'wordmark', 'icon'],
  })
  assetType: BrandAssetType;

  /**
   * Filename as uploaded by the user
   */
  @Column({ length: 255 })
  filename: string;

  /**
   * Storage key/path where the file is located
   */
  @Column({ name: 'storage_key', length: 500 })
  storageKey: string;

  /**
   * MIME type of the asset file
   */
  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  /**
   * Size of the asset file in bytes
   */
  @Column('bigint')
  size: number;

  /**
   * Public URL for accessing the asset
   */
  @Column({ length: 500, nullable: true })
  url?: string;

  /**
   * Asset metadata (dimensions for images, etc.)
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    dimensions?: {
      width: number;
      height: number;
    };
    altText?: string;
    description?: string;
    color?: string;
  } | null;

  /**
   * When the asset was uploaded
   */
  @CreateDateColumn({ name: 'created_at' })
  uploadedAt: string;

  /**
   * When the asset was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Note: workspaceId references WorkspaceSessionEntity.id
   * Assets are scoped to workspaces for proper isolation
   */

  /**
   * Business logic methods
   */

  /**
   * Check if the asset is accessible by a user
   */
  isAccessibleBy(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Get the public URL for the asset
   */
  getPublicUrl(): string | null {
    return this.url;
  }

  /**
   * Check if the file is an image
   */
  isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  /**
   * Check if the file is a vector format
   */
  isVector(): boolean {
    return this.mimeType === 'image/svg+xml';
  }

  /**
   * Get asset dimensions if available
   */
  getDimensions(): { width: number; height: number } | null {
    return this.metadata?.dimensions || null;
  }

  /**
   * Check if this is a logo asset
   */
  isLogo(): boolean {
    return this.assetType === 'logo';
  }

  /**
   * Check if this is a wordmark asset
   */
  isWordmark(): boolean {
    return this.assetType === 'wordmark';
  }

  /**
   * Check if this is an icon asset
   */
  isIcon(): boolean {
    return this.assetType === 'icon';
  }

  /**
   * Update metadata
   */
  updateMetadata(metadata: Partial<NonNullable<typeof this.metadata>>): void {
    this.metadata = {
      ...this.metadata,
      ...metadata,
    } as typeof this.metadata;
  }
}
