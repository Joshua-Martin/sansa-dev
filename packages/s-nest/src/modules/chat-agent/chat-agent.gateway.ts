import {
  ChatMessageEvent,
  ClientToServerEvents,
  ErrorEvent,
  JoinThreadEvent,
  LeaveThreadEvent,
  MessageCreatedEvent,
  MessageStreamEvent,
  ServerToClientEvents,
  ThreadJoinedEvent,
  ThreadLeftEvent,
  UIStateUpdateEvent,
  WebSocketAuthData,
  WebSocketErrorEvent,
  WebSocketErrorFactory,
  errorToWebSocketError,
} from '@sansa-dev/s-shared';
import { Logger } from '@nestjs/common';
import { JwtService } from '../../shared/auth/jwt.service';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatAgentService } from './chat-agent.service';
import { UserService } from 'src/shared/database/services/user.service';

/**
 * WebSocket Gateway for Chat Agent
 *
 * Handles real-time communication between clients and the LLM system.
 * Provides secure WebSocket connections with JWT authentication.
 */
@WebSocketGateway({
  namespace: 'chat-agent',
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ChatAgentGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  /**
   * Track active navigation continuations to prevent duplicates
   */
  private activeNavigationContinuations = new Set<string>();
  @WebSocketServer()
  server: Server<ClientToServerEvents, ServerToClientEvents>;

  private readonly logger = new Logger(ChatAgentGateway.name);
  private readonly connectedClients = new Map<string, WebSocketAuthData>();

  constructor(
    private readonly chatService: ChatAgentService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  /**
   * Gateway initialization
   */
  afterInit(server: Server): void {
    this.logger.log('Chat Agent WebSocket Gateway initialized');
    this.logger.log(`Gateway listening on namespace: /chat-agent`);

    // Add server-level debugging with proper null checks
    try {
      if (server.engine) {
        server.engine.on('connection_error', (err) => {
          this.logger.error('🔥 Socket.IO Engine Connection Error:', err);
        });
      }

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
   * Handle client connection
   */
  async handleConnection(client: Socket): Promise<void> {
    const startTime = Date.now();
    this.logger.log(
      `🟡 INCOMING CONNECTION: ${client.id} from ${client.handshake.address}`,
    );

    try {
      // Extract and verify JWT token from handshake
      this.logger.debug(`🔑 Extracting authentication token...`);
      const token = this.extractTokenFromHandshake(client);
      if (!token) {
        this.logger.warn(
          `❌ Connection rejected: No token provided - ${client.id}`,
        );
        this.logger.debug(
          `Available auth methods: headers=${!!client.handshake.headers.authorization}, query=${!!client.handshake.query.token}`,
        );
        this.emitStandardizedError(
          client,
          WebSocketErrorFactory.unauthorized(),
        );
        client.disconnect(true);
        return;
      }

      this.logger.debug(
        `✅ Token found for client ${client.id}: ${token.substring(0, 20)}...`,
      );

      // Verify JWT token
      this.logger.debug(`🔐 Verifying JWT token...`);
      const decoded = this.verifyToken(token);
      if (!decoded) {
        this.logger.warn(
          `❌ Connection rejected: Invalid token - ${client.id}`,
        );
        this.emitStandardizedError(
          client,
          WebSocketErrorFactory.tokenExpired(),
        );
        client.disconnect(true);
        return;
      }

      this.logger.debug(
        `✅ Token verified successfully for user: ${decoded.sub || decoded.userId}`,
      );

      // Store client authentication data
      const authData: WebSocketAuthData = {
        token,
        userId: decoded.sub || decoded.userId,
      };
      this.connectedClients.set(client.id, authData);

      const connectionTime = Date.now() - startTime;
      this.logger.log(
        `✅ Client connected successfully: ${client.id} (User: ${authData.userId}) in ${connectionTime}ms`,
      );

      // Join user to their personal room
      await client.join(`user:${authData.userId}`);
      this.logger.debug(
        `Client ${client.id} joined room: user:${authData.userId}`,
      );

      this.logger.log(
        `🟢 CONNECTION COMPLETE: ${client.id} - Total clients: ${this.connectedClients.size}`,
      );
    } catch (error) {
      const connectionTime = Date.now() - startTime;
      this.logger.error(
        `❌ Error handling connection for ${client.id} after ${connectionTime}ms:`,
        error,
      );
      this.emitStandardizedError(client, errorToWebSocketError(error));
      client.disconnect(true);
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket): void {
    const authData = this.connectedClients.get(client.id);
    if (authData) {
      this.logger.log(
        `Client disconnected: ${client.id} (User: ${authData.userId})`,
      );
      this.connectedClients.delete(client.id);
    } else {
      this.logger.debug(`Client disconnected: ${client.id}`);
    }
  }

  /**
   * Handle chat message events
   */
  @SubscribeMessage('chat_message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChatMessageEvent,
  ): Promise<void> {
    try {
      const authData = this.getAuthData(client);
      if (!authData) {
        this.emitStandardizedError(
          client,
          WebSocketErrorFactory.unauthorized(data.eventId),
        );
        return;
      }

      // Validate thread handling according to isInitial flag
      if (!data.threadId) {
        this.emitStandardizedError(
          client,
          WebSocketErrorFactory.validationError(
            'Thread ID is required for messages',
            data.eventId,
          ),
        );
        return;
      }

      // Process the chat message, now passing uiState
      const { thread, userMessage } = await this.chatService.processChatMessage(
        {
          userId: authData.userId,
          event: data,
        },
      );

      // Emit message created event for user message
      const userMessageCreatedEvent: MessageCreatedEvent = {
        timestamp: new Date(),
        eventId: data.eventId,
        message: userMessage,
        thread,
      };
      client.emit('message_created', userMessageCreatedEvent);

      // Start streaming LLM response, pass uiState
      await this.streamLLMResponse({
        client,
        userId: authData.userId,
        threadId: thread.id,
        uiState: data.uiState,
        eventId: data.eventId,
      });
    } catch (error) {
      this.logger.error(
        `Error handling chat message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      this.emitStandardizedError(
        client,
        errorToWebSocketError(error, data.eventId),
      );
    }
  }

  /**
   * Handle join thread events
   */
  @SubscribeMessage('join_thread')
  async handleJoinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinThreadEvent,
  ): Promise<void> {
    try {
      const authData = this.getAuthData(client);
      if (!authData) {
        this.emitStandardizedError(
          client,
          WebSocketErrorFactory.unauthorized(data.eventId),
        );
        return;
      }

      // Get thread with messages
      const thread = await this.chatService.getThreadWithMessages({
        threadId: data.threadId,
        userId: authData.userId,
        messageLimit: 20,
      });

      if (!thread) {
        this.emitStandardizedError(
          client,
          WebSocketErrorFactory.threadNotFound(data.threadId, data.eventId),
        );
        return;
      }

      // Join thread room
      await client.join(`thread:${data.threadId}`);

      // Emit thread joined event
      const threadJoinedEvent: ThreadJoinedEvent = {
        timestamp: new Date(),
        eventId: data.eventId,
        thread: thread as any,
        recentMessages: thread.messages as any,
      };
      client.emit('thread_joined', threadJoinedEvent);

      this.logger.debug(
        `User ${authData.userId} joined thread ${data.threadId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error joining thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      this.emitStandardizedError(
        client,
        errorToWebSocketError(error, data.eventId),
      );
    }
  }

  /**
   * Handle leave thread events
   */
  @SubscribeMessage('leave_thread')
  async handleLeaveThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LeaveThreadEvent,
  ): Promise<void> {
    try {
      const authData = this.getAuthData(client);
      if (!authData) {
        this.emitStandardizedError(
          client,
          WebSocketErrorFactory.unauthorized(data.eventId),
        );
        return;
      }

      // Leave thread room
      await client.leave(`thread:${data.threadId}`);

      // Emit thread left event
      const threadLeftEvent: ThreadLeftEvent = {
        timestamp: new Date(),
        eventId: data.eventId,
        threadId: data.threadId,
      };
      client.emit('thread_left', threadLeftEvent);

      this.logger.debug(`User ${authData.userId} left thread ${data.threadId}`);
    } catch (error) {
      this.logger.error(
        `Error leaving thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      this.emitStandardizedError(
        client,
        errorToWebSocketError(error, data.eventId),
      );
    }
  }

  /**
   * Stream LLM response to client
   *
   * @private
   * Fetches the user's name from the database and injects it into the system prompt.
   */
  private async streamLLMResponse({
    client,
    userId,
    threadId,
    uiState,
    eventId,
  }: {
    client: Socket;
    userId: string;
    threadId: string;
    uiState: string;
    eventId?: string;
  }): Promise<void> {
    // Accumulates the assistant's text content across stream chunks
    let accumulatedContent = '';

    // Holds the real database ID of the pending assistant message created at stream start
    let pendingAssistantMessageId: string | null = null;

    // Track usage information from the stream
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;

    try {
      // Fetch user name from database to personalize system prompt
      const user = await this.userService.findById(userId);
      const userName = user?.fullName || 'User';

      // 1) Create a pending assistant message to obtain a stable, unique messageId
      //    We intentionally create this before pulling any tokens so that the client
      //    can initialize per-message stream parsing and tracking keyed by this id.
      const pendingAssistantMessage =
        await this.chatService.createPendingAssistantMessage({
          threadId,
        });
      pendingAssistantMessageId = pendingAssistantMessage.id;

      // Emit a message_created event for the pending assistant message.
      // The message content is empty and status is 'pending'. The client
      // should not render empty content, but it can use this event to
      // initialize stream parser state for this messageId.
      const threadAtStart = await this.chatService.getThread(threadId, userId);
      const assistantCreatedEvent: MessageCreatedEvent = {
        timestamp: new Date(),
        eventId,
        message: pendingAssistantMessage,
        thread: threadAtStart,
      };
      client.emit('message_created', assistantCreatedEvent);

      // 2) Start the model stream
      const stream = this.chatService.generateStreamingResponse({
        userId,
        threadId,
        uiState,
        userName,
      });

      // 3) Forward chunks to the client, keyed by the real pending message id
      for await (const chunk of stream) {
        if (chunk.text) {
          accumulatedContent += chunk.text;
        }

        // Capture usage information if provided
        if (chunk.usage) {
          inputTokens = chunk.usage.inputTokens;
          outputTokens = chunk.usage.outputTokens;
        }

        const streamEvent: MessageStreamEvent = {
          timestamp: new Date(),
          eventId,
          messageId: pendingAssistantMessageId,
          threadId,
          content: chunk.text || '',
          isFinal: chunk.is_final || false,
          metadata: {
            finishReason: chunk.finish_reason,
            responseId: chunk.id,
          },
        };
        client.emit('message_stream', streamEvent);

        // 4) On final chunk, finalize the pending message and emit message_completed
        if (chunk.is_final) {
          const assistantMessage =
            await this.chatService.completeAssistantMessage({
              messageId: pendingAssistantMessageId,
              content: accumulatedContent,
              inputTokens,
              outputTokens,
            });

          // 🔍 LOG COMPLETE LLM RESPONSE: Clear logging of final response with token counts
          this.logger.log(
            `🤖 [LLM_RESPONSE][BASE_RESPONSE] Final Content: ${accumulatedContent}, Input Tokens: ${inputTokens || 'N/A'}, Output Tokens: ${outputTokens || 'N/A'}, User: ${userId}, Thread: ${threadId}, Event ID: ${eventId || 'NONE'}`,
          );
          const updatedThread = await this.chatService.getThread(
            threadId,
            userId,
          );
          client.emit('message_completed', {
            message: assistantMessage,
            thread: updatedThread,
            timestamp: new Date(),
            eventId,
          });
          break;
        }
      }
    } catch (error) {
      this.logger.error(
        `Error streaming LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );

      // Best-effort failure marking for the pending assistant message
      if (pendingAssistantMessageId) {
        await this.chatService.markAssistantMessageFailed(
          pendingAssistantMessageId,
        );
      }

      this.emitStandardizedError(
        client,
        WebSocketErrorFactory.streamError(
          error instanceof Error ? error.message : 'Unknown error',
          eventId,
        ),
      );
    }
  }

  /**
   * Extract JWT token from handshake
   *
   * @private
   */
  private extractTokenFromHandshake(client: Socket): string | null {
    // Try to get token from auth header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      this.logger.debug(`Token found in Authorization header`);
      return authHeader.substring(7);
    }

    // Try to get token from query parameters
    const token = client.handshake.query.token as string;
    if (token) {
      this.logger.debug(`Token found in query parameters`);
      return token;
    }

    // Try to get token from auth object (fallback for socket.io auth property)
    const authData = client.handshake.auth as any;
    if (authData && authData.token) {
      this.logger.debug(`Token found in auth object`);
      return authData.token;
    }

    this.logger.debug(`No token found in any location`);
    this.logger.debug(`Auth header: ${authHeader ? 'present' : 'missing'}`);
    this.logger.debug(`Query token: ${token ? 'present' : 'missing'}`);
    this.logger.debug(
      `Auth object: ${authData ? JSON.stringify(authData) : 'missing'}`,
    );

    return null;
  }

  /**
   * Verify JWT token
   *
   * @private
   */
  private verifyToken(token: string): any {
    try {
      return this.jwtService.verifyToken(token);
    } catch (error) {
      this.logger.warn(
        `Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Get authentication data for a client
   *
   * @private
   */
  private getAuthData(client: Socket): WebSocketAuthData | null {
    return this.connectedClients.get(client.id) || null;
  }

  /**
   * Emit standardized error event to client
   *
   * @private
   */
  private emitStandardizedError(
    client: Socket,
    errorEvent: WebSocketErrorEvent,
  ): void {
    // Emit the new standardized error format
    client.emit('error', errorEvent);

    // Also emit legacy format for backwards compatibility
    const legacyErrorEvent: ErrorEvent = {
      timestamp: errorEvent.timestamp,
      code: errorEvent.code,
      message: errorEvent.userMessage, // Use user-friendly message for legacy
      relatedEventId: errorEvent.relatedEventId,
    };
    client.emit('error', legacyErrorEvent);
  }
}
