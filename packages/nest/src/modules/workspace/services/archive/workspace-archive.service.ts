/**
 * Workspace Archive Service
 *
 * Handles creation and extraction of workspace archives for persistence.
 * Provides utilities for compressing and decompressing workspace files
 * while excluding unnecessary directories and files.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ToolServerService } from '../../tool-server/tool-server.service';
import { ContainerRegistryService } from '../container-registry/container-registry.service';
import {
  ArchiveCreationParams,
  ArchiveUploadParams,
  NpmInstallParams,
} from '@sansa-dev/shared';

@Injectable()
export class WorkspaceArchiveService {
  private readonly logger = new Logger(WorkspaceArchiveService.name);

  constructor(
    private readonly toolServerService: ToolServerService,
    private readonly containerRegistry: ContainerRegistryService,
  ) {}

  /**
   * Create a compressed archive of workspace files from a container
   *
   * @param containerId - ID of the container to archive
   * @returns Promise resolving to archive buffer
   */
  async createWorkspaceArchive(containerId: string): Promise<Buffer> {
    this.logger.log(`Creating workspace archive for container ${containerId}`);

    try {
      // Get session ID for the container
      const sessionId =
        await this.containerRegistry.getSessionForContainer(containerId);
      if (!sessionId) {
        throw new Error(`No session found for container ${containerId}`);
      }

      // Get container connection
      const connection =
        await this.containerRegistry.getContainerConnection(sessionId);
      if (!connection) {
        throw new Error(
          `No container connection found for session ${sessionId}`,
        );
      }

      // Get exclude patterns for the archive
      const excludePatterns = this.getExcludePatterns();

      // Create archive parameters
      const params: ArchiveCreationParams = {
        excludePatterns,
      };

      // Create archive using HTTP API
      const result = await this.toolServerService.createArchive(
        connection,
        params,
      );

      if (!result.success) {
        throw new Error(
          `Archive creation failed: ${result.error || 'Unknown error'}`,
        );
      }

      // Decode base64 archive data
      const archiveBuffer = Buffer.from(result.data.archiveData, 'base64');

      this.logger.log(
        `Successfully created workspace archive (${archiveBuffer.length} bytes, ${result.data.filesArchived} files)`,
      );
      return archiveBuffer;
    } catch (error) {
      this.logger.error(
        `Failed to create workspace archive for container ${containerId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Extract a workspace archive into a container
   *
   * @param containerId - ID of the container to extract into
   * @param archiveBuffer - Buffer containing the compressed archive
   * @returns Promise resolving when extraction is complete
   */
  async extractWorkspaceArchive(
    containerId: string,
    archiveBuffer: Buffer,
  ): Promise<void> {
    this.logger.log(
      `Extracting workspace archive into container ${containerId}`,
    );

    try {
      // Get session ID for the container
      const sessionId =
        await this.containerRegistry.getSessionForContainer(containerId);
      if (!sessionId) {
        throw new Error(`No session found for container ${containerId}`);
      }

      // Get container connection
      const connection =
        await this.containerRegistry.getContainerConnection(sessionId);
      if (!connection) {
        throw new Error(
          `No container connection found for session ${sessionId}`,
        );
      }

      // Upload and extract archive parameters
      const params: ArchiveUploadParams = {
        archiveData: archiveBuffer.toString('base64'),
        cleanTarget: true,
      };

      // Upload and extract archive using HTTP API
      const result = await this.toolServerService.uploadAndExtractArchive(
        connection,
        params,
      );

      if (!result.success) {
        throw new Error(
          `Archive extraction failed: ${result.error || 'Unknown error'}`,
        );
      }

      // Run npm install parameters
      const npmParams: NpmInstallParams = {
        workingDir: '/app',
        timeout: 300000, // 5 minutes timeout
      };

      // Run npm install to restore dependencies
      this.logger.log(`Running npm install in container ${containerId}`);
      const npmResult = await this.toolServerService.runNpmInstall(
        connection,
        npmParams,
      );

      if (!npmResult.success) {
        this.logger.warn(
          `npm install completed with warnings: ${npmResult.error || 'Unknown error'}`,
        );
      } else {
        this.logger.log(`npm install completed successfully`);
      }

      this.logger.log(
        `Successfully extracted workspace archive into container ${containerId} (${result.data.filesExtracted} files)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to extract workspace archive into container ${containerId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get patterns to exclude from workspace archives
   *
   * @returns Array of exclude patterns for tar command
   */
  private getExcludePatterns(): string[] {
    return [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '.next/**',
      '.nuxt/**',
      '.output/**',
      '.vercel/**',
      '.netlify/**',
      'coverage/**',
      '.nyc_output/**',
      '*.log',
      '.DS_Store',
      'Thumbs.db',
      '.env*',
      '.vscode/**',
      '.idea/**',
      '*.swp',
      '*.swo',
      '*~',
      '.cache/**',
      '.tmp/**',
      'tmp/**',
    ];
  }
}
