/**
 * Workspace Persistence Service
 *
 * Core service for workspace save/load operations. Handles the coordination
 * between archive creation/extraction and storage operations to provide
 * seamless workspace persistence.
 */

import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from '../../../../shared/storage/storage.service';
import { WorkspaceArchiveService } from '../archive/workspace-archive.service';
import { WorkspaceSessionEntity } from '../../../../shared/database/entities/session.entity';
import type { SaveWorkspaceResponse } from '@sansa-dev/shared';

@Injectable()
export class WorkspacePersistenceService {
  private readonly logger = new Logger(WorkspacePersistenceService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly archiveService: WorkspaceArchiveService,
  ) {}

  /**
   * Save a workspace by creating an archive and uploading to storage
   *
   * @param session - The workspace session to save
   * @returns Promise resolving to save response
   */
  async saveWorkspaceArchive({
    sessionId,
    userId,
    workspaceId,
    containerId,
  }: {
    sessionId: string;
    userId: string;
    workspaceId: string;
    containerId: string;
  }): Promise<SaveWorkspaceResponse> {
    this.logger.log(`Saving workspace for session ${sessionId}`);

    try {
      if (!containerId) {
        throw new Error(`Workspace session ${sessionId} has no container`);
      }

      // Create archive from container
      const archiveBuffer =
        await this.archiveService.createWorkspaceArchive(containerId);

      // Generate storage key
      const storageKey = this.generateWorkspaceStorageKey(userId, workspaceId);

      // Upload to storage
      await this.storageService.uploadFile({
        file: archiveBuffer,
        filename: 'workspace.tar.gz',
        mimeType: 'application/gzip',
        userId: userId,
        workspaceId: workspaceId || 'default',
        category: 'workspace-archive',
      });

      const savedAt = new Date().toISOString();

      this.logger.log(
        `Successfully saved workspace ${sessionId} to ${storageKey}`,
      );
      return {
        success: true,
        savedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to save workspace ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * Load a workspace by downloading and extracting an archive into a container
   *
   * @param containerId - ID of the container to load into
   * @param storageKey - Storage key of the archive to load
   * @returns Promise resolving when loading is complete
   */
  async loadWorkspaceArchive({
    containerId,
    storageKey,
  }: {
    containerId: string;
    storageKey: string;
  }): Promise<void> {
    this.logger.log(
      `Loading workspace into container ${containerId} from ${storageKey}`,
    );

    try {
      // Download archive from storage
      const archiveBuffer = await this.storageService.downloadFile(storageKey);

      // Extract archive into container
      await this.archiveService.extractWorkspaceArchive(
        containerId,
        archiveBuffer,
      );

      this.logger.log(
        `Successfully loaded workspace into container ${containerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to load workspace into container ${containerId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Generate a predictable storage key for workspace archives
   *
   * @param userId - User ID
   * @param workspaceId - Workspace ID (optional)
   * @returns Storage key for the workspace archive
   */
  generateWorkspaceStorageKey(
    userId: string,
    workspaceId?: string | null,
  ): string {
    const effectiveWorkspaceId = workspaceId || 'default';
    return `/workspaces/${userId}/${effectiveWorkspaceId}/workspace.tar.gz`;
  }

  /**
   * Check if a workspace has a saved archive
   *
   * @param userId - User ID
   * @param workspaceId - Workspace ID (optional)
   * @returns Promise resolving to true if archive exists
   */
  async hasSavedWorkspaceArchive({
    userId,
    workspaceId,
  }: {
    userId: string;
    workspaceId?: string | null;
  }): Promise<boolean> {
    try {
      const storageKey = this.generateWorkspaceStorageKey(userId, workspaceId);
      return await this.storageService.fileExists(storageKey);
    } catch (error) {
      this.logger.debug(
        `No saved workspace found for user ${userId}, workspace ${workspaceId || 'default'} ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Delete a saved workspace archive
   *
   * @param userId - User ID
   * @param workspaceId - Workspace ID
   * @returns Promise resolving when deletion is complete
   */
  async deleteSavedWorkspaceArchive({
    userId,
    workspaceId,
  }: {
    userId: string;
    workspaceId: string;
  }): Promise<void> {
    try {
      const storageKey = this.generateWorkspaceStorageKey(userId, workspaceId);
      await this.storageService.deleteFile(storageKey);
      this.logger.log(`Deleted saved workspace archive: ${storageKey}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete saved workspace for user ${userId}`,
        error,
      );
      throw error;
    }
  }
}
