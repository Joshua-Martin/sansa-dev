import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { Socket } from 'socket.io';
import type { Namespace } from 'socket.io';
import { WsJwtGuard } from '../../shared/guards/ws-jwt.guard';
import { CurrentUserId } from '../../shared/decorators/current-user.decorator';
import { SessionActivityManager } from './services/session/session-activity-manager.service';
import { SessionService } from './services/session/session.service';
import type {
  HMREvent,
  HMRCommand,
  HMRResponse,
  HMRWebSocketMessage,
  ActivityEvent,
  ActivityEventType,
  ConnectionState,
  WorkspaceStatusResponse,
} from '@sansa-dev/shared';

/**
 * Activity message for WebSocket communication
 */
interface ActivityMessage {
  type: ActivityEventType;
  sessionId: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

/**
 * WorkspaceGateway
 *
 * WebSocket gateway for real-time HMR and activity tracking communication:
 * - Managing socket connections per workspace session with activity tracking
 * - Forwarding file change events from containers to frontend clients
 * - Handling container status updates and build notifications
 * - Tracking user activity for intelligent cleanup decisions
 * - Providing rooms-based broadcasting for session-specific events
 */
@WebSocketGateway({
  namespace: 'workspace',
  cors: {
    origin:
      process.env.NODE_ENV !== 'production'
        ? ['http://localhost:4200', 'http://127.0.0.1:4200']
        : false,
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class WorkspaceGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Namespace;

  private readonly logger = new Logger(WorkspaceGateway.name);

  constructor(
    @Inject(forwardRef(() => SessionActivityManager))
    private readonly activityManager: SessionActivityManager,
    /**
     * SessionService provides authoritative session status. Injected with forwardRef to
     * safely resolve the circular dependency between the gateway and the service.
     */
    @Inject(forwardRef(() => SessionService))
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Gateway initialization - called after server is created and injected
   */
  afterInit(server: Namespace): void {
    this.logger.log('Workspace WebSocket Gateway initialized');
    this.logger.log(`Gateway listening on namespace: /workspace`);
    this.logger.log(`Namespace instance available: ${!!server}`);
    this.logger.log(`Namespace adapter available: ${!!server?.adapter}`);

    // Add server-level debugging with proper null checks
    try {
      server.on('connection', (socket) => {
        this.logger.debug(
          `🔌 Socket.IO connection event fired for socket: ${socket.id}`,
        );
      });
    } catch (error) {
      this.logger.warn('Could not set up additional server debugging:', error);
    }
  }

  /**
   * Handle new WebSocket connection
   *
   * Note: Authentication validation is handled by WsJwtGuard.
   * User information is available in message handlers via @CurrentUserId() decorator.
   */
  async handleConnection(client: Socket): Promise<void> {
    const connectionStart = Date.now();
    const timestamp = new Date().toISOString();

    this.logger.log(
      `🔌 [WORKSPACE-GATEWAY] New WebSocket connection at ${timestamp}`,
    );
    this.logger.log(`👤 [WORKSPACE-GATEWAY] Client ID: ${client.id}`);
    this.logger.log(
      `🌐 [WORKSPACE-GATEWAY] Client IP: ${client.handshake.address}`,
    );
    this.logger.log(
      `🔗 [WORKSPACE-GATEWAY] Transport: ${client.conn.transport.name}`,
    );
    this.logger.log(
      `📊 [WORKSPACE-GATEWAY] Connection headers:`,
      JSON.stringify(client.handshake.headers, null, 2),
    );

    try {
      // Connection tracking is deferred until first authenticated message
      // to ensure we have validated user context via the guard
      this.logger.log(
        `⏳ [WORKSPACE-GATEWAY] WebSocket connected: ${client.id} (pending authentication)`,
      );

      // Send connection confirmation
      const connectionMessage = {
        type: 'connected',
        timestamp,
        clientId: client.id,
        serverTime: timestamp,
      };

      this.logger.log(
        `📤 [WORKSPACE-GATEWAY] Sending connection confirmation to ${client.id}:`,
        connectionMessage,
      );
      client.emit('connection-status', connectionMessage);

      const connectionTime = Date.now() - connectionStart;
      this.logger.log(
        `✅ [WORKSPACE-GATEWAY] Connection setup completed for ${client.id} in ${connectionTime}ms`,
      );
    } catch (error) {
      this.logger.error(
        `❌ [WORKSPACE-GATEWAY] Failed to handle connection for ${client.id}`,
        error,
      );
      this.logger.error(
        `🚪 [WORKSPACE-GATEWAY] Disconnecting client ${client.id} due to error`,
      );
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  async handleDisconnect(client: Socket): Promise<void> {
    try {
      // Find connection by websocket ID
      const activeSessionIds = this.activityManager.getActiveSessionIds();

      for (const sessionId of activeSessionIds) {
        const connections =
          this.activityManager.getSessionConnectionInfo(sessionId);
        const connection = connections.find(
          (conn) => conn.websocketId === client.id,
        );

        if (connection) {
          this.logger.log(
            `WebSocket disconnected: ${client.id} for user ${connection.userId}, session ${connection.sessionId}`,
          );

          // Leave session room
          client.leave(`session:${connection.sessionId}`);

          // Unregister connection from activity manager
          await this.activityManager.unregisterConnection(
            connection.sessionId,
            client.id,
          );
          break;
        }
      }
    } catch (error) {
      this.logger.error(`Failed to handle disconnect for ${client.id}:`, error);
    }
  }

  /**
   * Subscribe to workspace session events
   */
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() command: HMRCommand,
    @CurrentUserId() userId: string,
  ): Promise<HMRResponse> {
    const subscribeStart = Date.now();
    const timestamp = new Date().toISOString();

    this.logger.log(
      `📡 [WORKSPACE-GATEWAY] Subscribe request received at ${timestamp}`,
    );
    this.logger.log(
      `👤 [WORKSPACE-GATEWAY] Client: ${client.id}, User: ${userId}`,
    );
    this.logger.log(
      `📋 [WORKSPACE-GATEWAY] Command:`,
      JSON.stringify(command, null, 2),
    );

    try {
      const { sessionId } = command.parameters as { sessionId: string };

      this.logger.log(`🎯 [WORKSPACE-GATEWAY] Target session: ${sessionId}`);

      if (!sessionId) {
        this.logger.warn(
          `❌ [WORKSPACE-GATEWAY] Subscribe failed: Session ID is required`,
        );
        return {
          commandId: this.generateId(),
          success: false,
          error: 'Session ID is required',
        };
      }

      // Check if client is already connected to a different session
      const activeSessionIds = this.activityManager.getActiveSessionIds();
      for (const existingSessionId of activeSessionIds) {
        const connections =
          this.activityManager.getSessionConnectionInfo(existingSessionId);
        const existingConnection = connections.find(
          (conn) => conn.websocketId === client.id,
        );

        if (existingConnection && existingConnection.sessionId !== sessionId) {
          // Unsubscribe from old session first
          await this.activityManager.unregisterConnection(
            existingConnection.sessionId,
            client.id,
          );
          client.leave(`session:${existingConnection.sessionId}`);
          this.logger.log(
            `Client ${client.id} unsubscribed from old session ${existingConnection.sessionId}`,
          );
        }
      }

      // Register connection with activity manager
      this.logger.log(
        `🔗 [WORKSPACE-GATEWAY] Registering connection with activity manager...`,
      );
      await this.activityManager.registerConnection(
        sessionId,
        userId,
        client.id,
      );
      this.logger.log(
        `✅ [WORKSPACE-GATEWAY] Connection registered successfully`,
      );

      // Join session room
      const roomName = `session:${sessionId}`;
      this.logger.log(`🏠 [WORKSPACE-GATEWAY] Joining room: ${roomName}`);
      await client.join(roomName);

      // Server state verification for debugging
      this.logger.log(
        `🔍 [WORKSPACE-GATEWAY] Namespace adapter ready: ${!!this.server?.adapter}`,
      );

      // Verify room membership - with safety check
      if (!this.server?.adapter) {
        this.logger.error(
          `❌ [WORKSPACE-GATEWAY] Server adapter not available - WebSocket server may not be properly initialized`,
        );
        return {
          commandId: this.generateId(),
          success: false,
          error: 'WebSocket server not properly initialized',
        };
      }

      const room = this.server.adapter.rooms.get(roomName);
      const roomSize = room ? room.size : 0;
      this.logger.log(
        `👥 [WORKSPACE-GATEWAY] Room ${roomName} now has ${roomSize} clients`,
      );

      /**
       * Immediately emit a workspace status snapshot to the session room so newly
       * subscribed clients can render the preview without waiting for a polling
       * cycle or a later status event. This method will:
       * - Compute the current WorkspaceStatusResponse for the session
       * - Broadcast a 'workspace-status' HMREvent to the session room
       *
       * Note: The broadcast is performed by SessionService via WorkspaceGateway.broadcastWorkspaceStatus().
       */
      try {
        const status: WorkspaceStatusResponse =
          await this.sessionService.getSessionStatus(sessionId, userId);
        this.logger.log(
          `📡 [WORKSPACE-GATEWAY] Emitted status snapshot for session ${sessionId}: isReady=${status.isReady}, previewUrl=${status.previewUrl || 'n/a'}`,
        );
      } catch (statusError) {
        this.logger.warn(
          `⚠️ [WORKSPACE-GATEWAY] Failed to emit immediate status snapshot for session ${sessionId}: ${statusError instanceof Error ? statusError.message : String(statusError)}`,
        );
      }

      const subscribeTime = Date.now() - subscribeStart;
      this.logger.log(
        `✅ [WORKSPACE-GATEWAY] Client ${client.id} successfully subscribed to session ${sessionId} in ${subscribeTime}ms`,
      );

      const response = {
        commandId: this.generateId(),
        success: true,
        data: { sessionId, subscribed: true },
      };

      this.logger.log(
        `📤 [WORKSPACE-GATEWAY] Sending success response:`,
        response,
      );
      return response;
    } catch (error) {
      const errorTime = Date.now() - subscribeStart;
      this.logger.error(
        `❌ [WORKSPACE-GATEWAY] Failed to handle subscribe for ${client.id} after ${errorTime}ms`,
        error,
      );
      this.logger.error(`🚨 [WORKSPACE-GATEWAY] Error details:`, {
        clientId: client.id,
        userId,
        sessionId: command.parameters?.sessionId,
        error: error instanceof Error ? error.message : String(error),
      });

      const errorResponse = {
        commandId: this.generateId(),
        success: false,
        error: 'Subscription failed',
      };

      this.logger.log(
        `📤 [WORKSPACE-GATEWAY] Sending error response:`,
        errorResponse,
      );
      return errorResponse;
    }
  }

  /**
   * Unsubscribe from workspace session events
   */
  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() command: HMRCommand,
    @CurrentUserId() userId: string,
  ): Promise<HMRResponse> {
    try {
      // Find the session this client is connected to
      const activeSessionIds = this.activityManager.getActiveSessionIds();
      let foundSessionId: string | null = null;

      for (const sessionId of activeSessionIds) {
        const connections =
          this.activityManager.getSessionConnectionInfo(sessionId);
        const connection = connections.find(
          (conn) => conn.websocketId === client.id,
        );

        if (connection) {
          foundSessionId = sessionId;
          break;
        }
      }

      if (!foundSessionId) {
        return {
          commandId: this.generateId(),
          success: false,
          error: 'Connection not found',
        };
      }

      await client.leave(`session:${foundSessionId}`);
      await this.activityManager.unregisterConnection(
        foundSessionId,
        client.id,
      );

      this.logger.log(
        `Client ${client.id} unsubscribed from session ${foundSessionId}`,
      );

      return {
        commandId: this.generateId(),
        success: true,
        data: { unsubscribed: true },
      };
    } catch (error) {
      this.logger.error(`Failed to handle unsubscribe for ${client.id}`, error);
      return {
        commandId: this.generateId(),
        success: false,
        error: 'Unsubscribe failed',
      };
    }
  }

  /**
   * Handle ping for connection keepalive
   */
  @SubscribeMessage('ping')
  async handlePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() command: HMRCommand,
    @CurrentUserId() userId: string,
  ): Promise<HMRResponse> {
    try {
      // Find the session this client is connected to
      const activeSessionIds = this.activityManager.getActiveSessionIds();

      for (const sessionId of activeSessionIds) {
        const connections =
          this.activityManager.getSessionConnectionInfo(sessionId);
        const connection = connections.find(
          (conn) => conn.websocketId === client.id,
        );

        if (connection) {
          // Record ping activity
          await this.activityManager.recordPing(sessionId, client.id);
          break;
        }
      }

      return {
        commandId: this.generateId(),
        success: true,
        data: { pong: true, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      this.logger.error(`Failed to handle ping for ${client.id}:`, error);
      return {
        commandId: this.generateId(),
        success: false,
        error: 'Ping failed',
      };
    }
  }

  /**
   * Handle activity events from client
   */
  @SubscribeMessage('activity')
  async handleActivity(
    @ConnectedSocket() client: Socket,
    @MessageBody() activityMessage: ActivityMessage,
    @CurrentUserId() userId: string,
  ): Promise<HMRResponse> {
    try {
      // Find the session this client is connected to
      const activeSessionIds = this.activityManager.getActiveSessionIds();
      let foundSessionId: string | null = null;

      for (const sessionId of activeSessionIds) {
        const connections =
          this.activityManager.getSessionConnectionInfo(sessionId);
        const connection = connections.find(
          (conn) => conn.websocketId === client.id,
        );

        if (connection) {
          foundSessionId = sessionId;
          break;
        }
      }

      if (!foundSessionId) {
        return {
          commandId: this.generateId(),
          success: false,
          error: 'Connection not found',
        };
      }

      // Record activity
      const activityEvent: ActivityEvent = {
        type: activityMessage.type,
        sessionId: foundSessionId,
        timestamp: activityMessage.timestamp,
        metadata: activityMessage.data,
      };

      await this.activityManager.recordActivity(foundSessionId, activityEvent);

      return {
        commandId: this.generateId(),
        success: true,
        data: { recorded: true },
      };
    } catch (error) {
      this.logger.error(`Failed to handle activity for ${client.id}:`, error);
      return {
        commandId: this.generateId(),
        success: false,
        error: 'Activity recording failed',
      };
    }
  }

  /**
   * Broadcast HMR event to all clients subscribed to a session
   */
  async broadcastToSession(sessionId: string, event: HMREvent): Promise<void> {
    const broadcastStart = Date.now();
    const roomName = `session:${sessionId}`;

    this.logger.log(`📢 [WORKSPACE-GATEWAY] Broadcasting to room: ${roomName}`);
    this.logger.log(`🎯 [WORKSPACE-GATEWAY] Event type: ${event.type}`);

    try {
      // Safety check for server availability
      if (!this.server?.adapter) {
        this.logger.error(
          `❌ [WORKSPACE-GATEWAY] Server adapter not available - cannot broadcast to session ${sessionId}`,
        );
        return;
      }

      const message: HMRWebSocketMessage = {
        id: this.generateId(),
        type: 'event',
        sessionId,
        timestamp: new Date().toISOString(),
        payload: event,
      };

      this.logger.log(`📨 [WORKSPACE-GATEWAY] Message ID: ${message.id}`);
      this.logger.log(
        `📦 [WORKSPACE-GATEWAY] Message payload:`,
        JSON.stringify(message.payload, null, 2),
      );

      // Get room information before broadcasting
      const room = this.server.adapter.rooms.get(roomName);
      const clientCount = room ? room.size : 0;
      this.logger.log(
        `👥 [WORKSPACE-GATEWAY] Clients in room ${roomName}: ${clientCount}`,
      );

      this.server.to(roomName).emit('hmr-event', message);

      const broadcastTime = Date.now() - broadcastStart;
      this.logger.log(
        `✅ [WORKSPACE-GATEWAY] Broadcasted ${event.type} event to session ${sessionId} in ${broadcastTime}ms`,
      );
    } catch (error) {
      this.logger.error(
        `❌ [WORKSPACE-GATEWAY] Failed to broadcast event to session ${sessionId}`,
        error,
      );
      this.logger.error(`🚨 [WORKSPACE-GATEWAY] Error details:`, {
        sessionId,
        eventType: event.type,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Broadcast container status update to session
   */
  async broadcastContainerStatus(
    sessionId: string,
    status: string,
    message?: string,
    error?: string,
  ): Promise<void> {
    const broadcastStart = Date.now();
    const timestamp = new Date().toISOString();

    this.logger.log(
      `📡 [WORKSPACE-GATEWAY] Broadcasting container status: ${status} for session ${sessionId}`,
    );
    this.logger.log(
      `📝 [WORKSPACE-GATEWAY] Status message: ${message || 'none'}`,
    );
    this.logger.log(`🚨 [WORKSPACE-GATEWAY] Error details: ${error || 'none'}`);

    const event: HMREvent = {
      type: status === 'error' ? 'container-error' : 'connection-status',
      sessionId,
      timestamp,
      data: {
        containerStatus: status,
        message,
        error: error ? { code: 'CONTAINER_ERROR', message: error } : undefined,
      },
    };

    this.logger.log(`🎯 [WORKSPACE-GATEWAY] Event type: ${event.type}`);
    this.logger.log(
      `📦 [WORKSPACE-GATEWAY] Event data:`,
      JSON.stringify(event.data, null, 2),
    );

    this.logger.log(
      `📡 [WORKSPACE-GATEWAY] Broadcasting event type: ${event.type} to session ${sessionId}`,
    );
    await this.broadcastToSession(sessionId, event);

    const broadcastTime = Date.now() - broadcastStart;
    this.logger.log(
      `✅ [WORKSPACE-GATEWAY] Container status broadcast completed for session ${sessionId} in ${broadcastTime}ms`,
    );
  }

  /**
   * Broadcast workspace status update to session
   */
  async broadcastWorkspaceStatus(
    sessionId: string,
    status: WorkspaceStatusResponse,
  ): Promise<void> {
    const broadcastStart = Date.now();
    const timestamp = new Date().toISOString();

    this.logger.log(
      `🏢 [WORKSPACE-GATEWAY] Broadcasting workspace status update for session ${sessionId}`,
    );
    this.logger.log(`📊 [WORKSPACE-GATEWAY] Status details:`, {
      sessionId: status.sessionId,
      status: status.status,
      isReady: status.isReady,
      previewUrl: status.previewUrl,
      hasError: !!status.error,
      metrics: status.metrics
        ? {
            cpuUsage: status.metrics.cpuUsage,
            memoryUsage: status.metrics.memoryUsage,
            uptime: status.metrics.uptime,
          }
        : null,
    });

    const event: HMREvent = {
      type: 'workspace-status',
      sessionId,
      timestamp,
      data: {
        workspaceStatus: status,
      },
    };

    this.logger.log(`🎯 [WORKSPACE-GATEWAY] Event type: ${event.type}`);
    this.logger.log(
      `📦 [WORKSPACE-GATEWAY] Full event data:`,
      JSON.stringify(event.data, null, 2),
    );

    await this.broadcastToSession(sessionId, event);

    const broadcastTime = Date.now() - broadcastStart;
    this.logger.log(
      `✅ [WORKSPACE-GATEWAY] Workspace status broadcast completed for session ${sessionId} in ${broadcastTime}ms`,
    );
  }

  /**
   * Broadcast build status update to session
   */
  async broadcastBuildStatus(
    sessionId: string,
    buildId: string,
    status: 'start' | 'complete' | 'error',
    duration?: number,
    error?: string,
  ): Promise<void> {
    const eventType =
      status === 'start'
        ? 'build-start'
        : status === 'complete'
          ? 'build-complete'
          : 'build-error';

    const event: HMREvent = {
      type: eventType,
      sessionId,
      timestamp: new Date().toISOString(),
      data: {
        buildId,
        duration,
        error: error ? { code: 'BUILD_ERROR', message: error } : undefined,
      },
    };

    await this.broadcastToSession(sessionId, event);
  }

  /**
   * Broadcast file change event to session
   */
  async broadcastFileChange(
    sessionId: string,
    files: string[],
    reloadType: 'hot' | 'full' = 'hot',
  ): Promise<void> {
    const event: HMREvent = {
      type: reloadType === 'hot' ? 'hot-reload' : 'full-reload',
      sessionId,
      timestamp: new Date().toISOString(),
      data: {
        files,
        reload: {
          type: reloadType,
          reason: 'File changes detected',
          affectedModules: files,
          preserveState: reloadType === 'hot',
        },
      },
    };

    await this.broadcastToSession(sessionId, event);
  }

  /**
   * Get active connections count for monitoring
   */
  getActiveConnectionsCount(): number {
    return this.activityManager
      .getActiveSessionIds()
      .reduce(
        (total, sessionId) =>
          total + this.activityManager.getSessionConnectionCount(sessionId),
        0,
      );
  }

  /**
   * Get connections for a specific session
   */
  getSessionConnections(sessionId: string): ConnectionState[] {
    return this.activityManager.getSessionConnectionInfo(sessionId);
  }

  /**
   * Generate unique ID for messages and commands
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
