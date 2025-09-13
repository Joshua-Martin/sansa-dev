import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { WorkspaceSessionEntity } from '../../../../shared/database/entities/session.entity';
import { DockerService } from '../../../../shared/services/docker.service';
import { WorkspaceGateway } from '../../workspace.gateway';
import { SessionActivityManager } from './session-activity-manager.service';
import { ActivityBasedCleanupProcessor } from '../../processors/activity-based-cleanup.processor';
import { WorkspacePersistenceService } from '../persistence/workspace-persistence.service';
import { WorkspaceInitializerService } from '../startup/workspace-initializer.service';
import { WorkspaceDatabaseService } from '../../../../shared/database/services/workspace.service';
import { WorkspaceSessionDatabaseService } from '../../../../shared/database/services/workspace-session.service';
import { SessionCleanupService } from './session-cleanup.service';

import { ContainerRegistryService } from '../container-registry/container-registry.service';
import { ContainerConnection } from '../container-registry';
import { ToolServerTestService } from '../startup/tool-server-test';
import { ToolServerService } from '../../tool-server/tool-server.service';
import { CreateSessionDto } from '../../dto/session.dto';
import { config } from '../../../../shared/utils/config';
import * as net from 'net';
import type {
  WorkspaceSession,
  CreateWorkspaceResponse,
  WorkspaceStatusResponse,
  SaveWorkspaceResponse,
  ResourceAllocation,
  PreviewEnvironment,
  ContainerMetrics,
} from '@sansa-dev/shared';

