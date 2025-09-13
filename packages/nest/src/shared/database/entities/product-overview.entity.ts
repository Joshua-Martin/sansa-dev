import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ProductOverview as IProductOverview } from '@sansa-dev/shared';

/**
 * Product Overview Entity
 *
 * Stores detailed information about the product or service that the project
 * is focused on. This provides context for AI-generated content and helps
 * maintain consistent messaging across the project.
 */
@Entity('product_overviews')
@Index(['workspaceId'])
@Index(['workspaceId', 'createdAt'])
export class ProductOverview implements IProductOverview {
  /**
   * Unique identifier for the product overview
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the workspace this overview belongs to
   */
  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  /**
   * ID of the user who owns this overview (derived from workspace)
   */
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  /**
   * Product overview content
   */
  @Column({ type: 'text' })
  content: string;

  /**
   * When the overview was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  /**
   * When the overview was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  /**
   * Note: workspaceId references WorkspaceSessionEntity.id
   * Overviews are scoped to workspaces for proper isolation
   */

  /**
   * Business logic methods
   */

  /**
   * Check if the overview is accessible by a user
   */
  isAccessibleBy(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Get the content
   */
  getContent(): string {
    return this.content;
  }

  /**
   * Update the content
   */
  updateContent(content: string): void {
    this.content = content;
  }

  /**
   * Check if the overview has meaningful content
   */
  hasContent(): boolean {
    return !!(this.content && this.content.trim().length > 0);
  }
}
