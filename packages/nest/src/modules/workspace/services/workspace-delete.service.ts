/**
 * Workspace Delete Service
 *
 * Simple service for handling workspace deletion with essential cleanup.
 * This service orchestrates the basic deletion pipeline:
 * - Validate workspace ownership and check for active sessions
 * - Clean up all sessions (containers, database records)
 * - Clean up storage archives
 * - Clean up context data
 * - Clean up workspace database record
 *
 * Fails fast on any error - no retries, no complex rollback.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../../../shared/database/entities/workspace.entity';
import { WorkspaceSessionEntity } from '../../../shared/database/entities/session.entity';
import { ContextService } from '../../context/services/context.service';
import { WorkspacePersistenceService } from './persistence/workspace-persistence.service';
import { DockerService } from '../../../shared/services/docker.service';
import { WorkspaceDatabaseService } from '../../../shared/database/services/workspace.service';
import { WorkspaceSessionDatabaseService } from '../../../shared/database/services/workspace-session.service';
import { ContainerRegistryService } from './container-registry/container-registry.service';

/**
 * Workspace Delete Service
 *
 * Handles workspace deletion with essential cleanup steps.
 * Simple, focused implementation for MVP requirements.
 */
@Injectable()
export class WorkspaceDeleteService {
  private readonly logger = new Logger(WorkspaceDeleteService.name);

  constructor(
    @InjectRepository(WorkspaceSessionEntity)
    private readonly workspaceSessionRepository: Repository<WorkspaceSessionEntity>,
    private readonly workspaceDbService: WorkspaceDatabaseService,
    private readonly workspaceSessionDbService: WorkspaceSessionDatabaseService,
    private readonly persistenceService: WorkspacePersistenceService,
    private readonly dockerService: DockerService,
    private readonly containerRegistry: ContainerRegistryService,
    private readonly contextService: ContextService,
  ) {}

  /**
   * Delete a workspace and all associated resources
   *
   * @param workspaceId - ID of workspace to delete
   * @param userId - ID of user requesting deletion
   */
  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    this.logger.log(
      `Starting workspace deletion: ${workspaceId} for user ${userId}`,
    );

    try {
      // 1. Validate workspace exists and user owns it
      const workspace = await this.workspaceDbService.findByIdAndUser(
        workspaceId,
        userId,
      );

      // 2. Find all sessions for this workspace
      const sessionsToDelete = await this.workspaceSessionRepository.find({
        where: { workspaceId: workspaceId },
      });

      // 3. Check for active sessions (fail if any exist)
      const activeSessions = sessionsToDelete.filter(
        (session) =>
          session.status === 'running' || session.status === 'initializing',
      );

      if (activeSessions.length > 0) {
        throw new ConflictException(
          `Cannot delete workspace with ${activeSessions.length} active session(s). Please close all sessions first.`,
        );
      }

      // 4. Clean up all sessions
      await this.cleanupAllSessions(sessionsToDelete);

      // 5. Clean up storage archive
      await this.cleanupStorage(workspace, userId);

      // 6. Clean up context data
      await this.cleanupContext(workspaceId, userId);

      // 7. Clean up workspace database record (final step)
      await this.workspaceDbService.delete(workspaceId);

      this.logger.log(
        `Workspace deletion completed successfully: ${workspaceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Workspace deletion failed: ${workspaceId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Clean up all sessions associated with the workspace
   */
  private async cleanupAllSessions(
    sessions: WorkspaceSessionEntity[],
  ): Promise<void> {
    this.logger.debug(`Cleaning up ${sessions.length} sessions`);

    for (const session of sessions) {
      try {
        await this.cleanupSingleSession(session);
      } catch (error) {
        this.logger.error(`Failed to cleanup session ${session.id}:`, error);
        throw new BadRequestException(
          `Session cleanup failed for session ${session.id}`,
        );
      }
    }
  }

  /**
   * Clean up a single workspace session
   */
  private async cleanupSingleSession(
    session: WorkspaceSessionEntity,
  ): Promise<void> {
    this.logger.debug(`Cleaning up session ${session.id}`);

    // Stop and remove container if it exists
    if (session.containerId) {
      try {
        await this.dockerService.stopContainer(session.containerId);
        await this.dockerService.removeContainer(session.containerId);
        this.logger.debug(`Container ${session.containerId} cleaned up`);
      } catch (error) {
        this.logger.warn(
          `Failed to cleanup container ${session.containerId}:`,
          error,
        );
        // Continue with session cleanup even if container cleanup fails
      }
    }

    // Unregister from container registry
    try {
      await this.containerRegistry.unregisterContainer(session.id);
    } catch (error) {
      this.logger.warn(
        `Failed to unregister container for session ${session.id}:`,
        error,
      );
    }

    // Delete session from database
    await this.workspaceSessionDbService.delete(session.id);
    this.logger.debug(`Session ${session.id} deleted from database`);
  }

  /**
   * Clean up workspace storage archive
   */
  private async cleanupStorage(
    workspace: Workspace,
    userId: string,
  ): Promise<void> {
    if (!workspace.storageKey) {
      this.logger.debug(`No storage key found for workspace ${workspace.id}`);
      return;
    }

    try {
      await this.persistenceService.deleteSavedWorkspaceArchive({
        userId,
        workspaceId: workspace.id,
      });
      this.logger.debug(
        `Storage archive deleted for workspace ${workspace.id}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to delete storage for workspace ${workspace.id}:`,
        error,
      );
      // Don't throw - storage cleanup failure shouldn't block workspace deletion
    }
  }

  /**
   * Clean up workspace context data
   */
  private async cleanupContext(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    try {
      await this.contextService.deleteWorkspaceContext(workspaceId, userId);
      this.logger.debug(`Context data cleaned up for workspace ${workspaceId}`);
    } catch (error) {
      this.logger.warn(
        `Failed to cleanup context data for workspace ${workspaceId}:`,
        error,
      );
      // Don't throw - context cleanup failure shouldn't block workspace deletion
    }
  }
}
