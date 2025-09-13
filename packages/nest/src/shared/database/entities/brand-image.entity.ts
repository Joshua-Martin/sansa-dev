import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BrandImage as IBrandImage } from '@sansa-dev/shared';

/**
 * Brand Image Entity
 *
 * Stores brand images that serve as visual inspiration for projects.
 * These images are associated with specific projects and are used
 * to provide context for AI-generated content.
 */
@Entity('brand_images')
@Index(['workspaceId'])
@Index(['workspaceId', 'uploadedAt'])
export class BrandImage implements IBrandImage {
  /**
   * Unique identifier for the brand image
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the workspace this image belongs to
   */
  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  /**
   * ID of the user who owns this image (derived from workspace)
   */
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

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
   * MIME type of the image file
   */
  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  /**
   * Size of the image file in bytes
   */
  @Column('bigint')
  size: number;

  /**
   * Public URL for accessing the image
   */
  @Column({ length: 500, nullable: true })
  url?: string;

  /**
   * Image dimensions metadata
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    dimensions?: {
      width: number;
      height: number;
    };
    altText?: string;
    description?: string;
  } | null;

  /**
   * When the image was uploaded
   */
  @CreateDateColumn({ name: 'created_at' })
  uploadedAt: string;

  /**
   * When the image was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Note: workspaceId references WorkspaceSessionEntity.id
   * Images are scoped to workspaces for proper isolation
   */

  /**
   * Business logic methods
   */

  /**
   * Check if the image is accessible by a user
   */
  isAccessibleBy(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Get the public URL for the image
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
   * Get image dimensions if available
   */
  getDimensions(): { width: number; height: number } | null {
    return this.metadata?.dimensions || null;
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
