import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import type {
  ResourceAllocation,
  PreviewEnvironment,
  WorkspaceEntity,
} from '@sansa-dev/shared';

type WorkspaceCreateData = Omit<WorkspaceEntity, 'id'>;

/**
 * Database service for managing Workspace entities
 *
 * Provides all database operations for workspace data with proper
 * error handling, validation, and type safety.
 */
@Injectable()
export class WorkspaceDatabaseService {
  private readonly logger = new Logger(WorkspaceDatabaseService.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {}

  /**
   * Create a new workspace
   *
   * @param data - Workspace creation data
   * @returns Created workspace entity
   */
  async create(data: WorkspaceCreateData): Promise<Workspace> {
    try {
      this.logger.debug(
        `Creating workspace: ${data.name || 'Unnamed'} for user: ${data.userId}`,
      );

      const workspace = this.workspaceRepository.create(data);

      const saved = await this.workspaceRepository.save(workspace);
      this.logger.log(`Created workspace ${saved.id} for user ${saved.userId}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `Failed to create workspace for user ${data.userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find workspace by ID
   *
   * @param id - Workspace ID
   * @returns Workspace entity
   * @throws NotFoundException if not found
   */
  async findById(id: string): Promise<Workspace> {
    try {
      const workspace = await this.workspaceRepository.findOne({
        where: { id },
      });

      if (!workspace) {
        throw new NotFoundException(`Workspace with ID ${id} not found`);
      }

      return workspace;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find workspace ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find workspace by ID and user ID
   *
   * @param id - Workspace ID
   * @param userId - User ID
   * @returns Workspace entity
   * @throws NotFoundException if not found
   */
  async findByIdAndUser(id: string, userId: string): Promise<Workspace> {
    try {
      const workspace = await this.workspaceRepository.findOne({
        where: { id, userId },
      });

      if (!workspace) {
        throw new NotFoundException(
          `Workspace with ID ${id} not found for user ${userId}`,
        );
      }

      return workspace;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to find workspace ${id} for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find all workspaces for a user
   *
   * @param userId - User ID
   * @param options - Query options
   * @returns Array of workspace entities
   */
  async findByUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'lastAccessedAt' | 'name';
      orderDirection?: 'ASC' | 'DESC';
    },
  ): Promise<Workspace[]> {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'lastAccessedAt',
        orderDirection = 'DESC',
      } = options || {};

      return await this.workspaceRepository.find({
        where: { userId },
        order: { [orderBy]: orderDirection },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      this.logger.error(`Failed to find workspaces for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Find the most recently accessed workspace for a user
   *
   * @param userId - User ID
   * @returns Workspace entity or null
   */
  async findMostRecentByUser(userId: string): Promise<Workspace | null> {
    try {
      const workspace = await this.workspaceRepository.findOne({
        where: { userId },
        order: { lastAccessedAt: 'DESC' },
      });

      return workspace;
    } catch (error) {
      this.logger.error(
        `Failed to find most recent workspace for user ${userId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Find workspace by storage key
   *
   * @param storageKey - Storage key
   * @returns Workspace entity or null
   */
  async findByStorageKey(storageKey: string): Promise<Workspace | null> {
    try {
      const workspace = await this.workspaceRepository.findOne({
        where: { storageKey },
      });

      return workspace;
    } catch (error) {
      this.logger.error(
        `Failed to find workspace by storage key ${storageKey}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Update workspace
   *
   * @param id - Workspace ID
   * @param data - Update data
   * @returns Updated workspace entity
   * @throws NotFoundException if not found
   */
  async update(
    id: string,
    data: Partial<{
      name: string;
      templateId: string;
      storageKey: string;
      resources: ResourceAllocation;
      environment: PreviewEnvironment;
      metadata: Record<string, any>;
      lastAccessedAt: string;
      lastSavedAt: string;
    }>,
  ): Promise<Workspace> {
    try {
      this.logger.debug(`Updating workspace ${id}`);

      const workspace = await this.findById(id);

      // Update fields
      if (data.name !== undefined) workspace.name = data.name;
      if (data.templateId !== undefined) workspace.templateId = data.templateId;
      if (data.storageKey !== undefined) workspace.storageKey = data.storageKey;
      if (data.resources !== undefined) workspace.resources = data.resources;
      if (data.environment !== undefined)
        workspace.environment = data.environment;
      if (data.metadata !== undefined) workspace.metadata = data.metadata;
      if (data.lastAccessedAt !== undefined)
        workspace.lastAccessedAt = data.lastAccessedAt;
      if (data.lastSavedAt !== undefined)
        workspace.lastSavedAt = data.lastSavedAt;

      const saved = await this.workspaceRepository.save(workspace);
      this.logger.log(`Updated workspace ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to update workspace ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update last accessed timestamp for workspace
   *
   * @param id - Workspace ID
   * @returns Updated workspace entity
   */
  async updateLastAccessed(id: string): Promise<Workspace> {
    try {
      return await this.update(id, {
        lastAccessedAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to update last accessed for workspace ${id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update last saved timestamp for workspace
   *
   * @param id - Workspace ID
   * @returns Updated workspace entity
   */
  async updateLastSaved(id: string): Promise<Workspace> {
    try {
      return await this.update(id, {
        lastSavedAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to update last saved for workspace ${id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete workspace by ID
   *
   * @param id - Workspace ID
   * @throws NotFoundException if not found
   */
  async delete(id: string): Promise<void> {
    try {
      this.logger.debug(`Deleting workspace ${id}`);

      const workspace = await this.findById(id);
      await this.workspaceRepository.remove(workspace);

      this.logger.log(`Deleted workspace ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete workspace ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete all workspaces for a user
   *
   * @param userId - User ID
   */
  async deleteByUser(userId: string): Promise<void> {
    try {
      this.logger.debug(`Deleting all workspaces for user ${userId}`);

      const workspaces = await this.findByUser(userId);
      if (workspaces.length > 0) {
        await this.workspaceRepository.remove(workspaces);
        this.logger.log(
          `Deleted ${workspaces.length} workspaces for user ${userId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete workspaces for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if workspace exists by ID and user ID
   *
   * @param id - Workspace ID
   * @param userId - User ID
   * @returns True if exists, false otherwise
   */
  async exists(id: string, userId: string): Promise<boolean> {
    try {
      const count = await this.workspaceRepository.count({
        where: { id, userId },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check workspace existence ${id}:`, error);
      return false;
    }
  }

  /**
   * Count workspaces for a user
   *
   * @param userId - User ID
   * @returns Count of workspaces
   */
  async countByUser(userId: string): Promise<number> {
    try {
      return await this.workspaceRepository.count({ where: { userId } });
    } catch (error) {
      this.logger.error(
        `Failed to count workspaces for user ${userId}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Find workspaces by template ID for a user
   *
   * @param userId - User ID
   * @param templateId - Template ID
   * @returns Array of workspace entities
   */
  async findByTemplate(
    userId: string,
    templateId: string,
  ): Promise<Workspace[]> {
    try {
      return await this.workspaceRepository.find({
        where: { userId, templateId },
        order: { lastAccessedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find workspaces by template ${templateId} for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Search workspaces by name for a user
   *
   * @param userId - User ID
   * @param searchTerm - Search term
   * @returns Array of workspace entities
   */
  async searchByName(userId: string, searchTerm: string): Promise<Workspace[]> {
    try {
      return await this.workspaceRepository
        .createQueryBuilder('workspace')
        .where('workspace.userId = :userId', { userId })
        .andWhere('workspace.name ILIKE :searchTerm', {
          searchTerm: `%${searchTerm}%`,
        })
        .orderBy('workspace.lastAccessedAt', 'DESC')
        .getMany();
    } catch (error) {
      this.logger.error(
        `Failed to search workspaces for user ${userId} with term "${searchTerm}":`,
        error,
      );
      throw error;
    }
  }
}
