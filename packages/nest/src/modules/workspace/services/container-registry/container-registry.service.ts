/**
 * Container Registry Service
 *
 * Manages the mapping between workspace sessions and their container instances.
 * This service is crucial for routing tool requests to the correct containers
 * when multiple users have active sessions.
 *
 * Key responsibilities:
 * - Track which containers belong to which sessions/users
 * - Maintain container connection information (host, port, status)
 * - Provide routing information for tool requests
 * - Handle container lifecycle events (start, stop, cleanup)
 * - Monitor container health and availability
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceSessionEntity } from '../../../../shared/database/entities/session.entity';
import { DockerService } from '../../../../shared/services/docker.service';
import { ToolServerService } from '../../tool-server';
import { RedisService } from '../../../../shared/redis/redis.service';
import type { Redis } from 'ioredis';
import type { ToolOperationRequest, ToolOperationResponse, WorkspaceStatus } from '@sansa-dev/shared';
import type { ContainerConnection } from './container-registry.types';

// ContainerConnection moved to ./container-registry.types for reuse across implementations

/**
 * Container Registry Service
 *
 * In-memory registry of active containers with database persistence.
 * This solves the routing problem by maintaining a lookup table of
 * session -> container -> connection info.
 */
@Injectable()
export class ContainerRegistryService {
  private readonly logger = new Logger(ContainerRegistryService.name);
  private readonly redis: Redis;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly MAX_CONSECUTIVE_FAILURES = 3; // Evict after N failures
  private readonly FAILURE_BACKOFF_MS = 60000; // Backoff 60s after a failure burst

  // Redis key builders
  private keySessionConn = (sessionId: string): string => `containers:session:${sessionId}`;
  private keyContainerToSession = (): string => `containers:index:containerToSession`;
  private keyFailureCount = (): string => `containers:meta:failureCounts`;
  private keyNextCheckAfter = (): string => `containers:meta:nextCheckAfter`;

  private serialize(connection: ContainerConnection): string {
    return JSON.stringify({
      ...connection,
      registeredAt: connection.registeredAt.toISOString(),
      lastHealthCheck: connection.lastHealthCheck
        ? connection.lastHealthCheck.toISOString()
        : undefined,
    });
  }

  private deserialize(payload: string | null): ContainerConnection | null {
    if (!payload) return null;
    const parsed = JSON.parse(payload) as Omit<ContainerConnection, 'registeredAt' | 'lastHealthCheck'> & {
      registeredAt: string;
      lastHealthCheck?: string;
    };
    return {
      ...parsed,
      registeredAt: new Date(parsed.registeredAt),
      lastHealthCheck: parsed.lastHealthCheck ? new Date(parsed.lastHealthCheck) : undefined,
    };
  }

  constructor(
    @InjectRepository(WorkspaceSessionEntity)
    private readonly sessionRepository: Repository<WorkspaceSessionEntity>,
    private readonly dockerService: DockerService,
    private readonly toolServerService: ToolServerService,
    redisService: RedisService,
  ) {
    this.redis = redisService.getClient();
    this.initializeFromDatabase().catch((e) =>
      this.logger.error('Registry initialization failed', e instanceof Error ? e.stack : undefined),
    );
    this.startHealthCheckLoop();
  }

  /**
   * Register a new container when a session starts
   *
   * @param sessionId - Workspace session ID
   * @param containerId - Docker container ID
   * @param containerName - Container name
   * @param toolServerPort - Port where container tool server runs (usually 4321)
   * @param devServerPort - Port allocated for user's dev server
   */
  async registerContainer(
    sessionId: string,
    containerId: string,
    containerName: string,
    toolServerPort: number,
    devServerPort: number,
  ): Promise<void> {
    this.logger.log(
      `Registering container ${containerId} for session ${sessionId}`,
    );

    // Validate input parameters
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error(`Invalid sessionId: ${sessionId}`);
    }
    if (!containerId || typeof containerId !== 'string') {
      throw new Error(`Invalid containerId: ${containerId}`);
    }
    if (!containerName || typeof containerName !== 'string') {
      throw new Error(`Invalid containerName: ${containerName}`);
    }
    if (
      !toolServerPort ||
      typeof toolServerPort !== 'number' ||
      toolServerPort <= 0
    ) {
      throw new Error(`Invalid toolServerPort: ${toolServerPort}`);
    }
    if (
      !devServerPort ||
      typeof devServerPort !== 'number' ||
      devServerPort <= 0
    ) {
      throw new Error(`Invalid devServerPort: ${devServerPort}`);
    }

