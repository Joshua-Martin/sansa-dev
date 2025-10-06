'use client';

import { io, Socket } from 'socket.io-client';
import type {
  ChatMessageEvent,
  JoinThreadEvent,
  LeaveThreadEvent,
  MessageCreatedEvent,
  MessageStreamEvent,
  MessageCompletedEvent,
  ErrorEvent,
  ThreadJoinedEvent,
  ThreadLeftEvent,
  UIStateUpdateEvent,
  WebSocketErrorEvent,
} from '@sansa-dev/s-shared';
import { tokenManager } from '../api';

/**
 * WebSocket connection states
 */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

/**
 * Socket.IO client-to-server events interface
 */
interface ClientToServerEvents {
  chat_message: (data: ChatMessageEvent) => void;
  join_thread: (data: JoinThreadEvent) => void;
  leave_thread: (data: LeaveThreadEvent) => void;
  ui_state_update: (data: UIStateUpdateEvent) => void;
}

/**
 * Socket.IO server-to-client events interface
 */
interface ServerToClientEvents {
  message_created: (data: MessageCreatedEvent) => void;
  message_stream: (data: MessageStreamEvent) => void;
  message_completed: (data: MessageCompletedEvent) => void;
  error: (data: WebSocketErrorEvent | ErrorEvent) => void;
  thread_joined: (data: ThreadJoinedEvent) => void;
  thread_left: (data: ThreadLeftEvent) => void;
}

/**
 * Event listeners for chat agent WebSocket events
 */
export interface ChatAgentEventListeners {
  onConnectionStateChange: (state: ConnectionState) => void;
  onMessageCreated: (event: MessageCreatedEvent) => void;
  onMessageStream: (event: MessageStreamEvent) => void;
  onMessageCompleted: (event: MessageCompletedEvent) => void;
  onThreadJoined: (event: ThreadJoinedEvent) => void;
  onThreadLeft: (event: ThreadLeftEvent) => void;
  onError: (event: WebSocketErrorEvent | ErrorEvent) => void;
}

/**
 * Configuration for WebSocket connection
 */
export interface WebSocketConfig {
  /**
   * Base URL for the WebSocket server
   */
  baseUrl?: string;

  /**
   * Namespace for the chat agent
   */
  namespace?: string;

  /**
   * Auto-reconnect settings
   */
  autoReconnect?: boolean;

  /**
   * Maximum reconnection attempts
   */
  maxReconnectAttempts?: number;

  /**
   * Reconnection delay in milliseconds
   */
  reconnectDelay?: number;
}

/**
 * Default WebSocket configuration
 */
const DEFAULT_CONFIG: Required<WebSocketConfig> = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  namespace: 'chat-agent',
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
};

/**
 * Chat Agent WebSocket Service
 *
 * Manages real-time communication with the chat agent backend.
 * Handles connection management, event listeners, and message sending.
 */
