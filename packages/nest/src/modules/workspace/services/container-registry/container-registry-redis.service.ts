import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Redis } from 'ioredis';
import { WorkspaceSessionEntity } from '../../../../shared/database/entities/session.entity';
import { DockerService } from '../../../../shared/services/docker.service';
import { ToolServerService } from '../../tool-server';
import { RedisService } from '../../../../shared/redis/redis.service';
import type { ContainerConnection } from './container-registry.types';
import type { WorkspaceStatus } from '@sansa-dev/shared';

/**
 * Redis-backed container registry implementation.
 * Production-ready, persistent, horizontally scalable registry for container connections.
 */
@Injectable()
export class ContainerRegistryRedisService {
  private readonly logger = new Logger(ContainerRegistryRedisService.name);
  private readonly redis: Redis;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30s
  private readonly MAX_CONSECUTIVE_FAILURES = 3;
  private readonly FAILURE_BACKOFF_MS = 60000;

  constructor(
    @InjectRepository(WorkspaceSessionEntity)
    private readonly sessionRepository: Repository<WorkspaceSessionEntity>,
    private readonly dockerService: DockerService,
    private readonly toolServerService: ToolServerService,
    redisService: RedisService,
  ) {
    this.redis = redisService.getClient();
    this.initializeFromRedisOnStartup().catch((e) =>
      this.logger.error('Initialization from Redis failed', e instanceof Error ? e.stack : undefined),
    );
    this.startHealthCheckLoop();
  }

  // Redis keys
  private keySessionConn(sessionId: string): string {
    return `containers:session:${sessionId}`;
  }
  private keyContainerToSession(): string {
    return `containers:index:containerToSession`;
  }
  private keyFailureCount(): string {
    return `containers:meta:failureCounts`;
  }
  private keyNextCheckAfter(): string {
    return `containers:meta:nextCheckAfter`;
  }

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

  async registerContainer(
    sessionId: string,
    containerId: string,
    containerName: string,
    toolServerPort: number,
    devServerPort: number,
  ): Promise<void> {
    this.logger.log(`Registering container ${containerId} for session ${sessionId}`);

    // Validate and fetch session for userId
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const host = containerName; // inside dev network, name is resolvable
    const connection: ContainerConnection = {
      sessionId,
      userId: session.userId,
      containerId,
      containerName,
      host,
      toolServerPort,
      devServerPort,
      status: 'starting',
      registeredAt: new Date(),
    };

    await this.redis.set(this.keySessionConn(sessionId), this.serialize(connection));
    await this.redis.hset(this.keyContainerToSession(), containerId, sessionId);
  }

  async unregisterContainer(sessionId: string): Promise<void> {
    const existing = await this.getContainerConnection(sessionId);
    if (!existing) {
      this.logger.warn(`No container registered for session ${sessionId}`);
      await this.redis.del(this.keySessionConn(sessionId));
      return;
    }

    await this.redis.del(this.keySessionConn(sessionId));
    await this.redis.hdel(this.keyContainerToSession(), existing.containerId);
    await this.redis.hdel(this.keyFailureCount(), sessionId);
    await this.redis.hdel(this.keyNextCheckAfter(), sessionId);
  }

  async getContainerConnection(sessionId: string): Promise<ContainerConnection | null> {
    const data = await this.redis.get(this.keySessionConn(sessionId));
    const connection = this.deserialize(data);
    if (!connection) return null;

    // Validate essential fields
    if (!connection.containerId || !connection.containerName || !connection.toolServerPort || !connection.devServerPort || !connection.host) {
      this.logger.error(`Container connection for ${sessionId} has validation errors`);
      return null;
    }
    return connection;
  }

  async getSessionForContainer(containerId: string): Promise<string | null> {
    const sessionId = await this.redis.hget(this.keyContainerToSession(), containerId);
    return sessionId ?? null;
  }

  async sendToolRequest(sessionId: string, request: any): Promise<any> {
    const connection = await this.getContainerConnection(sessionId);
    if (!connection) {
      throw new Error(`No container registered for session ${sessionId}`);
    }
    if (connection.status !== 'running') {
      throw new Error(`Container for session ${sessionId} is not running (status: ${connection.status})`);
    }
    return this.toolServerService.executeOperation(connection, request);
  }

