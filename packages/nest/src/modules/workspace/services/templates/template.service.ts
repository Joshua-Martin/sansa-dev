/**
 * Template Service
 *
 * Unified template management service that handles template configuration,
 * metadata management, and runtime injection into workspace containers.
 *
 * This service combines template discovery/configuration with the modern
 * container tool system for runtime template injection.
 *
 * Key capabilities:
 * - Template configuration and metadata management
 * - Runtime template injection via container tool system
 * - Dependency installation and dev server management
 * - Template discovery and listing
 * - Integration with container registry for proper routing
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DockerService } from '../../../../shared/services/docker.service';
import { ContainerRegistryService } from '../container-registry/container-registry.service';
import { ToolServerService } from '../../tool-server';
import { WorkspaceSessionEntity } from '../../../../shared/database/entities/session.entity';
import { promises as fs } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import type {
  WorkspaceTemplate,
  TemplateInitializationResult,
  TemplateType,
  DevServerResultData,
  NpmInstallResultData,
  ArchiveUploadResultData,
  ArchiveUploadParams,
  DevServerParams,
  NpmInstallParams,
  PortAllocationParams,
} from '@sansa-dev/shared';

/**
 * Configuration for the template service
 */
interface TemplateServiceConfig {
  /** Base path where templates are stored */
  templatesBasePath: string;
  /** Container tool system port */
  containerToolPort: number;
  /** Default port range for development servers */
  devServerPortRange: {
    min: number;
    max: number;
  };
  /** Timeout for container operations in milliseconds */
  operationTimeout: number;
  /** Health check configuration */
  healthCheck: {
    interval: number;
    timeout: number;
    retries: number;
  };
}

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly config: TemplateServiceConfig;

  // Built-in template configurations
  private readonly builtInTemplates: Map<string, WorkspaceTemplate> = new Map([
    [
      'base',
      {
        id: 'base',
        name: 'Baseline Landing Page',
        description:
          'A clean, professional landing page template built with Astro and Tailwind CSS',
        type: 'base',
        status: 'published',
        version: '1.0.0',
        dockerImage: 'localhost:5100/workspace-core', // Updated to use our core container
        dockerTag: 'latest',
        metadata: {
          name: 'Baseline Landing Page',
          description:
            'A clean, professional landing page template built with Astro and Tailwind CSS',
          version: '1.0.0',
          templateId: 'base',
          type: 'base',
          author: 'AI Landing Page Studio',
          license: 'MIT',
          keywords: ['landing-page', 'astro', 'tailwind', 'responsive'],
          category: 'business',
          difficulty: 'beginner',
          estimatedSetupTime: 60,
          documentation:
            'A professional landing page template with hero section, features, and responsive design.',
        },
        configuration: {
          nodeVersion: '20.3.0',
          packageManager: 'npm',
          buildCommand: 'npm run build',
          devCommand: 'npm run dev',
          outputDirectory: 'dist',
          publicDirectory: 'public',
          environmentVariables: {
            NODE_ENV: 'development',
          },
          ports: {
            dev: 4321,
            preview: 4322,
          },
          healthCheck: {
            path: '/',
            timeout: 3000,
            interval: 30000,
            retries: 3,
          },
        },
        files: [], // Files are stored in the file system now
        dependencies: [
          {
            name: 'astro',
            version: '^4.0.0',
            type: 'dependency',
            optional: false,
          },
          {
            name: '@astrojs/tailwind',
            version: '^5.0.0',
            type: 'dependency',
            optional: false,
          },
          {
            name: 'tailwindcss',
            version: '^3.4.0',
            type: 'dependency',
            optional: false,
          },
          {
            name: '@astrojs/node',
            version: '^8.0.0',
            type: 'dependency',
            optional: false,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  ]);

  constructor(
    private readonly dockerService: DockerService,
    private readonly containerRegistry: ContainerRegistryService,
    private readonly toolServerService: ToolServerService,
  ) {
    // Initialize configuration - in production this should come from ConfigService
    this.config = {
      templatesBasePath:
        process.env.TEMPLATES_BASE_PATH || '/workspace/workspace-templates',
      containerToolPort: parseInt(
        process.env.CONTAINER_TOOL_PORT || '4321',
        10,
      ),
      devServerPortRange: {
        min: parseInt(process.env.DEV_SERVER_PORT_MIN || '8000', 10),
        max: parseInt(process.env.DEV_SERVER_PORT_MAX || '8100', 10),
      },
      operationTimeout: parseInt(
        process.env.CONTAINER_OPERATION_TIMEOUT || '300000',
        10,
      ), // 5 minutes
      healthCheck: {
        interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10), // 30 seconds
        timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10), // 5 seconds
        retries: parseInt(process.env.HEALTH_CHECK_RETRIES || '3', 10),
      },
    };

    this.logger.log('Template service initialized with container tool system');
  }

  // =============================================================================
  // TEMPLATE CONFIGURATION & DISCOVERY METHODS
  // =============================================================================

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<WorkspaceTemplate | null> {
    return this.builtInTemplates.get(templateId) || null;
  }

  /**
   * List available templates
   */
  async listTemplates(type?: TemplateType): Promise<WorkspaceTemplate[]> {
    const templates = Array.from(this.builtInTemplates.values());

    if (type) {
      return templates.filter((template) => template.type === type);
    }

    return templates;
  }

  // =============================================================================
  // TEMPLATE ARCHIVE CREATION METHODS (Host-side processing)
  // =============================================================================

  /**
   * Create archive from template directory
   * This runs on the host and creates a tar.gz archive of template files
   */
  async createTemplateArchive(templateId: string): Promise<Buffer> {
    const templatePath = this.getTemplatePath(templateId);
    this.logger.log(
      `Creating archive from template: ${templateId} at ${templatePath}`,
    );

    try {
      // Verify template exists
      const templateStat = await fs.stat(templatePath);
      if (!templateStat.isDirectory()) {
        throw new Error(`Template ${templateId} is not a directory`);
      }

      // Create tar.gz archive using host system
      const archivePath = `/tmp/template-${templateId}-${Date.now()}.tar.gz`;

      // Get exclude patterns for the archive
      const excludePatterns = this.getTemplateExcludePatterns();

      // Build exclude arguments array properly to avoid shell interpretation issues
      const excludeArgs: string[] = [];
      for (const pattern of excludePatterns) {
        excludeArgs.push('--exclude', pattern);
      }

      // Create tar command as array to avoid shell interpretation issues
      const tarArgs = [
        '-czf',
        archivePath,
        '-C',
        templatePath,
        ...excludeArgs,
        '.',
      ];

      // Use spawnSync with array of arguments to avoid shell escaping issues
      const result = spawnSync('tar', tarArgs, {
        stdio: 'pipe',
        cwd: templatePath, // Set working directory for extra safety
        encoding: 'utf8',
      });

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0) {
        const errorMessage =
          result.stderr || result.stdout || 'Unknown tar error';
        throw new Error(
          `tar command failed with exit code ${result.status}: ${errorMessage}`,
        );
      }

      // Read the archive into a buffer
      const archiveBuffer = await fs.readFile(archivePath);

      // Clean up temporary file
      await fs.unlink(archivePath);

      this.logger.log(
        `Successfully created template archive: ${archiveBuffer.length} bytes`,
      );
      return archiveBuffer;
    } catch (error) {
      this.logger.error(
        `Failed to create template archive for ${templateId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get exclude patterns for template archives
   */
  private getTemplateExcludePatterns(): string[] {
    return [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      '.nuxt',
      '.output',
      '.vercel',
      '.netlify',
      'coverage',
      '.nyc_output',
      '*.log',
      '.DS_Store',
      'Thumbs.db',
      '.env*',
      '.vscode',
      '.idea',
      '*.swp',
      '*.swo',
      '*~',
      '.cache',
      '.tmp',
      'tmp',
    ];
  }

  // =============================================================================
  // WORKSPACE INITIALIZATION METHODS (High-level orchestration)
  // =============================================================================

  /**
   * Initialize workspace from template with workspace context
   * This is the main entry point for workspace initialization
   */
  async initializeWorkspaceFromTemplate(
    workspaceId: string,
    templateId: string,
    containerId: string,
  ): Promise<void> {
    this.logger.log(
      `Initializing workspace ${workspaceId} from template ${templateId} in container ${containerId}`,
    );

    try {
      const result = await this.initializeWorkspace(containerId, templateId);

      if (!result.success) {
        throw new Error(
          `Template initialization failed: ${result.error || 'Unknown error'}`,
        );
      }

      this.logger.log(
        `Successfully initialized workspace ${workspaceId} from template ${templateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize workspace ${workspaceId} from template ${templateId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Initialize workspace with specified template
   * This method orchestrates the complete initialization process
   */
  async initializeWorkspace(
    containerId: string,
    templateId: string,
  ): Promise<TemplateInitializationResult> {
    this.logger.log(
      `Initializing workspace container ${containerId} with template ${templateId}`,
    );

    const startTime = Date.now();
    const result: TemplateInitializationResult = {
      success: false,
      containerId,
      filesCreated: [],
      dependenciesInstalled: [],
      buildLogs: [],
      duration: 0,
    };

    try {
      // Get template configuration
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Use the new container tool system approach
      await this.injectTemplateViaContainerTools(
        containerId,
        templateId,
        'system',
      );

      // Mark as successful
      result.success = true;
      result.filesCreated = [
        'package.json',
        'astro.config.mjs',
        'src/',
        'public/',
      ];
      result.duration = Date.now() - startTime;

      this.logger.log(
        `Successfully initialized workspace container ${containerId} with template ${templateId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to initialize workspace container ${containerId} with template ${templateId}`,
        error,
      );

      result.success = false;
      result.error =
        error instanceof Error ? error.message : 'Unknown initialization error';
      result.duration = Date.now() - startTime;

      return result;
    }
  }

  // =============================================================================
  // CONTAINER TOOL SYSTEM METHODS (Runtime injection)
  // =============================================================================

  /**
   * Initialize workspace container with template archive
   * This creates the archive on the host and injects it into the container
   */
  async injectTemplateViaContainerTools(
    containerId: string,
    templateId: string,
    sessionId: string,
  ): Promise<void> {
    this.logger.log(
      `Starting template initialization: ${templateId} -> container ${containerId}`,
    );

    try {
      // Validate prerequisites and create template archive
      await this.validatePrerequisites(containerId, templateId, sessionId);
      const templateArchive = await this.createTemplateArchive(templateId);

      // Upload and extract archive using HTTP API
      const uploadResult = await this.executeArchiveUpload(
        {
          archiveData: templateArchive.toString('base64'),
          cleanTarget: true,
        },
        sessionId,
      );

      const allocatedPort = await this.allocateDevServerPort(sessionId, 8000);

      // The archive is already extracted, so we can skip the separate extraction step
      const installResult = await this.executeNpmInstall(sessionId);
      const devServerResult = await this.executeDevServerStart(
        {
          port: allocatedPort,
          command: 'npm run dev',
          args: [],
          environment: {},
        },
        sessionId,
      );

      this.logger.log(
        `Template initialization completed: ${uploadResult.filesExtracted} files, ` +
          `${installResult.packagesInstalled} packages, dev server on port ${devServerResult.port}`,
      );
    } catch (error) {
      this.logger.error(
        `Template initialization failed for ${templateId} -> ${containerId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Inject template for a workspace session (main entry point for session-based injection)
   */
  async injectTemplate(
    session: WorkspaceSessionEntity,
    containerId: string,
  ): Promise<void> {
    if (!session.workspaceId) {
      throw new BadRequestException(
        'Session must have a workspaceId for template injection',
      );
    }

    const templateId = session.templateId || 'base';
    await this.injectTemplateViaContainerTools(
      containerId,
      templateId,
      session.id,
    );
  }

  /**
   * Stop development server in container
   */
  async stopDevServer(containerId: string, sessionId: string): Promise<void> {
    this.logger.debug(
      `Stopping dev server in container ${containerId} for session ${sessionId}`,
    );

    try {
      // Get container connection
      const connection =
        await this.containerRegistry.getContainerConnection(sessionId);
      if (!connection) {
        throw new Error(
          `No container connection found for session ${sessionId}`,
        );
      }

      // Stop dev server
      const result = await this.toolServerService.stopDevServer(connection);

      if (!result.success) {
        throw new InternalServerErrorException(
          `Failed to stop dev server: ${result.error || 'Unknown error'}`,
        );
      }

      this.logger.debug(
        `Dev server stopped successfully for session ${sessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to stop dev server for session ${sessionId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Cleanup container resources
   */
  async cleanupContainer(
    containerId: string,
    sessionId: string,
  ): Promise<void> {
    this.logger.debug(
      `Cleaning up container ${containerId} for session ${sessionId}`,
    );

    try {
      // Get container connection
      const connection =
        await this.containerRegistry.getContainerConnection(sessionId);
      if (!connection) {
        throw new Error(
          `No container connection found for session ${sessionId}`,
        );
      }

      // Note: Cleanup endpoint not implemented in container tool server
      // Cleanup operations would need to be handled differently if required
    } catch (error) {
      // Log cleanup errors but don't throw - cleanup is best effort
      this.logger.warn(
        `Container cleanup failed for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }


  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Validate prerequisites for template injection
   */
  private async validatePrerequisites(
    containerId: string,
    templateId: string,
    sessionId: string,
  ): Promise<void> {
    // Validate container state, template, and tool system
    await this.validateContainerState(containerId);
    await this.validateTemplateExists(templateId);
    await this.validateContainerToolSystem(sessionId);
  }

  /**
   * Validate that container is in a valid state for injection
   */
  private async validateContainerState(containerId: string): Promise<void> {
    try {
      const containerInfo =
        await this.dockerService.getContainerInfo(containerId);

      if (!containerInfo) {
        throw new BadRequestException(`Container ${containerId} not found`);
      }

      if (containerInfo.state !== 'running') {
        throw new BadRequestException(
          `Container ${containerId} is not running (state: ${containerInfo.state})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Container state validation failed for ${containerId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Validate template exists and is accessible
   */
  private async validateTemplateExists(templateId: string): Promise<void> {
    try {
      const templatePath = this.getTemplatePath(templateId);

      // Check if template directory exists
      const templateStat = await fs.stat(templatePath);
      if (!templateStat.isDirectory()) {
        throw new BadRequestException(
          `Template ${templateId} is not a directory`,
        );
      }

      // Check if template.json exists (optional but recommended)
      const templateJsonPath = join(templatePath, 'template.json');
      try {
        await fs.access(templateJsonPath);
        // Template metadata found
      } catch {
        this.logger.warn(`Template metadata not found: ${templateJsonPath}`);
      }
    } catch (error) {
      this.logger.error(`Template validation failed: ${templateId}`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Template ${templateId} not found or inaccessible`,
      );
    }
  }

  /**
   * Validate container tool system is responsive
   */
  private async validateContainerToolSystem(sessionId: string): Promise<void> {
    try {
      // Wait for container tool system to be ready with retry logic
      await this.waitForContainerToolSystemReady(sessionId);
    } catch (error) {
      this.logger.error(
        `Container tool system validation failed for session ${sessionId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Wait for container tool system to be ready with retry logic
   */
  private async waitForContainerToolSystemReady(
    sessionId: string,
  ): Promise<void> {
    const maxAttempts = 10; // Maximum number of attempts
    const delayMs = 2000; // 2 seconds between attempts
    const timeoutMs = 30000; // 30 second total timeout

    const startTime = Date.now();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Check if we've exceeded the total timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new InternalServerErrorException(
          `Container tool system readiness check timed out after ${timeoutMs}ms`,
        );
      }

      try {
        // Get container connection from registry (already has health state)
        const connection = await this.containerRegistry.getContainerConnection(sessionId);
        if (!connection) {
          throw new InternalServerErrorException(
            `No container connection found for session ${sessionId}`,
          );
        }

        // Check if the container and tool system are healthy using registry state
        const isHealthy =
          connection.status === 'running' &&
          (connection.healthStatus === 'healthy' || connection.healthStatus === 'starting');

        const isUnhealthy =
          connection.status === 'error' ||
          connection.status === 'stopped' ||
          connection.healthStatus === 'unhealthy' ||
          connection.healthStatus === 'none';

        if (isHealthy) {
          this.logger.log(
            `Container tool system is ready after ${attempt} attempts for session ${sessionId} (status: ${connection.status}, health: ${connection.healthStatus})`,
          );
          return;
        } else if (isUnhealthy) {
          throw new InternalServerErrorException(
            `Container tool system is not healthy (status: ${connection.status}, health: ${connection.healthStatus})`,
          );
        }
      } catch (error) {
        // Check if container is stopped/crashed - this is a fatal error, not a retry condition
        if (
          error instanceof Error &&
          error.message.includes('container stopped/paused')
        ) {
          throw new InternalServerErrorException(
            `Container has stopped or crashed: ${error.message}`,
          );
        }

        // Check if container is not running - also fatal
        if (
          error instanceof Error &&
          error.message.includes('is not running')
        ) {
          throw new InternalServerErrorException(
            `Container is not running: ${error.message}`,
          );
        }

        // If it's a JSON parsing error or connection error, the server might not be ready yet
        if (
          error instanceof SyntaxError ||
          (error instanceof Error &&
            error.message.includes('Tool request failed'))
        ) {
          // Don't throw on the last attempt - let it fall through to the delay
          if (attempt === maxAttempts) {
            throw new InternalServerErrorException(
              `Container tool system failed to become ready after ${maxAttempts} attempts: ${error.message}`,
            );
          }
        } else {
          // For other types of errors, throw immediately
          throw error;
        }
      }

      // Wait before next attempt (except on the last attempt)
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new InternalServerErrorException(
      `Container tool system failed to become ready after ${maxAttempts} attempts`,
    );
  }

  /**
   * Allocate an available port for the development server
   */
  private async allocateDevServerPort(
    sessionId: string,
    preferredPort: number,
  ): Promise<number> {
    try {
      // Get container connection
      const connection =
        await this.containerRegistry.getContainerConnection(sessionId);
      if (!connection) {
        throw new Error(
          `No container connection found for session ${sessionId}`,
        );
      }

      // Get available port with proper parameters
      const params: PortAllocationParams = {
        preferredPort,
        portRange: { min: 8000, max: 8100 },
      };

      const result = await this.toolServerService.getAvailablePort(
        connection,
        params,
      );

      if (!result.success) {
        throw new InternalServerErrorException(
          `Port allocation failed: ${result.error || 'Unknown error'}`,
        );
      }

      return result.data.allocatedPort;
    } catch (error) {
      this.logger.error(
        `Port allocation failed for session ${sessionId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Execute archive upload and extraction via tool server service
   */
  private async executeArchiveUpload(
    params: ArchiveUploadParams,
    sessionId: string,
  ): Promise<ArchiveUploadResultData> {
    try {
      // Get container connection
      const connection =
        await this.containerRegistry.getContainerConnection(sessionId);
      if (!connection) {
        throw new Error(
          `No container connection found for session ${sessionId}`,
        );
      }

      // Upload and extract archive
      const result = await this.toolServerService.uploadAndExtractArchive(
        connection,
        params,
      );

      if (!result.success) {
        throw new InternalServerErrorException(
          `Archive upload failed: ${result.error || 'Unknown error'}`,
        );
      }

      return result.data;
    } catch (error) {
      this.logger.error(
        `Archive upload execution failed for session ${sessionId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Execute npm install via tool server service
   */
  private async executeNpmInstall(
    sessionId: string,
  ): Promise<NpmInstallResultData> {
    try {
      // Get container connection
      const connection =
        await this.containerRegistry.getContainerConnection(sessionId);
      if (!connection) {
        throw new Error(
          `No container connection found for session ${sessionId}`,
        );
      }

      // Execute npm install with proper parameters
      const params: NpmInstallParams = {
        workingDir: '/app',
        timeout: this.config.operationTimeout,
      };

      const result = await this.toolServerService.runNpmInstall(
        connection,
        params,
      );

      if (!result.success) {
        throw new InternalServerErrorException(
          `npm install failed: ${result.error || 'Unknown error'}`,
        );
      }

      return result.data;
    } catch (error) {
      this.logger.error(
        `npm install execution failed for session ${sessionId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Execute development server start via tool server service
   */
  private async executeDevServerStart(
    params: DevServerParams,
    sessionId: string,
  ): Promise<DevServerResultData> {
    try {
      // Get container connection
      const connection =
        await this.containerRegistry.getContainerConnection(sessionId);
      if (!connection) {
        throw new Error(
          `No container connection found for session ${sessionId}`,
        );
      }

      // Execute dev server start
      const result = await this.toolServerService.startDevServer(
        connection,
        params,
      );

      if (!result.success) {
        throw new InternalServerErrorException(
          `Dev server start failed: ${result.error || 'Unknown error'}`,
        );
      }

      return result.data;
    } catch (error) {
      this.logger.error(
        `Development server start failed for session ${sessionId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get the file system path for a template
   */
  private getTemplatePath(templateId: string): string {
    // Sanitize templateId to prevent path traversal
    const sanitizedTemplateId = templateId.replace(/[^a-zA-Z0-9-_]/g, '');
    if (sanitizedTemplateId !== templateId) {
      throw new BadRequestException(`Invalid template ID: ${templateId}`);
    }

    return join(this.config.templatesBasePath, sanitizedTemplateId);
  }

  /**
   * Parse package count from npm install output
   */
  private parsePackageCountFromNpmOutput(output: string): number {
    try {
      // Look for patterns like "added X packages" or similar npm output
      const packageMatch =
        output.match(/added (\d+) packages?/i) ||
        output.match(/(\d+) packages? installed/i) ||
        output.match(/(\d+) packages? from/i);
      return packageMatch ? parseInt(packageMatch[1], 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Count files in a directory (rough estimate)
   */
  private countFilesInDirectory(_dirPath: string): number {
    // This is a rough estimate - in production we'd query the container
    // For now, return a reasonable default
    return 100; // Placeholder
  }

  /**
   * Get archive size (rough estimate)
   */
  private async getArchiveSize(_archivePath: string): Promise<number> {
    // This is a rough estimate - in production we'd query the container
    // For now, return a reasonable default
    return 1024000; // 1MB placeholder
  }

  /**
   * Parse PID from command output
   */
  private parsePidFromOutput(_output: string): number | undefined {
    try {
      // Look for patterns that might indicate a process started
      // This is a rough heuristic - in production we'd need better parsing
      return undefined; // For now, let the container manage PIDs
    } catch {
      return undefined;
    }
  }
}
