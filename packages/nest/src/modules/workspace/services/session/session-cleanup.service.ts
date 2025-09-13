import { Injectable, Logger } from '@nestjs/common';
import { WorkspaceSessionEntity } from '../../../../shared/database/entities/session.entity';
import { DockerService } from '../../../../shared/services/docker.service';
import { ContainerRegistryService } from '../container-registry/container-registry.service';
import { WorkspacePersistenceService } from '../persistence/workspace-persistence.service';
import { WorkspaceDatabaseService } from '../../../../shared/database/services/workspace.service';
import { WorkspaceSessionDatabaseService } from '../../../../shared/database/services/workspace-session.service';

/**
 * SessionCleanupService
 *
 * Handles all cleanup operations for workspace sessions including:
 * - Failed session cleanup
 * - Orphaned workspace cleanup
 * - User session cleanup
 * - Container and resource cleanup
 */
@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(
    private readonly dockerService: DockerService,
    private readonly containerRegistry: ContainerRegistryService,
    private readonly persistenceService: WorkspacePersistenceService,
    private readonly workspaceDbService: WorkspaceDatabaseService,
    private readonly workspaceSessionDBService: WorkspaceSessionDatabaseService,
  ) {}

  /**
   * Clean up failed workspace session resources
   *
   * @param session - The failed workspace session
   * @param containerId - Container ID if created
   * @param containerCreated - Whether container was created
   * @param containerStarted - Whether container was started
   */
  async cleanupFailedWorkspaceSession(
    session: WorkspaceSessionEntity,
    containerId: string | null,
    containerCreated: boolean,
    containerStarted: boolean,
  ): Promise<void> {
    this.logger.log(`Cleaning up failed workspace session ${session.id}`);

    // Unregister container from registry if it was registered
    try {
      await this.containerRegistry.unregisterContainer(session.id);
    } catch (error) {
      // Registry cleanup failure is not critical for failed sessions
      this.logger.debug(
        `Registry cleanup failed for session ${session.id}:`,
        error,
      );
    }

    // Clean up container if it was created
    if (containerId && containerCreated) {
      try {
        if (containerStarted) {
          // Stop container if it was started
          await this.dockerService.stopContainer(containerId);
          this.logger.log(`Stopped failed container ${containerId}`);
        }

        // Remove container
        await this.dockerService.removeContainer(containerId);
        this.logger.log(`Removed failed container ${containerId}`);
      } catch (cleanupError) {
        this.logger.warn(
          `Failed to cleanup container ${containerId}:`,
          cleanupError,
        );
        // Don't throw here - we want to continue with other cleanup
      }
    }

    // Check if the associated workspace should be cleaned up (no successful sessions)
    await this.cleanupOrphanedWorkspaceForSession(session);

    // Note: We don't remove the session from database as it contains useful error information
    // The session will be marked as 'error' status for debugging purposes
  }

  /**
   * Clean up workspace if it has no successful sessions (orphaned workspace cleanup)
   * This is called as a side effect of session management to maintain workspace consistency
   *
   * @param session - The workspace session that may have orphaned its workspace
   */
  async cleanupOrphanedWorkspaceForSession(
    session: WorkspaceSessionEntity,
  ): Promise<void> {
    if (!session.workspaceId) {
      return; // No workspace to clean up
    }

    try {
      // Check if this workspace has any saved data
      const hasSavedData =
        await this.persistenceService.hasSavedWorkspaceArchive({
          userId: session.userId,
          workspaceId: session.workspaceId,
        });

      if (hasSavedData) {
        // Workspace has saved data, don't clean it up
        this.logger.debug(
          `Workspace ${session.workspaceId} has saved data, preserving it`,
        );
        return;
      }

      // Check if there are any other sessions for this workspace
      const otherSessions = await this.workspaceSessionDBService.countByUser(
        session.userId,
        {
          workspaceId: session.workspaceId,
          status: ['running'],
        },
      );

      if (otherSessions > 0) {
        // Other sessions exist, don't clean up the workspace
        this.logger.debug(
          `Workspace ${session.workspaceId} has other active sessions, preserving it`,
        );
        return;
      }

      // Check if any session for this workspace ever completed successfully
      const successfulSessions =
        await this.workspaceSessionDBService.countByUser(session.userId, {
          workspaceId: session.workspaceId,
        });

      if (successfulSessions > 0) {
        // At least one session completed successfully, preserve workspace
        this.logger.debug(
          `Workspace ${session.workspaceId} had successful sessions, preserving it`,
        );
        return;
      }

      // This workspace appears to be orphaned - no saved data, no other sessions, never succeeded
      this.logger.log(`Cleaning up orphaned workspace ${session.workspaceId}`);

      // Delete any partial storage that might exist
      try {
        await this.persistenceService.deleteSavedWorkspaceArchive({
          userId: session.userId,
          workspaceId: session.workspaceId,
        });
      } catch (storageError) {
        // Storage cleanup failure is not critical
        this.logger.debug(
          `Storage cleanup failed for workspace ${session.workspaceId}:`,
          storageError,
        );
      }

      // Delete the workspace entity
      await this.workspaceDbService.delete(session.workspaceId);
      this.logger.log(
        `Successfully cleaned up orphaned workspace ${session.workspaceId}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to cleanup orphaned workspace ${session.workspaceId}:`,
        error,
      );
      // Don't throw - cleanup failure shouldn't prevent session error handling
    }
  }

  /**
   * Clean up old workspace sessions for a user
   * Removes sessions that are in 'stopped' status
   *
   * @param userId - User ID
   */
  async cleanupUserWorkspaceSessions(userId: string): Promise<void> {
    this.logger.log(`Cleaning up old workspace sessions for user ${userId}`);

    const oldSessions = await this.workspaceSessionDBService.findByUser(
      userId,
      {
        status: ['stopped'],
      },
    );

    for (const session of oldSessions) {
      try {
        if (session.containerId) {
          await this.dockerService.removeContainer(session.containerId);
        }

        await this.workspaceSessionDBService.delete(session.id);
        this.logger.log(`Cleaned up old workspace session ${session.id}`);
      } catch (error) {
        this.logger.warn(
          `Failed to cleanup workspace session ${session.id}`,
          error,
        );
      }
    }

    this.logger.log(
      `Cleaned up ${oldSessions.length} old workspace sessions for user ${userId}`,
    );
  }

  /**
   * Force cleanup all workspace sessions for a user (aggressive cleanup)
   * This method stops and removes all containers for the user, regardless of status
   *
   * @param userId - User ID
   */
  async forceCleanupUserWorkspaceSessions(userId: string): Promise<void> {
    this.logger.log(
      `Force cleaning up all workspace sessions for user ${userId}`,
    );

    const allUserSessions =
      await this.workspaceSessionDBService.findByUser(userId);

    for (const session of allUserSessions) {
      try {
        // Stop and remove container if it exists
        if (session.containerId) {
          try {
            await this.dockerService.stopContainer(session.containerId);
          } catch (error) {
            this.logger.warn(
              `Failed to stop container ${session.containerId}`,
              error,
            );
          }

          try {
            await this.dockerService.removeContainer(session.containerId);
          } catch (error) {
            this.logger.warn(
              `Failed to remove container ${session.containerId}`,
              error,
            );
          }
        }

        // Remove session from database
        await this.workspaceSessionDBService.delete(session.id);
        this.logger.log(`Force cleaned up workspace session ${session.id}`);
      } catch (error) {
        this.logger.warn(
          `Failed to force cleanup workspace session ${session.id}`,
          error,
        );
      }
    }

    this.logger.log(
      `Force cleaned up ${allUserSessions.length} workspace sessions for user ${userId}`,
    );
  }

  /**
   * Clean up a specific workspace session and its resources
   *
   * @param session - The session to clean up
   */
  async cleanupWorkspaceSession(
    session: WorkspaceSessionEntity,
  ): Promise<void> {
    this.logger.log(`Cleaning up workspace session ${session.id}`);

    try {
      // Unregister from container registry
      await this.containerRegistry.unregisterContainer(session.id);

      // Stop and remove container if it exists
      if (session.containerId) {
        try {
          await this.dockerService.stopContainer(session.containerId);
        } catch (error) {
          this.logger.warn(
            `Failed to stop container ${session.containerId}`,
            error,
          );
        }

        try {
          await this.dockerService.removeContainer(session.containerId);
        } catch (error) {
          this.logger.warn(
            `Failed to remove container ${session.containerId}`,
            error,
          );
        }
      }

      // Remove session from database
      await this.workspaceSessionDBService.delete(session.id);

      this.logger.log(
        `Successfully cleaned up workspace session ${session.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to cleanup workspace session ${session.id}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Clean up container resources for a specific session
   * Useful when only container cleanup is needed without full session cleanup
   *
   * @param sessionId - Session ID
   * @param containerId - Container ID
   */
  async cleanupSessionContainer(
    sessionId: string,
    containerId: string,
  ): Promise<void> {
    this.logger.log(
      `Cleaning up container ${containerId} for session ${sessionId}`,
    );

    try {
      // Unregister from container registry
      await this.containerRegistry.unregisterContainer(sessionId);

      // Stop and remove container
      try {
        await this.dockerService.stopContainer(containerId);
      } catch (error) {
        this.logger.warn(`Failed to stop container ${containerId}`, error);
      }

      try {
        await this.dockerService.removeContainer(containerId);
      } catch (error) {
        this.logger.warn(`Failed to remove container ${containerId}`, error);
      }

      this.logger.log(`Successfully cleaned up container ${containerId}`);
    } catch (error) {
      this.logger.error(
        `Failed to cleanup container ${containerId} for session ${sessionId}`,
        error,
      );
      throw error;
    }
  }
}