  async updateContainerStatus(sessionId: string, status: ContainerConnection['status']): Promise<void> {
    const connection = await this.getContainerConnection(sessionId);
    if (!connection) return;
    connection.status = status;
    await this.redis.set(this.keySessionConn(sessionId), this.serialize(connection));
  }

  async getAllContainers(): Promise<ContainerConnection[]> {
    const keys = await this.redis.keys(this.keySessionConn('*'));
    if (!keys.length) return [];
    const values = await this.redis.mget(keys);
    return values.map((v) => this.deserialize(v)).filter((v): v is ContainerConnection => !!v);
  }

  async getUserContainers(userId: string): Promise<ContainerConnection[]> {
    const all = await this.getAllContainers();
    return all.filter((c) => c.userId === userId);
  }

  private async initializeFromRedisOnStartup(): Promise<void> {
    this.logger.log('Initializing container registry from Redis...');
    // No-op: Redis already has prior state; we may optionally cross-check DB and Docker
    // Verify entries and evict dead ones
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
  }

  private startHealthCheckLoop(): void {
    setInterval(async () => {
      const connections = await this.getAllContainers();
      for (const connection of connections) {
        if (connection.status !== 'running') continue;

        // Backoff control
        const now = Date.now();
        const deferUntilStr = await this.redis.hget(this.keyNextCheckAfter(), connection.sessionId);
        const deferUntil = deferUntilStr ? parseInt(deferUntilStr, 10) : 0;
        if (deferUntil && now < deferUntil) continue;

        // Cross-check DB status: unregister only for terminal states
        try {
          const session = await this.sessionRepository.findOne({ where: { id: connection.sessionId } });
          if (!session || this.isTerminalState(session.status)) {
            await this.unregisterContainer(connection.sessionId);
            continue;
          }
        } catch (dbError) {
          this.logger.warn(`DB cross-check failed for session ${connection.sessionId}: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
        }

        try {
          const result = await this.toolServerService.getHealth(connection);
          if (result.success) {
            connection.lastHealthCheck = new Date();
            connection.healthStatus = result.data.status === 'stopped' ? 'none' : result.data.status;
            await this.redis.set(this.keySessionConn(connection.sessionId), this.serialize(connection));
            await this.redis.hdel(this.keyFailureCount(), connection.sessionId);
            await this.redis.hdel(this.keyNextCheckAfter(), connection.sessionId);
          } else {
            await this.handleHealthCheckFailure(connection, result.error || 'unknown tool-server error');
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await this.handleHealthCheckFailure(connection, message);
        }
      }
    }, this.HEALTH_CHECK_INTERVAL);

    this.logger.log('Started Redis-backed container health check loop');
  }

  private async handleHealthCheckFailure(connection: ContainerConnection, reason: string): Promise<void> {
    this.logger.warn(`Health check failed for session ${connection.sessionId}: ${reason}`);
    const currentStr = await this.redis.hget(this.keyFailureCount(), connection.sessionId);
    const current = currentStr ? parseInt(currentStr, 10) : 0;
    const next = current + 1;
    await this.redis.hset(this.keyFailureCount(), connection.sessionId, String(next));

    // Backoff
    const backoff = next === 1 ? 5000 : this.FAILURE_BACKOFF_MS;
    await this.redis.hset(this.keyNextCheckAfter(), connection.sessionId, String(Date.now() + backoff));

    if (next >= this.MAX_CONSECUTIVE_FAILURES) {
      try {
        const info = await this.dockerService.getContainerInfo(connection.containerId);
        const running = !!info && info.state === 'running';
        if (!running) {
          // Update DB session state to stopped if present then unregister
          try {
            const session = await this.sessionRepository.findOne({ where: { id: connection.sessionId } });
            if (session) {
              session.status = 'stopped';
              await this.sessionRepository.save(session);
            }
          } catch {}
          await this.unregisterContainer(connection.sessionId);
          return;
        }
      } catch {
        await this.unregisterContainer(connection.sessionId);
        return;
      }
    }
  }

  private isTerminalState(status: WorkspaceStatus): boolean {
    return status === 'stopped' || status === 'error';
  }
}