/**
 * SessionService
 *
 * Core service that orchestrates workspace session lifecycle including:
 * - Creating and managing Docker container sessions
 * - Session status monitoring and metrics
 * - Container orchestration and health monitoring
 * - Resource quota management and port allocation
 * - Activity tracking integration
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly portRange = { min: 8000, max: 8100 };
  private readonly toolServerPortRange = { min: 9000, max: 9100 }; // Separate range for tool servers

  constructor(
    private readonly workspaceSessionDBService: WorkspaceSessionDatabaseService,
    private readonly dockerService: DockerService,
    private readonly workspaceGateway: WorkspaceGateway,
    @Inject(forwardRef(() => SessionActivityManager))
    private readonly activityManager: SessionActivityManager,
    @Inject(forwardRef(() => ActivityBasedCleanupProcessor))
    private readonly persistenceService: WorkspacePersistenceService,
    private readonly workspaceInitializer: WorkspaceInitializerService,
    private readonly workspaceDbService: WorkspaceDatabaseService,
    private readonly containerRegistry: ContainerRegistryService,
    private readonly toolServerTest: ToolServerTestService,
    private readonly toolServerService: ToolServerService,
    private readonly sessionCleanupService: SessionCleanupService,
  ) {}

  /**
   * Create a new session for an existing workspace
   * This loads the workspace data from storage into a new container
   */
  async createSession(
    userId: string,
    createSessionDto: CreateSessionDto,
  ): Promise<CreateWorkspaceResponse> {
    // Validate userId format and type
    this.validateUserId(userId);

    this.logger.log(
      `Creating session for workspace ${createSessionDto.workspaceId}`,
    );

    let allocatedPort: number | null = null;
    let createdSession: WorkspaceSessionEntity | null = null;

    try {
      // Check if user already has an active session for this workspace
      const existingSession = await this.findActiveWorkspaceForUser(
        userId,
        createSessionDto.workspaceId,
      );

      if (existingSession) {
        this.logger.log(
          `***************************
          
          
          **************************************************
          
          Reusing existing session ${existingSession.id} for workspace ${createSessionDto.workspaceId}`,
        );

        // CRITICAL: Even when reusing an existing session, we need to verify the container is still healthy
        // The container might have been stopped, crashed, or the tool server might not be responding
        try {
          await this.validateExistingSessionHealth(existingSession);
          this.logger.log(
            `Existing session ${existingSession.id} validated as healthy`,
          );

          // Update activity level and last activity time
          existingSession.activityLevel = 'active';
          existingSession.lastActivityAt = new Date().toISOString();
          existingSession.isReady = true; // Confirmed healthy
          await this.workspaceSessionDBService.update(existingSession.id, {
            activityLevel: 'active',
            lastActivityAt: new Date().toISOString(),
            isReady: true,
          });

          return {
            session: this.entityToWorkspaceSession(existingSession),
            estimatedReadyTime: 0, // Already validated and ready
          };
        } catch (validationError) {
          this.logger.warn(
            `Existing session ${existingSession.id} failed health validation: ${validationError instanceof Error ? validationError.message : String(validationError)}`,
          );

          // If validation fails, we need to clean up the invalid session and create a new one
          this.logger.log(
            `Cleaning up invalid existing session ${existingSession.id}`,
          );
          await this.sessionCleanupService.forceCleanupUserWorkspaceSessions(
            userId,
          );

          // Continue with creating a new session instead of reusing the invalid one
          this.logger.log(
            `Will create new session instead of reusing invalid session ${existingSession.id}`,
          );
        }
      }

      // Clean up any old sessions for this user before creating new one
      await this.sessionCleanupService.cleanupUserWorkspaceSessions(userId);

      // Generate unique container name
      const containerName = this.generateContainerName(userId);

      // Allocate ports for the session with retry logic
      allocatedPort = await this.allocatePortWithRetry();
      const toolServerPort = await this.allocateToolServerPortWithRetry();
      this.logger.log(
        `Allocated HMR port ${allocatedPort} and tool server port ${toolServerPort} for session`,
      );

      // Set default resource allocation and environment
      const resources = this.getDefaultResources();
      const environment = this.getDefaultEnvironment();

      // Create workspace session entity
      createdSession = await this.workspaceSessionDBService.create({
        userId,
        workspaceId: createSessionDto.workspaceId,
        containerName,
        status: 'creating',
        previewUrl: this.constructPreviewUrl(allocatedPort),
        port: allocatedPort,
        toolServerPort: toolServerPort, // Store tool server port separately
        resources,
        environment,
        activityLevel: 'active',
        activeConnectionCount: 0,
        isReady: false,
        hasSavedChanges: false,
      });
      this.logger.log(
        `Created new session ${createdSession.id} for workspace ${createSessionDto.workspaceId} on port ${allocatedPort}`,
      );

      // Start container creation and workspace loading asynchronously
      // Pass the port to avoid race conditions
      this.initializeSessionAsync(createdSession);

      return {
        session: this.entityToWorkspaceSession(createdSession),
        estimatedReadyTime: 60, // 60 seconds estimated setup time
      };
    } catch (error) {
      this.logger.error(
        `Failed to create session for workspace ${createSessionDto.workspaceId}`,
        error,
      );

      // Clean up on failure
      if (createdSession) {
        try {
          await this.workspaceSessionDBService.delete(createdSession.id);
          this.logger.log(`Cleaned up failed session ${createdSession.id}`);
        } catch (cleanupError) {
          this.logger.warn(
            `Failed to cleanup session ${createdSession.id}:`,
            cleanupError,
          );
        }
      }

      throw new BadRequestException('Failed to create workspace session');
    }
  }

  /**
   * Allocate tool server port with retry logic to handle race conditions
   */
  private async allocateToolServerPortWithRetry(
    maxRetries: number = 3,
  ): Promise<number> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const port = await this.allocateToolServerPort();

        // Double-check port availability right before returning
        const isStillAvailable = await this.isPortAvailable(port);
        if (!isStillAvailable) {
          this.logger.warn(
            `Tool server port ${port} became unavailable after allocation (attempt ${attempt}), retrying`,
          );
          continue;
        }

        return port;
      } catch (error) {
        this.logger.warn(
          `Tool server port allocation attempt ${attempt} failed:`,
          error,
        );

        if (attempt === maxRetries) {
          throw error;
        }

        // Wait a bit before retrying to avoid immediate conflicts
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
      }
    }

    throw new BadRequestException(
      'Failed to allocate tool server port after multiple attempts',
    );
  }

  /**
   * Allocate port with retry logic to handle race conditions
   */
  private async allocatePortWithRetry(maxRetries: number = 3): Promise<number> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const port = await this.allocatePort();

        // Double-check port availability right before returning
        // This helps catch race conditions between allocation and container creation
        const isStillAvailable = await this.isPortAvailable(port);
        if (!isStillAvailable) {
          this.logger.warn(
            `Port ${port} became unavailable after allocation (attempt ${attempt}), retrying`,
          );
          continue;
        }

        return port;
      } catch (error) {
        this.logger.warn(`Port allocation attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          throw error;
        }

        // Wait a bit before retrying to avoid immediate conflicts
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
      }
    }

    throw new BadRequestException(
      'Failed to allocate port after multiple attempts',
    );
  }

  /**
   * Get workspace session status and metrics
   */
  async getSessionStatus(
    sessionId: string,
    userId: string,
  ): Promise<WorkspaceStatusResponse> {
    const session = await this.findSessionByIdAndUser(sessionId, userId);

    let metrics: ContainerMetrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      networkIn: 0,
      networkOut: 0,
      uptime: 0,
    };

    // Get container metrics if container is running
    if (session.containerId && session.status === 'running') {
      try {
        metrics = await this.dockerService.getContainerMetrics(
          session.containerId,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to get metrics for container ${session.containerId}`,
          error,
        );
      }
    }

    const statusResponse: WorkspaceStatusResponse = {
      sessionId: session.id,
      status: session.status,
      isReady: session.isReady,
      previewUrl: session.isReady ? session.previewUrl : undefined,
      error: session.error || undefined,
      metrics,
    };

    // Broadcast status update via WebSocket for real-time updates
    this.logger.log(
      `🔄 [SESSION-SERVICE] Broadcasting workspace status update for session ${sessionId}`,
    );
    this.logger.log(
      `📊 [SESSION-SERVICE] Status details: session=${sessionId}, status=${statusResponse.status}, isReady=${statusResponse.isReady}, hasMetrics=${!!statusResponse.metrics}`,
    );
    this.logger.log(
      `🎯 [SESSION-SERVICE] Event type to be sent: workspace-status`,
    );

    try {
      await this.workspaceGateway.broadcastWorkspaceStatus(
        sessionId,
        statusResponse,
      );
      this.logger.log(
        `✅ [SESSION-SERVICE] Successfully broadcast workspace-status event for session ${sessionId}`,
      );
    } catch (error) {
      // Don't fail the request if WebSocket broadcasting fails
      this.logger.warn(
        `❌ [SESSION-SERVICE] Failed to broadcast workspace status for ${sessionId}`,
        error,
      );
      this.logger.warn(
        `🚨 [SESSION-SERVICE] This may cause frontend polling fallback or missed status updates`,
      );
    }

    return statusResponse;
  }

  /**
   * Delete workspace session and cleanup resources
   */
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.findSessionByIdAndUser(sessionId, userId);

    this.logger.log(`Deleting workspace session ${sessionId}`);

    try {
      // Force cleanup through activity manager
      await this.activityManager.forceCleanup(sessionId);

      // Unregister container from registry
      await this.containerRegistry.unregisterContainer(sessionId);

      // Stop and remove container if it exists
      if (session.containerId) {
        await this.dockerService.stopContainer(session.containerId);
        await this.dockerService.removeContainer(session.containerId);
      }

      // Remove session from database
      await this.workspaceSessionDBService.delete(session.id);

      this.logger.log(`Successfully deleted workspace session ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete workspace session ${sessionId}`,
        error,
      );
      throw new BadRequestException('Failed to delete workspace session');
    }
  }

  /**
   * Update workspace session activity (replaces old keepalive functionality)
   */
  async updateActivity(sessionId: string, userId: string): Promise<void> {
    const session = await this.findSessionByIdAndUser(sessionId, userId);

    // Update activity level and last activity time
    const now = new Date();
    await this.workspaceSessionDBService.update(session.id, {
      activityLevel: 'active',
      lastActivityAt: now.toISOString(),
    });

    // Only log in development/debug mode
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Updated activity for session ${sessionId}`);
    }
  }

  /**
   * Save workspace session changes
   */
  async saveSession(
    sessionId: string,
    userId: string,
  ): Promise<SaveWorkspaceResponse> {
    const session = await this.findSessionByIdAndUser(sessionId, userId);

    this.logger.log(
      `Saving workspace sesosion ${sessionId} for user ${userId}`,
    );

    try {
      const result: SaveWorkspaceResponse =
        await this.persistenceService.saveWorkspaceArchive({
          sessionId: session.id,
          userId: session.userId,
          workspaceId: session.workspaceId,
          containerId: session.containerId,
        });

      // Update session last saved timestamp
      await this.workspaceSessionDBService.updateLastSaved(session.id);

      this.logger.log(`Successfully saved workspace ${sessionId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to save workspace ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * Find active session for a specific workspace
   */
  private async findActiveWorkspaceForUser(
    userId: string,
    workspaceId?: string,
  ): Promise<WorkspaceSessionEntity | null> {
    return await this.workspaceSessionDBService.findActiveByUserAndWorkspace(
      userId,
      workspaceId,
    );
  }

  /**
   * Initialize session asynchronously with container creation and workspace loading
   * This always loads from an existing workspace archive - no template needed
   */
  private async initializeSessionAsync(
    session: WorkspaceSessionEntity,
  ): Promise<void> {
    let containerId: string | null = null;
    let containerCreated = false;
    let containerStarted = false;

    try {
      this.logger.log(`Initializing session ${session.id} asynchronously`);

      // Update status to initializing
      await this.workspaceSessionDBService.update(session.id, {
        status: 'initializing',
      });

      // Create container using core workspace image
      const registryPort = config.getOrDefault('WORKSPACE_REG_PORT', '5100');
      const imageName = `localhost:${registryPort}/workspace-core:latest`;

      this.logger.debug(`Using container image: ${imageName}`);

      const containerConfig = {
        name: session.containerName,
        image: imageName,
        ports: [
          {
            containerPort: 4321,
            hostPort: session.toolServerPort!,
            protocol: 'tcp' as const,
          }, // Tool server port
          {
            containerPort: 8000,
            hostPort: session.port,
            protocol: 'tcp' as const,
          }, // Dev server port
          {
            containerPort: 8001,
            hostPort: session.port + 1,
            protocol: 'tcp' as const,
          }, // HMR port (dev port + 1)
        ],
        resources: session.resources,
        environment: session.environment.environmentVariables,
        workspaceMount: session.environment.workspaceMount,
      };

      containerId = await this.dockerService.createContainer(containerConfig);
      containerCreated = true;
      this.logger.log(`Container created successfully: ${containerId}`);

      // Update session with container ID
      await this.workspaceSessionDBService.update(session.id, { containerId });

      // Start container - this is where the port conflict can occur
      try {
        await this.dockerService.startContainer(containerId);
        containerStarted = true;
        this.logger.log(`Container started successfully: ${containerId}`);
      } catch (startError) {
        this.logger.error(
          `Failed to start container ${containerId}:`,
          startError,
        );
        throw new Error(
          `Container start failed: ${startError instanceof Error ? startError.message : 'Unknown error'}`,
        );
      }

      // Verify container is actually running before proceeding
      const containerInfo =
        await this.dockerService.getContainerInfo(containerId);
      if (containerInfo.state !== 'running') {
        throw new Error(
          `Container ${containerId} is not in running state: ${containerInfo.state}`,
        );
      }

      // CRITICAL: Wait for container to be fully ready (including tool server) BEFORE registration and usage
      await this.waitForContainerReady(containerId);

      // Register container with registry for tool system communication
      await this.containerRegistry.registerContainer(
        session.id,
        containerId,
        session.containerName,
        session.toolServerPort!, // Tool server port from session
        session.port, // Dev server port
      );

      // Update container status to running in registry
      this.containerRegistry.updateContainerStatus(session.id, 'running');

      // Initialize workspace - handles both new and existing workspaces
      if (!session.workspaceId) {
        throw new Error('Cannot initialize session without workspaceId');
      }

      // Use WorkspaceInitializerService to handle proper initialization (tool server is now guaranteed ready)
      await this.workspaceInitializer.initializeWorkspace(session, containerId);

      // Run tool server startup tests
      this.logger.log(
        `Running tool server startup tests for session ${session.id}`,
      );
      const testResults = await this.toolServerTest.runToolServerTests(
        session.id,
      );

      if (!testResults.success) {
        this.logger.error(
          `Tool server startup tests failed for session ${session.id}: ${testResults.failedTests} failed out of ${testResults.totalTests} tests`,
        );

        // Update session with error status
        await this.workspaceSessionDBService.update(session.id, {
          status: 'error',
          error: `Tool server startup tests failed: ${testResults.failedTests}/${testResults.totalTests} tests failed`,
        });

        // Broadcast failure via WebSocket
        const errorMessage = `Failed tests: ${testResults.results
          .filter((r) => !r.success)
          .map((r) => r.testName)
          .join(', ')}`;

        this.logger.log(
          `❌ [SESSION-SERVICE] Broadcasting container status: error for session ${session.id}`,
        );
        this.logger.log(
          `🎯 [SESSION-SERVICE] Event type to be sent: container-error`,
        );
        this.logger.log(`📝 [SESSION-SERVICE] Error message: ${errorMessage}`);

        await this.workspaceGateway.broadcastContainerStatus(
          session.id,
          'error',
          'Tool server startup tests failed',
          errorMessage,
        );

        this.logger.log(
          `✅ [SESSION-SERVICE] Successfully broadcast container-error event for session ${session.id}`,
        );

        return;
      }

      this.logger.log(
        `Tool server startup tests passed for session ${session.id}`,
      );

      // Update session as ready
      await this.workspaceSessionDBService.update(session.id, {
        status: 'running',
        isReady: true,
      });

      this.logger.log(`Successfully initialized session ${session.id}`);

      // Broadcast successful initialization via WebSocket
      this.logger.log(
        `🚀 [SESSION-SERVICE] Broadcasting container status: running for session ${session.id}`,
      );
      this.logger.log(
        `🎯 [SESSION-SERVICE] Event type to be sent: connection-status (container running)`,
      );

      await this.workspaceGateway.broadcastContainerStatus(
        session.id,
        'running',
        'Session initialized successfully',
      );

      this.logger.log(
        `✅ [SESSION-SERVICE] Successfully broadcast connection-status event for session ${session.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to initialize session ${session.id}`, error);

      // Comprehensive cleanup on failure
      await this.sessionCleanupService.cleanupFailedWorkspaceSession(
        session,
        containerId,
        containerCreated,
        containerStarted,
      );

      // Update session status to error
      await this.workspaceSessionDBService.update(session.id, {
        status: 'error',
        error: this.sanitizeErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unknown initialization error',
        ),
        containerId: null, // Clear container ID since it's cleaned up
      });

      // Broadcast initialization failure via WebSocket
      await this.workspaceGateway.broadcastContainerStatus(
        session.id,
        'error',
        'Failed to initialize session',
        error instanceof Error ? error.message : 'Unknown initialization error',
      );
    }
  }

  /**
   * Wait for container to be ready by checking health status
   */
  private async waitForContainerReady(containerId: string): Promise<void> {
    const maxAttempts = 15; // Increased attempts for tool server startup
    const delayMs = 2000; // 2 seconds between attempts

    this.logger.log(`Waiting for container ${containerId} to become ready`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // First verify container is still running
        const containerInfo =
          await this.dockerService.getContainerInfo(containerId);
        if (containerInfo.state !== 'running') {
          throw new Error(
            `Container ${containerId} stopped running during readiness check: ${containerInfo.state}`,
          );
        }

        // Check tool server health by making HTTP request to health endpoint
        const isToolServerHealthy =
          await this.checkToolServerHealth(containerId);
        if (isToolServerHealthy) {
          this.logger.log(
            `Container ${containerId} tool server is ready after ${attempt} attempts`,
          );
          return;
        }

        this.logger.debug(
          `Tool server not ready yet (attempt ${attempt}/${maxAttempts})`,
        );
      } catch (error) {
        // Enhanced error logging for debugging network issues
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorDetails =
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                code: (error as any).code,
                errno: (error as any).errno,
                syscall: (error as any).syscall,
                address: (error as any).address,
                port: (error as any).port,
              }
            : { error: String(error) };

        this.logger.debug(
          `Health check attempt ${attempt} failed for ${containerId}: ${errorMessage}`,
        );
        this.logger.debug(`Error details:`, errorDetails);

        // Check container logs to see what's happening inside
        if (attempt === 1 || attempt === 5 || attempt === 10) {
          try {
            const logs = await this.dockerService.getContainerLogs(
              containerId,
              50,
            );
            this.logger.debug(`Container logs (last 50 lines):`, logs);
          } catch (logError) {
            this.logger.debug(
              `Failed to get container logs: ${logError instanceof Error ? logError.message : String(logError)}`,
            );
          }
        }

        // If container stopped running, don't continue
        if (
          error instanceof Error &&
          error.message.includes('stopped running')
        ) {
          throw error;
        }
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new Error(
      `Container ${containerId} tool server failed to become ready after ${maxAttempts} attempts (${(maxAttempts * delayMs) / 1000}s)`,
    );
  }

  /**
   * Validate that an existing session's container and tool server are still healthy
   * This is critical when reusing sessions to ensure the container hasn't crashed or stopped
   */
  private async validateExistingSessionHealth(
    session: WorkspaceSessionEntity,
  ): Promise<void> {
    this.logger.log(`Validating health of existing session ${session.id}`);

    try {
      // Step 1: Verify the Docker container is still running
      if (!session.containerId) {
        throw new Error(`Session ${session.id} has no associated container`);
      }

      const containerInfo = await this.dockerService.getContainerInfo(
        session.containerId,
      );
      if (!containerInfo) {
        throw new Error(`Container ${session.containerId} no longer exists`);
      }

      if (containerInfo.state !== 'running') {
        throw new Error(
          `Container ${session.containerId} is not running (state: ${containerInfo.state})`,
        );
      }

      this.logger.debug(`Container ${session.containerId} is running`);

      // Step 2: Check tool server health
      const isToolServerHealthy = await this.checkToolServerHealth(
        session.containerId,
      );
      if (!isToolServerHealthy) {
        throw new Error(
          `Tool server health check failed for container ${session.containerId}`,
        );
      }

      this.logger.debug(`Tool server is healthy for session ${session.id}`);

      // Step 3: Register the container with the registry (if not already registered)
      // This is needed because the registry is empty on app restart
      if (!this.containerRegistry.getContainerConnection(session.id)) {
        await this.containerRegistry.registerContainer(
          session.id,
          session.containerId,
          session.containerName,
          session.toolServerPort!,
          session.port,
        );
        this.logger.debug(
          `Registered existing container ${session.containerId} with registry`,
        );
      }

      // Step 4: Run comprehensive tool server tests
      this.logger.log(
        `Running tool server tests for existing session ${session.id}`,
      );
      const testResults = await this.toolServerTest.runToolServerTests(
        session.id,
      );

      if (!testResults.success) {
        throw new Error(
          `Tool server tests failed: ${testResults.failedTests}/${testResults.totalTests} tests failed`,
        );
      }

      this.logger.log(
        `Tool server tests passed for session ${session.id}: ${testResults.passedTests}/${testResults.totalTests} tests successful`,
      );
    } catch (error) {
      this.logger.error(
        `Health validation failed for existing session ${session.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Check if the tool server inside the container is healthy and responding
   * Uses the proper ToolServerService layer for secure HTTP communication
   */
  private async checkToolServerHealth(containerId: string): Promise<boolean> {
    const healthCheckId = `health_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const startTime = Date.now();

    this.logger.debug(
      `[${healthCheckId}] Starting health check for container ${containerId}`,
    );

    // Get the session that owns this container to access tool server port
    const session =
      await this.workspaceSessionDBService.findByContainerId(containerId);

    try {
      if (!session?.containerName) {
        this.logger.warn(
          `[${healthCheckId}] No container name found for container ${containerId}`,
          {
            healthCheckId,
            containerId,
            sessionId: session?.id,
            hasSession: !!session,
            hasContainerName: !!session?.containerName,
          },
        );
        return false;
      }

      // Create a temporary connection object for health checking
      // During initialization, we don't have a registry connection yet, so we build one from session data
      const tempConnection: ContainerConnection = {
        sessionId: session.id,
        userId: session.userId,
        containerId: session.containerId!,
        containerName: session.containerName,
        host: session.containerName, // Use container name for Docker network communication
        toolServerPort: session.toolServerPort!,
        devServerPort: session.port,
        status: 'starting',
        registeredAt: new Date(),
      };

      this.logger.debug(
        `[${healthCheckId}] Using temporary connection for health check`,
        {
          healthCheckId,
          containerId,
          sessionId: session.id,
          containerName: tempConnection.containerName,
          toolServerPort: tempConnection.toolServerPort,
        },
      );

      // Use the proper tool server client layer instead of raw fetch
      const healthResponse =
        await this.toolServerService.getHealth(tempConnection);
      const duration = Date.now() - startTime;

      // The tool server returns a wrapped response: { data: { status: "healthy", ... } }
      const isHealthy = healthResponse?.data?.status === 'healthy';

      this.logger.log(`[${healthCheckId}] Health check result`, {
        healthCheckId,
        containerId,
        result: isHealthy ? 'healthy' : 'unhealthy',
        connectionType: 'container-network',
        status: isHealthy ? 'healthy' : 'unhealthy',
        healthData: healthResponse.data,
        duration,
        sessionId: session.id,
      });

      return isHealthy;
    } catch (error) {
      const totalDuration = Date.now() - startTime;

      this.logger.error(`[${healthCheckId}] Health check failed`, {
        healthCheckId,
        containerId,
        sessionId: session?.id,
        errorType: typeof error,
        errorName: (error as any)?.name,
        errorMessage: (error as any)?.message,
        errorStack: (error as any)?.stack,
        totalDuration,
      });

      return false;
    }
  }

  /**
   * Find workspace session by ID and user, throwing if not found
   */
  private async findSessionByIdAndUser(
    sessionId: string,
    userId: string,
  ): Promise<WorkspaceSessionEntity> {
    return await this.workspaceSessionDBService.findByIdAndUser(
      sessionId,
      userId,
    );
  }

  /**
   * Generate unique container name for user workspace
   */
  private generateContainerName(userId: string): string {
    const timestamp = Date.now();
    const shortUserId = userId.substring(0, 8);
    return `workspace-${shortUserId}-${timestamp}`;
  }

  /**
   * Check if a port is available on the system
   *
   * @param port - Port number to check
   * @returns Promise resolving to true if port is available
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      let resolved = false;

      const cleanup = (): void => {
        if (!resolved) {
          resolved = true;
          server.removeAllListeners();
        }
      };

      // Set a timeout to avoid hanging
      const timeout = setTimeout(() => {
        cleanup();
        server.close();
        resolve(false);
      }, 1000); // 1 second timeout

      server.listen(port, '0.0.0.0', () => {
        clearTimeout(timeout);
        server.close(() => {
          cleanup();
          resolve(true);
        });
      });

      server.on('error', (error) => {
        clearTimeout(timeout);
        cleanup();
        // Log the specific error for debugging
        if ((error as any).code === 'EADDRINUSE') {
          this.logger.debug(`Port ${port} is in use: ${error.message}`);
        } else {
          this.logger.debug(`Port ${port} check failed: ${error.message}`);
        }
        resolve(false);
      });
    });
  }

  /**
   * Allocate available tool server port from the configured range
   * Checks both database and system availability
   */
  private async allocateToolServerPort(): Promise<number> {
    // Get tool server ports currently allocated in database
    const usedPortNumbers = new Set(
      await this.workspaceSessionDBService.getAllocatedPorts('toolServerPort'),
    );

    // Randomize port selection to reduce race conditions
    const availablePorts: number[] = [];

    // First pass: collect potentially available ports
    for (
      let port = this.toolServerPortRange.min;
      port <= this.toolServerPortRange.max;
      port++
    ) {
      if (!usedPortNumbers.has(port)) {
        availablePorts.push(port);
      }
    }

    if (availablePorts.length === 0) {
      throw new BadRequestException(
        `No tool server ports available in database for range ${this.toolServerPortRange.min}-${this.toolServerPortRange.max}`,
      );
    }

    // Shuffle available ports to reduce race conditions
    const shuffledPorts = this.shuffleArray(availablePorts);

    // Second pass: check system availability for shuffled ports
    for (const port of shuffledPorts) {
      const isAvailable = await this.isPortAvailable(port);
      if (isAvailable) {
        return port;
      } else {
        this.logger.debug(
          `Tool server port ${port} is in use by another process, skipping`,
        );
      }
    }

    throw new BadRequestException(
      `No available tool server ports for workspace allocation in range ${this.toolServerPortRange.min}-${this.toolServerPortRange.max}. All ports are either in database or in use by other processes.`,
    );
  }

  /**
   * Allocate available port from the configured range
   * Checks both database and system availability
   */
  private async allocatePort(): Promise<number> {
    // Get ports currently allocated in database (including recent allocations)
    const usedPortNumbers = new Set(
      await this.workspaceSessionDBService.getAllocatedPorts('port'),
    );

    // Randomize port selection to reduce race conditions
    const availablePorts: number[] = [];

    // First pass: collect potentially available ports
    for (let port = this.portRange.min; port <= this.portRange.max; port++) {
      if (!usedPortNumbers.has(port)) {
        availablePorts.push(port);
      }
    }

    if (availablePorts.length === 0) {
      throw new BadRequestException(
        `No ports available in database for range ${this.portRange.min}-${this.portRange.max}`,
      );
    }

    // Shuffle available ports to reduce race conditions
    const shuffledPorts = this.shuffleArray(availablePorts);

    // Second pass: check system availability for shuffled ports
    for (const port of shuffledPorts) {
      const isAvailable = await this.isPortAvailable(port);
      if (isAvailable) {
        return port;
      } else {
        this.logger.debug(
          `Port ${port} is in use by another process, skipping`,
        );
      }
    }

    throw new BadRequestException(
      `No available ports for workspace allocation in range ${this.portRange.min}-${this.portRange.max}. All ports are either in database or in use by other processes.`,
    );
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   *
   * @param array - Array to shuffle
   * @returns Shuffled copy of the array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get default resource allocation with user overrides
   */
  private getDefaultResources(
    userResources?: Partial<ResourceAllocation>,
  ): ResourceAllocation {
    return {
      cpu: userResources?.cpu ?? 0.5,
      memory: userResources?.memory ?? 512,
      storage: userResources?.storage ?? 1024,
      networkBandwidth: userResources?.networkBandwidth ?? 10,
    };
  }

  /**
   * Get default environment configuration with user overrides
   */
  private getDefaultEnvironment(
    userEnvironment?: Partial<PreviewEnvironment>,
  ): PreviewEnvironment {
    return {
      nodeVersion: userEnvironment?.nodeVersion ?? '20.3.0',
      buildTool: userEnvironment?.buildTool ?? 'astro',
      environmentVariables: {
        NODE_ENV: 'development',
        ...userEnvironment?.environmentVariables,
      },
      workspaceMount: userEnvironment?.workspaceMount ?? '/app',
      outputPath: userEnvironment?.outputPath ?? '/app/dist',
      hmrEnabled: userEnvironment?.hmrEnabled ?? true,
      devServerPort: userEnvironment?.devServerPort ?? 4321,
    };
  }

  /**
   * Convert entity to shared type
   */
  private entityToWorkspaceSession(
    entity: WorkspaceSessionEntity,
  ): WorkspaceSession {
    // workspaceId must be present for valid sessions
    if (!entity.workspaceId) {
      throw new Error(`Session ${entity.id} has no associated workspace`);
    }

    return {
      id: entity.id,
      userId: entity.userId,
      workspaceId: entity.workspaceId,
      containerId: entity.containerId || undefined,
      containerName: entity.containerName,
      status: entity.status,
      previewUrl: entity.previewUrl,
      port: entity.port,
      toolServerPort: entity.toolServerPort,
      resources: entity.resources,
      environment: entity.environment,
      createdAt: entity.createdAt,
      lastActivityAt: entity.lastActivityAt,
      activityLevel: entity.activityLevel,
      activeConnectionCount: entity.activeConnectionCount,
      gracePeriodEndsAt: entity.gracePeriodEndsAt,
      connectionMetrics: entity.connectionMetrics,
      isReady: entity.isReady,
      error: entity.error || undefined,
      hasSavedChanges: entity.hasSavedChanges,
      lastSavedAt: entity.lastSavedAt,
      templateId: entity.templateId || undefined,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Validate workspace session ownership
   * @param sessionId - The sessionId to validate
   * @param userId - The userId to check ownership against
   * @throws NotFoundException if session not found or not owned by user
   */
  async validateWorkspaceSessionOwnership(
    sessionId: string,
    userId: string,
  ): Promise<void> {
    try {
      await this.workspaceSessionDBService.validateOwnership(sessionId, userId);
    } catch (error) {
      this.logger.error(
        `Failed to validate workspace session ownership for session ${sessionId} and user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Construct preview URL based on environment and port mapping
   * @param port - The allocated host port for the container
   * @returns The preview URL that can be accessed from the browser
   */
  private constructPreviewUrl(port: number): string {
    // In dev container environment, we need to use localhost with the mapped port
    // The containers are created with Docker-in-Docker, so the host port is accessible
    // via localhost from the browser (which is forwarded through the dev container)
    const baseUrl = process.env.PREVIEW_BASE_URL || 'http://localhost';

    const previewUrl = `${baseUrl}:${port}`;
    return previewUrl;
  }

  /**
   * Validate userId format and type
   * @param userId - The userId to validate
   * @throws BadRequestException if userId is invalid
   */
  private validateUserId(userId: string): void {
    // Type validation
    if (typeof userId !== 'string') {
      throw new BadRequestException('User ID must be a string');
    }

    // Format validation (UUID v4)
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('User ID cannot be empty');
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new BadRequestException('User ID must be a valid UUID format');
    }
  }

  /**
   * Sanitize error messages to prevent database encoding issues
   * Removes null bytes and other problematic characters
   */
  private sanitizeErrorMessage(message: string): string {
    if (!message) return 'Unknown error';

    // Remove null bytes and other control characters that can cause PostgreSQL encoding issues
    return message
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove other control characters
      .trim()
      .substring(0, 1000); // Limit length to prevent overly long error messages
  }
}
