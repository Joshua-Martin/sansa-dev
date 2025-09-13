import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceSessionEntity } from '../entities/session.entity';
import type {
  WorkspaceSession,
  ResourceAllocation,
  PreviewEnvironment,
  WorkspaceStatus,
  ActivityLevel,
} from '@sansa-dev/shared';

type WorkspaceSessionCreateData = {
  userId: string;
  workspaceId?: string | null;
  containerId?: string | null;
  containerName: string;
  status: WorkspaceStatus;
  previewUrl: string;
  port: number;
  toolServerPort?: number | null;
  resources: ResourceAllocation;
  environment: PreviewEnvironment;
  activityLevel: ActivityLevel;
  activeConnectionCount: number;
  gracePeriodEndsAt?: string | null;
  connectionMetrics?: any;
  isReady: boolean;
  error?: string | null;
  hasSavedChanges: boolean;
  lastSavedAt?: string | null;
  templateId?: string | null;
};

/**
 * Database service for managing WorkspaceSession entities
 *
 * Provides all database operations for workspace session data with proper
 * error handling, validation, and type safety.
 */
@Injectable()
export class WorkspaceSessionDatabaseService {
  private readonly logger = new Logger(WorkspaceSessionDatabaseService.name);

  constructor(
    @InjectRepository(WorkspaceSessionEntity)
    private readonly workspaceSessionRepository: Repository<WorkspaceSessionEntity>,
  ) {}

