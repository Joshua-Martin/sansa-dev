import { Injectable, Logger } from '@nestjs/common';
import { WorkspaceSessionEntity } from '../../../../shared/database/entities/session.entity';
import { WorkspacePersistenceService } from '../persistence/workspace-persistence.service';
import { TemplateService } from '../templates/template.service';
import { DockerService } from '../../../../shared/services/docker.service';

/**
 * Workspace Initializer Service
 *
 * Handles the initialization of workspace containers for both new and existing workspaces.
 * This service determines whether to load from saved workspace archives or initialize
 * from templates, ensuring proper workspace setup for all scenarios.
 *
 * Key responsibilities:
 * - Detect if workspace has saved files or needs template initialization
 * - Load existing workspace archives from storage
 * - Initialize new workspaces from templates
 * - Save initial workspace state after template initialization
 * - Handle container setup and file loading
 */
@Injectable()
export class WorkspaceInitializerService {
  private readonly logger = new Logger(WorkspaceInitializerService.name);

  constructor(
    private readonly persistenceService: WorkspacePersistenceService,
    private readonly templateService: TemplateService,
    private readonly dockerService: DockerService,
  ) {}

  /**
   * Initialize a workspace container based on workspace state
   *
   * This method handles both new workspace creation (template initialization)
   * and existing workspace restoration (loading from saved archives).
   *
   * @param session - The workspace session being initialized
   * @param containerId - Docker container ID to initialize the workspace in
   * @returns Promise that resolves when initialization is complete
   */
  async initializeWorkspace(
    session: WorkspaceSessionEntity,
    containerId: string,
  ): Promise<void> {
    if (!session.workspaceId) {
      throw new Error('Cannot initialize workspace without workspaceId');
    }

    // if no containerId, throw error
    if (!containerId) {
      throw new Error('Cannot initialize workspace without containerId');
    }

    this.logger.log(
      `Initializing workspace ${session.workspaceId} for session ${session.id}`,
    );

    try {
      // Verify container is running before proceeding
      await this.validateContainerState(containerId);

      // Check if workspace has saved files
      const hasSavedWorkspace =
        await this.persistenceService.hasSavedWorkspaceArchive({
          userId: session.userId,
          workspaceId: session.workspaceId,
        });

      if (hasSavedWorkspace) {
        // Load existing workspace from storage
        await this.loadExistingWorkspace(session, containerId);
        this.logger.log(
          `Loaded existing workspace ${session.workspaceId} for session ${session.id}`,
        );
      } else {
        // Initialize new workspace from template
        await this.initializeFromTemplate(session, containerId);

        // Save the initial workspace state
        const saveResult = await this.persistenceService.saveWorkspaceArchive({
          sessionId: session.id,
          userId: session.userId,
          workspaceId: session.workspaceId,
          containerId: containerId,
        });
        this.logger.log(
          `Saved initial workspace state for ${session.workspaceId}: ${saveResult.success}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize workspace ${session.workspaceId} for session ${session.id}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Validate that the container is in the correct state for initialization
   *
   * @param containerId - Docker container ID to validate
   * @throws Error if container is not in a valid state
   */
  private async validateContainerState(containerId: string): Promise<void> {
    this.logger.debug(`Validating container state: ${containerId}`);

    const containerInfo =
      await this.dockerService.getContainerInfo(containerId);
    if (!containerInfo) {
      throw new Error(`Container ${containerId} not found`);
    }

    if (containerInfo.state !== 'running') {
      throw new Error(
        `Container ${containerId} is not running (state: ${containerInfo.state}). Cannot initialize workspace.`,
      );
    }

    this.logger.debug(
      `Container ${containerId} is running and ready for initialization`,
    );
  }

  /**
   * Load an existing workspace from saved archive
   *
   * @param session - The workspace session
   * @param containerId - Docker container ID to load into
   * @returns Promise that resolves when loading is complete
   */
  private async loadExistingWorkspace(
    session: WorkspaceSessionEntity,
    containerId: string,
  ): Promise<void> {
    if (!session.workspaceId) {
      throw new Error('Cannot load workspace without workspaceId');
    }

    this.logger.debug(
      `Loading existing workspace ${session.workspaceId} into container ${containerId}`,
    );

    // Validate container is still running before attempting to load
    await this.validateContainerState(containerId);

    const storageKey = this.persistenceService.generateWorkspaceStorageKey(
      session.userId,
      session.workspaceId,
    );

    await this.persistenceService.loadWorkspaceArchive({
      containerId,
      storageKey,
    });

    this.logger.debug(
      `Successfully loaded workspace ${session.workspaceId} into container ${containerId}`,
    );
  }

  /**
   * Initialize a new workspace from template
   *
   * @param session - The workspace session
   * @param containerId - Docker container ID to initialize
   * @returns Promise that resolves when initialization is complete
   */
  private async initializeFromTemplate(
    session: WorkspaceSessionEntity,
    containerId: string,
  ): Promise<void> {
    if (!session.workspaceId) {
      throw new Error('Cannot initialize workspace without workspaceId');
    }

    this.logger.debug(
      `Initializing new workspace ${session.workspaceId} from template in container ${containerId}`,
    );

    // Validate container is still running before attempting template initialization
    await this.validateContainerState(containerId);

    // Get template ID from session or use default
    const templateId = session.templateId || 'base';

    // Inject template files into container using new injection service
    await this.templateService.injectTemplate(session, containerId);

    this.logger.debug(
      `Successfully initialized workspace ${session.workspaceId} from template ${templateId}`,
    );
  }

  /**
   * Check if a workspace has been saved
   *
   * @param userId - User ID
   * @param workspaceId - Workspace ID
   * @returns Promise resolving to true if workspace has saved files
   */
  async hasWorkspaceBeenSaved(
    userId: string,
    workspaceId: string | null,
  ): Promise<boolean> {
    return this.persistenceService.hasSavedWorkspaceArchive({
      userId,
      workspaceId,
    });
  }

  /**
   * Check if a workspace can be recovered from a failed state
   *
   * A workspace can be recovered if:
   * - It exists in the database
   * - It has no saved files (indicating it never completed initialization)
   * - Previous sessions failed during initialization
   *
   * @param userId - User ID
   * @param workspaceId - Workspace ID
   * @returns Promise resolving to true if workspace can be recovered
   */
  async canWorkspaceBeRecovered(
    userId: string,
    workspaceId: string,
  ): Promise<boolean> {
    try {
      // Check if workspace has saved files - if it does, it's not in a failed state
      const hasSavedFiles =
        await this.persistenceService.hasSavedWorkspaceArchive({
          userId,
          workspaceId,
        });
      if (hasSavedFiles) {
        return false; // Workspace is fine, no recovery needed
      }

      // If no saved files exist, this workspace can be recovered by reinitializing from template
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to check if workspace ${workspaceId} can be recovered:`,
        error,
      );
      return false;
    }
  }

  /**
   * Force re-initialization of a workspace from template
   *
   * This can be used to reset a workspace to its template state
   * or to re-initialize a workspace that failed to initialize properly.
   *
   * @param session - The workspace session
   * @param containerId - Docker container ID
   * @param templateId - Template ID to initialize from (optional)
   * @returns Promise that resolves when re-initialization is complete
   */
  async reinitializeFromTemplate(
    session: WorkspaceSessionEntity,
    containerId: string,
    templateId?: string,
  ): Promise<void> {
    if (!session.workspaceId) {
      throw new Error('Cannot reinitialize workspace without workspaceId');
    }

    this.logger.log(
      `Reinitializing workspace ${session.workspaceId} from template ${templateId || 'default'}`,
    );

    // Set template ID if provided
    if (templateId) {
      session.templateId = templateId;
    }

    // Initialize from template
    await this.initializeFromTemplate(session, containerId);

    // Save the new state
    const saveResult = await this.persistenceService.saveWorkspaceArchive({
      sessionId: session.id,
      userId: session.userId,
      workspaceId: session.workspaceId,
      containerId: containerId,
    });
    this.logger.log(
      `Reinitialized and saved workspace ${session.workspaceId}: ${saveResult.success}`,
    );
  }
}