    // Get session info for user ID
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      this.logger.error(`Session ${sessionId} not found in database`);
      throw new Error(`Session ${sessionId} not found`);
    }

    // In dev container environment, use container name for direct network communication
    const host = containerName;

    const connection: ContainerConnection = {
      sessionId,
      userId: session.userId,
      containerId,
      containerName,
      host,
      toolServerPort, // Use the passed parameter (should be the mapped port)
      devServerPort,
      status: 'starting',
      registeredAt: new Date(),
    };

    // Persist in Redis
    await this.redis.set(this.keySessionConn(sessionId), this.serialize(connection));
    await this.redis.hset(this.keyContainerToSession(), containerId, sessionId);

    this.logger.log(`Container ${containerId} registered for session ${sessionId}`);
  }

  /**
   * Unregister a container when a session ends
   *
   * @param sessionId - Workspace session ID
   */
  async unregisterContainer(sessionId: string): Promise<void> {
    const existing = await this.getContainerConnection(sessionId);
    if (!existing) {
      this.logger.warn(`No container registered for session ${sessionId}`);
      await this.redis.del(this.keySessionConn(sessionId));
      return;
    }

    this.logger.log(`Unregistering container ${existing.containerId} for session ${sessionId}`);
    await this.redis.del(this.keySessionConn(sessionId));
    await this.redis.hdel(this.keyContainerToSession(), existing.containerId);
    await this.redis.hdel(this.keyFailureCount(), sessionId);
    await this.redis.hdel(this.keyNextCheckAfter(), sessionId);
    this.logger.log(`Unregistered container for session ${sessionId}`);
  }

  /**
   * Get container connection info for a session
   *
   * @param sessionId - Workspace session ID
   * @returns Container connection info or null if not found
   */
  async getContainerConnection(sessionId: string): Promise<ContainerConnection | null> {
    const data = await this.redis.get(this.keySessionConn(sessionId));
    const connection = this.deserialize(data);
    if (!connection) return null;

    const validationErrors = [] as string[];
    if (!connection.containerId) validationErrors.push('missing containerId');
    if (!connection.containerName) validationErrors.push('missing containerName');
    if (!connection.toolServerPort) validationErrors.push('missing toolServerPort');
    if (!connection.devServerPort) validationErrors.push('missing devServerPort');
    if (!connection.host) validationErrors.push('missing host');
    if (validationErrors.length > 0) {
      this.logger.error(`Container connection for ${sessionId} has validation errors: ${validationErrors.join(', ')}`);
      return null;
    }
    return connection;
  }

  /**
   * Get session ID for a container ID
   *
   * @param containerId - Docker container ID
   * @returns Session ID or null if not found
   */
  async getSessionForContainer(containerId: string): Promise<string | null> {
    const sessionId = await this.redis.hget(this.keyContainerToSession(), containerId);
    return sessionId ?? null;
  }

  /**
   * Send a tool request to a specific container
   *
   * @param sessionId - Target session ID
   * @param request - Container tool request
   * @returns Container tool response
   */
  async sendToolRequest(
    sessionId: string,
    request: ToolOperationRequest,
  ): Promise<ToolOperationResponse> {
    const toolRequestId = `tool_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    this.logger.debug(`[${toolRequestId}] Starting tool request`, {
      toolRequestId,
      sessionId,
      operation: request.operation,
      requestId: request.id,
    });

    const connection = await this.getContainerConnection(sessionId);
    if (!connection) {
      this.logger.error(
        `[${toolRequestId}] No container registered for session`,
        {
          toolRequestId,
          sessionId,
          operation: request.operation,
        },
      );
      throw new Error(`No container registered for session ${sessionId}`);
    }

    if (connection.status !== 'running') {
      this.logger.error(`[${toolRequestId}] Container is not running`, {
        toolRequestId,
        sessionId,
        containerId: connection.containerId,
        status: connection.status,
        operation: request.operation,
        expectedStatus: 'running',
      });
      throw new Error(
        `Container for session ${sessionId} is not running (status: ${connection.status})`,
      );
    }

    this.logger.debug(`[${toolRequestId}] Executing tool operation`, {
      toolRequestId,
      sessionId,
      containerId: connection.containerId,
      operation: request.operation,
      containerName: connection.containerName,
      host: connection.host,
      toolServerPort: connection.toolServerPort,
      request: {
        id: request.id,
        operation: request.operation,
        timestamp: request.timestamp,
        parameters: request.parameters
          ? Object.keys(request.parameters)
          : undefined,
      },
    });

    try {
      // Use the tool server service for HTTP communication
      const response = await this.toolServerService.executeOperation(
        connection,
        request,
      );

      this.logger.debug(`[${toolRequestId}] Tool operation completed`, {
        toolRequestId,
        sessionId,
        containerId: connection.containerId,
        operation: request.operation,
        success: response.success,
        duration: Date.now() - new Date(request.timestamp).getTime(),
        response: {
          success: response.success,
          error: response.error,
          dataKeys: response.data ? Object.keys(response.data) : undefined,
        },
      });

      return response;
    } catch (error) {
      this.logger.error(`[${toolRequestId}] Tool operation failed`, {
        toolRequestId,
        sessionId,
        containerId: connection.containerId,
        operation: request.operation,
        duration: Date.now() - new Date(request.timestamp).getTime(),
        errorType: typeof error,
        errorName: (error as any)?.name,
        errorMessage: (error as any)?.message,
        errorStack: (error as any)?.stack,
      });
      throw error;
    }
  }

  /**
   * Update container status
   *
   * @param sessionId - Session ID
   * @param status - New status
   */
  updateContainerStatus(
    sessionId: string,
    status: ContainerConnection['status'],
  ): void {
    this.getContainerConnection(sessionId)
      .then(async (conn) => {
        if (!conn) return;
        conn.status = status;
        await this.redis.set(this.keySessionConn(sessionId), this.serialize(conn));
        this.logger.debug(`Updated container status for session ${sessionId}: ${status}`);
      })
      .catch(() => {});
  }

  /**
   * Get all active containers for monitoring
   *
   * @returns Array of all registered containers
   */
  async getAllContainers(): Promise<ContainerConnection[]> {
    const keys = await this.redis.keys(this.keySessionConn('*'));
    if (!keys.length) return [];
    const values = await this.redis.mget(keys);
    return values.map((v) => this.deserialize(v)).filter((v): v is ContainerConnection => !!v);
  }

  /**
   * Get containers for a specific user
   *
   * @param userId - User ID
   * @returns Array of containers owned by the user
   */
  async getUserContainers(userId: string): Promise<ContainerConnection[]> {
    const all = await this.getAllContainers();
    return all.filter((c) => c.userId === userId);
  }

  /**
   * Initialize registry from database on startup
   * This recovers container information after service restarts
   */
  private async initializeFromDatabase(): Promise<void> {
    this.logger.log('Initializing container registry from Redis...');
    try {
      const connections = await this.getAllContainers();
      let evicted = 0;
      for (const conn of connections) {
        try {
          const info = await this.dockerService.getContainerInfo(conn.containerId);
          if (!info || info.state !== 'running') {
            await this.unregisterContainer(conn.sessionId);
            evicted++;
          }
        } catch {
          await this.unregisterContainer(conn.sessionId);
          evicted++;
        }
      }
      this.logger.log(`Registry initialization complete. Active: ${connections.length - evicted}, Evicted: ${evicted}`);
    } catch (error) {
      this.logger.error('Failed to initialize container registry from Redis:', error);
    }
  }

  /**
   * Get container host for networking
   * In dev container environment, containers communicate via container names within the Docker network
   */
  private getContainerHost(_containerId: string): string {
    // In dev container environment, we connect directly to containers by name within the sansa-dev network
    // This method is called during container registration, so we don't have the container in registry yet
    // We need to get the container name from the Docker service or session

    // For now, return the container name that will be passed to registerContainer
    // The actual container name will be set when registerContainer is called
    return 'localhost'; // This will be overridden in registerContainer
  }

  /**
   * Start periodic health checks for registered containers
   */
  private startHealthCheckLoop(): void {
    setInterval(async () => {
      const containers = await this.getAllContainers();

      for (const connection of containers) {
        if (connection.status === 'running') {
          // Backoff control per session
          const now = Date.now();
          const deferUntilStr = await this.redis.hget(this.keyNextCheckAfter(), connection.sessionId);
          const deferUntil = deferUntilStr ? parseInt(deferUntilStr, 10) : 0;
          if (deferUntil && now < deferUntil) {
            continue;
          }

          // Cross-check with database: if session no longer running, unregister to avoid stale probes
          try {
            const session = await this.sessionRepository.findOne({
              where: { id: connection.sessionId },
            });
            if (!session || this.isTerminalState(session.status)) {
              await this.unregisterContainer(connection.sessionId);
              continue;
            }
          } catch (dbError) {
            this.logger.warn(
              `DB cross-check failed for session ${connection.sessionId}: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
            );
          }

          try {
            // Basic health check via tool server service
            const result = await this.toolServerService.getHealth(connection);

            if (result.success) {
              connection.lastHealthCheck = new Date();
              connection.healthStatus = result.data.status === 'stopped' ? 'none' : result.data.status;
              await this.redis.set(this.keySessionConn(connection.sessionId), this.serialize(connection));
              await this.redis.hdel(this.keyFailureCount(), connection.sessionId);
              await this.redis.hdel(this.keyNextCheckAfter(), connection.sessionId);
            } else {
              await this.handleHealthCheckFailure(
                connection,
                result.error || 'unknown tool-server error',
              );
            }
          } catch (error) {
            // Classify and handle network/HTTP failures
            const message = error instanceof Error ? error.message : String(error);
            await this.handleHealthCheckFailure(connection, message);
          }
        }
      }
    }, this.HEALTH_CHECK_INTERVAL);

    this.logger.log('Started container health check loop');
  }

  /**
   * Handle a single health check failure with eviction/backoff logic
   */
  private async handleHealthCheckFailure(
    connection: ContainerConnection,
    reason: string,
  ): Promise<void> {
    this.logger.warn(
      `Health check failed for session ${connection.sessionId}: ${reason}`,
    );

    const currentStr = await this.redis.hget(this.keyFailureCount(), connection.sessionId);
    const current = currentStr ? parseInt(currentStr, 10) : 0;
    const next = current + 1;
    await this.redis.hset(this.keyFailureCount(), connection.sessionId, String(next));

    const backoff = next === 1 ? 5000 : this.FAILURE_BACKOFF_MS;
    await this.redis.hset(this.keyNextCheckAfter(), connection.sessionId, String(Date.now() + backoff));

    if (next >= this.MAX_CONSECUTIVE_FAILURES) {
      // Verify with Docker whether the container still exists/runs
      try {
        const info = await this.dockerService.getContainerInfo(
          connection.containerId,
        );
        const running = !!info && info.state === 'running';
        if (!running) {
          this.logger.warn(
            `Evicting session ${connection.sessionId} from registry: container ${connection.containerId} ${info ? `state=${info.state}` : 'not found'}`,
          );

          // Update DB session status if present
          try {
            const session = await this.sessionRepository.findOne({
              where: { id: connection.sessionId },
            });
            if (session) {
              session.status = 'stopped';
              await this.sessionRepository.save(session);
            }
          } catch (dbError) {
            this.logger.warn(
              `Failed to update DB status for session ${connection.sessionId}: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
            );
          }

          await this.unregisterContainer(connection.sessionId);
          return;
        }
      } catch (dockerError) {
        // If Docker lookup itself fails, treat as missing and evict
        this.logger.warn(
          `Docker info lookup failed for ${connection.containerId}: ${dockerError instanceof Error ? dockerError.message : String(dockerError)}. Evicting from registry.`,
        );
        await this.unregisterContainer(connection.sessionId);
        return;
      }
    }
  }

  private isTerminalState(status: WorkspaceStatus): boolean {
    return status === 'stopped' || status === 'error';
  }
}