  /**
   * Create a new workspace session
   *
   * @param data - Workspace session creation data
   * @returns Created workspace session entity
   */
  async create(
    data: WorkspaceSessionCreateData,
  ): Promise<WorkspaceSessionEntity> {
    try {
      this.logger.debug(
        `Creating workspace session for user: ${data.userId}, workspace: ${data.workspaceId || 'none'}`,
      );

      const session = this.workspaceSessionRepository.create(data as any);

      const saved = await this.workspaceSessionRepository.save(session);
      const savedEntity = Array.isArray(saved) ? saved[0] : saved;
      this.logger.log(
        `Created workspace session ${savedEntity.id} for user ${savedEntity.userId}`,
      );
      return savedEntity;
    } catch (error) {
      this.logger.error(
        `Failed to create workspace session for user ${data.userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find workspace session by ID
   *
   * @param id - Workspace session ID
   * @returns Workspace session entity
   * @throws NotFoundException if not found
   */
  async findById(id: string): Promise<WorkspaceSessionEntity> {
    try {
      const session = await this.workspaceSessionRepository.findOne({
        where: { id },
      });

      if (!session) {
        throw new NotFoundException(
          `Workspace session with ID ${id} not found`,
        );
      }

      return session;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find workspace session ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find workspace session by ID and user ID
   *
   * @param id - Workspace session ID
   * @param userId - User ID
   * @returns Workspace session entity
   * @throws NotFoundException if not found
   */
  async findByIdAndUser(
    id: string,
    userId: string,
  ): Promise<WorkspaceSessionEntity> {
    try {
      const session = await this.workspaceSessionRepository.findOne({
        where: { id, userId },
      });

      if (!session) {
        throw new NotFoundException(
          `Workspace session with ID ${id} not found for user ${userId}`,
        );
      }

      return session;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to find workspace session ${id} for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find all workspace sessions for a user
   *
   * @param userId - User ID
   * @param options - Query options
   * @returns Array of workspace session entities
   */
  async findByUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'lastActivityAt' | 'updatedAt';
      orderDirection?: 'ASC' | 'DESC';
      status?: string[];
      activityLevel?: string[];
    },
  ): Promise<WorkspaceSessionEntity[]> {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'lastActivityAt',
        orderDirection = 'DESC',
        status,
        activityLevel,
      } = options || {};

      let query = this.workspaceSessionRepository
        .createQueryBuilder('session')
        .where('session.userId = :userId', { userId });

      if (status && status.length > 0) {
        query = query.andWhere('session.status IN (:...status)', { status });
      }

      if (activityLevel && activityLevel.length > 0) {
        query = query.andWhere('session.activityLevel IN (:...activityLevel)', {
          activityLevel,
        });
      }

      query = query
        .orderBy(`session.${orderBy}`, orderDirection)
        .take(limit)
        .skip(offset);

      return await query.getMany();
    } catch (error) {
      this.logger.error(
        `Failed to find workspace sessions for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find active workspace session for a user and optional workspace
   *
   * @param userId - User ID
   * @param workspaceId - Optional workspace ID
   * @returns Workspace session entity or null
   */
  async findActiveByUserAndWorkspace(
    userId: string,
    workspaceId?: string,
  ): Promise<WorkspaceSessionEntity | null> {
    try {
      let query = this.workspaceSessionRepository
        .createQueryBuilder('session')
        .where('session.userId = :userId', { userId })
        .andWhere('session.status IN (:...statuses)', {
          statuses: ['creating', 'initializing', 'running'],
        })
        .andWhere('session.activityLevel IN (:...activityLevels)', {
          activityLevels: ['active', 'idle'],
        });

      if (workspaceId) {
        query = query.andWhere('session.workspaceId = :workspaceId', {
          workspaceId,
        });
      }

      query = query.orderBy('session.lastActivityAt', 'DESC');

      return await query.getOne();
    } catch (error) {
      this.logger.error(
        `Failed to find active workspace session for user ${userId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Find workspace session by container ID
   *
   * @param containerId - Container ID
   * @returns Workspace session entity or null
   */
  async findByContainerId(
    containerId: string,
  ): Promise<WorkspaceSessionEntity | null> {
    try {
      const session = await this.workspaceSessionRepository.findOne({
        where: { containerId },
      });

      return session;
    } catch (error) {
      this.logger.error(
        `Failed to find workspace session by container ID ${containerId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Update workspace session
   *
   * @param id - Workspace session ID
   * @param data - Update data
   * @returns Updated workspace session entity
   * @throws NotFoundException if not found
   */
  async update(
    id: string,
    data: Partial<{
      status: string;
      containerId: string;
      containerName: string;
      previewUrl: string;
      port: number;
      toolServerPort: number;
      resources: ResourceAllocation;
      environment: PreviewEnvironment;
      lastActivityAt: string;
      activityLevel: string;
      activeConnectionCount: number;
      gracePeriodEndsAt: string;
      connectionMetrics: any;
      isReady: boolean;
      error: string;
      hasSavedChanges: boolean;
      lastSavedAt: string;
      templateId: string;
    }>,
  ): Promise<WorkspaceSessionEntity> {
    try {
      this.logger.debug(`Updating workspace session ${id}`);

      const session = await this.findById(id);

      // Update fields dynamically
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          session[key] = data[key];
        }
      });

      const saved = await this.workspaceSessionRepository.save(session);
      this.logger.log(`Updated workspace session ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to update workspace session ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update last activity timestamp for workspace session
   *
   * @param id - Workspace session ID
   * @returns Updated workspace session entity
   */
  async updateLastActivity(id: string): Promise<WorkspaceSessionEntity> {
    try {
      return await this.update(id, {
        lastActivityAt: new Date().toISOString(),
        activityLevel: 'active',
      });
    } catch (error) {
      this.logger.error(
        `Failed to update last activity for workspace session ${id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update last saved timestamp for workspace session
   *
   * @param id - Workspace session ID
   * @returns Updated workspace session entity
   */
  async updateLastSaved(id: string): Promise<WorkspaceSessionEntity> {
    try {
      return await this.update(id, {
        lastSavedAt: new Date().toISOString(),
        hasSavedChanges: true,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update last saved for workspace session ${id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete workspace session by ID
   *
   * @param id - Workspace session ID
   * @throws NotFoundException if not found
   */
  async delete(id: string): Promise<void> {
    try {
      this.logger.debug(`Deleting workspace session ${id}`);

      const session = await this.findById(id);
      await this.workspaceSessionRepository.remove(session);

      this.logger.log(`Deleted workspace session ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete workspace session ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete all workspace sessions for a user
   *
   * @param userId - User ID
   */
  async deleteByUser(userId: string): Promise<void> {
    try {
      this.logger.debug(`Deleting all workspace sessions for user ${userId}`);

      const sessions = await this.findByUser(userId);
      if (sessions.length > 0) {
        await this.workspaceSessionRepository.remove(sessions);
        this.logger.log(
          `Deleted ${sessions.length} workspace sessions for user ${userId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete workspace sessions for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if workspace session exists by ID and user ID
   *
   * @param id - Workspace session ID
   * @param userId - User ID
   * @returns True if exists, false otherwise
   */
  async exists(id: string, userId: string): Promise<boolean> {
    try {
      const count = await this.workspaceSessionRepository.count({
        where: { id, userId },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(
        `Failed to check workspace session existence ${id}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Count workspace sessions for a user
   *
   * @param userId - User ID
   * @param filters - Optional filters
   * @returns Count of workspace sessions
   */
  async countByUser(
    userId: string,
    filters?: {
      status?: string[];
      activityLevel?: string[];
      workspaceId?: string;
    },
  ): Promise<number> {
    try {
      let query = this.workspaceSessionRepository
        .createQueryBuilder('session')
        .where('session.userId = :userId', { userId });

      if (filters?.status && filters.status.length > 0) {
        query = query.andWhere('session.status IN (:...status)', {
          status: filters.status,
        });
      }

      if (filters?.activityLevel && filters.activityLevel.length > 0) {
        query = query.andWhere('session.activityLevel IN (:...activityLevel)', {
          activityLevel: filters.activityLevel,
        });
      }

      if (filters?.workspaceId) {
        query = query.andWhere('session.workspaceId = :workspaceId', {
          workspaceId: filters.workspaceId,
        });
      }

      return await query.getCount();
    } catch (error) {
      this.logger.error(
        `Failed to count workspace sessions for user ${userId}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Find workspace sessions by workspace ID
   *
   * @param workspaceId - Workspace ID
   * @param userId - User ID (for security)
   * @returns Array of workspace session entities
   */
  async findByWorkspaceId(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceSessionEntity[]> {
    try {
      return await this.workspaceSessionRepository.find({
        where: { workspaceId, userId },
        order: { lastActivityAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find workspace sessions by workspace ${workspaceId} for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get allocated ports for active sessions
   *
   * @param portType - Type of port to get ('port' or 'toolServerPort')
   * @returns Array of allocated port numbers
   */
  async getAllocatedPorts(
    portType: 'port' | 'toolServerPort' = 'port',
  ): Promise<number[]> {
    try {
      const usedPorts = await this.workspaceSessionRepository
        .createQueryBuilder('session')
        .select(`session.${portType}`, 'port')
        .where('session.status IN (:...statuses)', {
          statuses: ['creating', 'initializing', 'running'],
        })
        .andWhere('session.activityLevel IN (:...activityLevels)', {
          activityLevels: ['active', 'idle', 'background'],
        })
        .andWhere(`session.${portType} IS NOT NULL`)
        .getRawMany();

      return usedPorts.map((p) => p.port).filter(Boolean);
    } catch (error) {
      this.logger.error(`Failed to get allocated ${portType} ports:`, error);
      return [];
    }
  }

  /**
   * Find sessions that are eligible for cleanup based on inactivity
   *
   * @param gracePeriodMinutes - Grace period in minutes
   * @returns Array of workspace session entities eligible for cleanup
   */
  async findSessionsEligibleForCleanup(
    gracePeriodMinutes: number = 30,
  ): Promise<WorkspaceSessionEntity[]> {
    try {
      const cutoffTime = new Date(Date.now() - gracePeriodMinutes * 60 * 1000);

      return await this.workspaceSessionRepository
        .createQueryBuilder('session')
        .where('session.lastActivityAt IS NOT NULL')
        .andWhere('session.lastActivityAt < :cutoffTime', {
          cutoffTime: cutoffTime.toISOString(),
        })
        .andWhere('session.activeConnectionCount = 0')
        .andWhere('session.activityLevel != :activeLevel', {
          activeLevel: 'active',
        })
        .getMany();
    } catch (error) {
      this.logger.error('Failed to find sessions eligible for cleanup:', error);
      return [];
    }
  }

  /**
   * Validate workspace ownership for session operations
   *
   * @param sessionId - Workspace session ID
   * @param userId - User ID
   * @throws NotFoundException if session not found or not owned by user
   */
  async validateOwnership(sessionId: string, userId: string): Promise<void> {
    try {
      await this.workspaceSessionRepository.findOneOrFail({
        where: { id: sessionId, userId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to validate workspace session ownership for session ${sessionId} and user ${userId}:`,
        error,
      );
      throw new NotFoundException(
        `Workspace session ${sessionId} not found or not owned by user ${userId}`,
      );
    }
  }
}