export class ChatAgentWebSocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private config: Required<WebSocketConfig>;
  private connectionState: ConnectionState = 'disconnected';
  private listeners: Partial<ChatAgentEventListeners> = {};
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Connect to the WebSocket server
   *
   * @param token - Optional JWT token for authentication (will use stored token if not provided)
   */
  public connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      // Get authentication token
      const authToken = token || tokenManager.getAccessToken();
      if (!authToken) {
        const error = new Error('No authentication token available');
        this.setConnectionState('error');
        reject(error);
        return;
      }

      // Create socket connection
      const socketUrl = `${this.config.baseUrl}/${this.config.namespace}`;
      console.log('[CHAT-AGENT-SOCKET] Auth Token:', authToken);
      console.log('[CHAT-AGENT-SOCKET] Namespace:', this.config.namespace);
      console.log('[CHAT-AGENT-SOCKET] Base URL:', this.config.baseUrl);
      console.log(
        '[CHAT-AGENT-SOCKET] Auto Reconnect:',
        this.config.autoReconnect
      );
      console.log(
        '[CHAT-AGENT-SOCKET] Max Reconnect Attempts:',
        this.config.maxReconnectAttempts
      );
      console.log(
        '[CHAT-AGENT-SOCKET] Reconnect Delay:',
        this.config.reconnectDelay
      );

      console.log('[CHAT-AGENT-SOCKET] Socket URL:', socketUrl);

      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        auth: {
          token: authToken,
        },
        query: {
          token: authToken,
        },
        timeout: 20000,
        forceNew: true,
      });

      this.setConnectionState('connecting');

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log(
          '[CHAT-AGENT-SOCKET] Chat Agent WebSocket connected:',
          this.socket?.id
        );
        this.setConnectionState('connected');
        this.reconnectAttempts = 0;
        this.clearReconnectTimer();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error(
          '[CHAT-AGENT-SOCKET] Chat Agent WebSocket connection error:',
          error
        );
        this.setConnectionState('error');

        if (
          this.config.autoReconnect &&
          this.reconnectAttempts < this.config.maxReconnectAttempts
        ) {
          this.scheduleReconnect();
        }

        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log(
          '[CHAT-AGENT-SOCKET] Chat Agent WebSocket disconnected:',
          reason
        );
        this.setConnectionState('disconnected');

        if (this.config.autoReconnect && reason !== 'io client disconnect') {
          this.scheduleReconnect();
        }
      });

      // Chat event handlers
      this.socket.on('message_created', (event: MessageCreatedEvent) => {
        console.log('[CHAT-AGENT-SOCKET] Message created:', event);
        this.listeners.onMessageCreated?.(event);
      });

      this.socket.on('message_stream', (event: MessageStreamEvent) => {
        console.log('[CHAT-AGENT-SOCKET] Message stream:', event);
        console.log(
          '[CHAT-AGENT-SOCKET] Calling onMessageStream listener:',
          !!this.listeners.onMessageStream
        );
        this.listeners.onMessageStream?.(event);
      });

      this.socket.on('message_completed', (event: MessageCompletedEvent) => {
        console.log('[CHAT-AGENT-SOCKET] Message completed:', event);
        this.listeners.onMessageCompleted?.(event);
      });

      this.socket.on('thread_joined', (event: ThreadJoinedEvent) => {
        console.log('[CHAT-AGENT-SOCKET] Thread joined:', event);
        this.listeners.onThreadJoined?.(event);
      });

      this.socket.on('thread_left', (event: ThreadLeftEvent) => {
        console.log('[CHAT-AGENT-SOCKET] Thread left:', event);
        this.listeners.onThreadLeft?.(event);
      });

      this.socket.on('error', (event: WebSocketErrorEvent | ErrorEvent) => {
        console.error('[CHAT-AGENT-SOCKET] Chat Agent error:', event);
        this.listeners.onError?.(event);
      });

      // Set a connection timeout
      setTimeout(() => {
        if (this.connectionState === 'connecting') {
          this.setConnectionState('error');
          reject(new Error('Connection timeout'));
        }
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.clearReconnectTimer();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.setConnectionState('disconnected');
    this.reconnectAttempts = 0;
  }

  /**
   * Send a chat message
   *
   * @param message - The message content
   * @param threadId - The thread ID (required for continuing conversations)
   * @param uiState - Current UI state as a string
   * @param eventId - Optional event ID for tracking
   */
  public sendChatMessage(
    message: string,
    threadId: string,
    uiState: string,
    eventId?: string
  ): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    const event: ChatMessageEvent = {
      timestamp: new Date(),
      eventId,
      message,
      threadId,
      uiState,
    };

    console.log('[CHAT-AGENT-SOCKET] Sending chat message:', event);
    this.socket.emit('chat_message', event);
  }

  /**
   * Join a thread to receive updates
   *
   * @param threadId - The thread ID to join
   * @param eventId - Optional event ID for tracking
   */
  public joinThread(threadId: string, eventId?: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    const event: JoinThreadEvent = {
      timestamp: new Date(),
      eventId,
      threadId,
    };

    console.log('[CHAT-AGENT-SOCKET] Joining thread:', event);
    this.socket.emit('join_thread', event);
  }

  /**
   * Leave a thread to stop receiving updates
   *
   * @param threadId - The thread ID to leave
   * @param eventId - Optional event ID for tracking
   */
  public leaveThread(threadId: string, eventId?: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    const event: LeaveThreadEvent = {
      timestamp: new Date(),
      eventId,
      threadId,
    };

    console.log('[CHAT-AGENT-SOCKET] Leaving thread:', event);
    this.socket.emit('leave_thread', event);
  }

  /**
   * Send UI state update after navigation
   *
   * @param turnId - Turn ID that triggered the navigation
   * @param uiState - Fresh UI state after navigation
   * @param coverState - Whether the cover screen is currently shown
   * @param eventId - Optional event ID for tracking
   */
  public sendUIStateUpdate(
    turnId: string,
    uiState: string,
    coverState: boolean,
    eventId?: string
  ): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    const event: UIStateUpdateEvent = {
      timestamp: new Date(),
      eventId,
      turnId,
      uiState,
      coverState,
    };

    console.log('[CHAT-AGENT-SOCKET] Sending UI state update:', event);
    this.socket.emit('ui_state_update', event);
  }

  /**
   * Set event listeners for WebSocket events
   *
   * @param listeners - Object containing event listener functions
   */
  public setListeners(listeners: Partial<ChatAgentEventListeners>): void {
    console.log(
      '[CHAT-AGENT-SOCKET] WebSocket setListeners called with:',
      Object.keys(listeners)
    );
    console.log(
      '[CHAT-AGENT-SOCKET] Current listeners before:',
      Object.keys(this.listeners)
    );
    this.listeners = { ...this.listeners, ...listeners };
    console.log(
      '[CHAT-AGENT-SOCKET] Current listeners after:',
      Object.keys(this.listeners)
    );
    console.log(
      '[CHAT-AGENT-SOCKET] onMessageStream exists:',
      !!this.listeners.onMessageStream
    );
  }

  /**
   * Add a single event listener without replacing existing ones
   *
   * @param event - The event name
   * @param listener - The listener function
   */
  public addListener<K extends keyof ChatAgentEventListeners>(
    event: K,
    listener: ChatAgentEventListeners[K]
  ): void {
    this.listeners[event] = listener;
  }

  /**
   * Remove event listeners
   *
   * @param listenerKeys - Array of listener keys to remove
   */
  public removeListeners(
    listenerKeys: (keyof ChatAgentEventListeners)[]
  ): void {
    listenerKeys.forEach((key) => {
      delete this.listeners[key];
    });
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return (
      this.connectionState === 'connected' && this.socket?.connected === true
    );
  }

  /**
   * Get socket ID if connected
   */
  public getSocketId(): string | null {
    return this.socket?.id || null;
  }

  /**
   * Set connection state and notify listeners
   *
   * @private
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      console.log(
        `[CHAT-AGENT-SOCKET] WebSocket connection state changed: ${state}`
      );
      this.listeners.onConnectionStateChange?.(state);
    }
  }

  /**
   * Schedule a reconnection attempt
   *
   * @private
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay =
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(
      `[CHAT-AGENT-SOCKET] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;

      if (this.reconnectAttempts <= this.config.maxReconnectAttempts) {
        console.log(
          `[CHAT-AGENT-SOCKET] Attempting reconnect ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`
        );
        this.connect().catch((error) => {
          console.error('[CHAT-AGENT-SOCKET] Reconnect attempt failed:', error);
        });
      } else {
        console.error('[CHAT-AGENT-SOCKET] Max reconnect attempts reached');
        this.setConnectionState('error');
      }
    }, delay);
  }

  /**
   * Clear reconnect timer
   *
   * @private
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

/**
 * Singleton instance of the WebSocket service
 */
export const chatAgentWebSocket = new ChatAgentWebSocketService();

/**
 * Export default instance and class for flexibility
 */
export default chatAgentWebSocket;
