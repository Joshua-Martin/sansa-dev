import { useState, useEffect, useCallback, useRef } from 'react';
import { sessionApi } from '../lib/workspace/session.api';
import {
  workspaceWebSocket,
  ConnectionState,
} from '../lib/workspace/websocket.service';
import { tokenManager } from '../lib/api';
import { useAuth } from './useAuth';
import type {
  WorkspaceSession,
  WorkspaceStatusResponse,
  CreateWorkspaceResponse,
  SaveWorkspaceResponse,
  HMREvent,
} from '@sansa-dev/s-shared';

/**
 * Session State Interface
 */
interface SessionState {
  activeSession: WorkspaceSession | null;
  sessionStatus: WorkspaceStatusResponse | null;
  isCreatingSession: boolean;
  isLoadingStatus: boolean;
  sessionError: string | null;

  // WebSocket state
  isWebSocketConnected: boolean;
  webSocketConnectionState: ConnectionState;
  webSocketError: string | null;
}

/**
 * useWorkspaceSession Hook Return Type
 */
interface UseWorkspaceSessionReturn extends SessionState {
  createSession: (workspaceId: string) => Promise<WorkspaceSession>;
  deleteSession: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  saveSession: () => Promise<SaveWorkspaceResponse>;
  keepAlive: () => Promise<void>;
  subscribeToEvents: (callback: (event: HMREvent) => void) => () => void;
}

/**
 * useWorkspaceSession Hook
 *
 * React hook for managing workspace session state including:
 * - Session creation and lifecycle management
 * - Real-time status updates via WebSocket
 * - HMR event handling and subscription
 * - Automatic cleanup and error handling
 * - Connection state management
 */
export function useWorkspaceSession(): UseWorkspaceSessionReturn {
  const { user } = useAuth();

  const [state, setState] = useState<SessionState>({
    activeSession: null,
    sessionStatus: null,
    isCreatingSession: false,
    isLoadingStatus: false,
    sessionError: null,
    isWebSocketConnected: false,
    webSocketConnectionState: 'disconnected',
    webSocketError: null,
  });

  const keepAliveRef = useRef<NodeJS.Timeout | null>(null);
  const eventListenersRef = useRef<Set<(event: HMREvent) => void>>(new Set());

  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<SessionState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Clear session state
   */
  const clearSessionState = useCallback(() => {
    updateState({
      activeSession: null,
      sessionStatus: null,
      sessionError: null,
    });
  }, [updateState]);

  /**
   * Create a new session for a workspace
   */
  const createSession = useCallback(
    async (workspaceId: string): Promise<WorkspaceSession> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      updateState({ isCreatingSession: true, sessionError: null });

      try {
        const response: CreateWorkspaceResponse =
          await sessionApi.createSession(workspaceId);
        const session = response.session;

        updateState({
          activeSession: session,
          isCreatingSession: false,
        });

        // Start keepalive for the session
        if (session.id) {
          startKeepAlive(session.id);
        }

        return session;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create session';
        updateState({
          isCreatingSession: false,
          sessionError: errorMessage,
        });
        throw error;
      }
    },
    [user, updateState]
  );

  /**
   * Delete the current session
   */
  const deleteSession = useCallback(async () => {
    if (!state.activeSession) {
      return;
    }

    updateState({ isLoadingStatus: true, sessionError: null });

    try {
      await sessionApi.deleteSession(state.activeSession.id);

      // Stop keepalive and cleanup
      stopKeepAlive();

      // Unsubscribe from WebSocket events
      if (workspaceWebSocket.getCurrentSessionId() === state.activeSession.id) {
        await workspaceWebSocket.unsubscribeFromSession();
      }

      clearSessionState();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete session';
      updateState({
        isLoadingStatus: false,
        sessionError: errorMessage,
      });
      throw error;
    }
  }, [state.activeSession, updateState, clearSessionState]);

  /**
   * Refresh session status
   */
  const refreshStatus = useCallback(async () => {
    if (!state.activeSession) {
      return;
    }

    updateState({ isLoadingStatus: true, sessionError: null });

    try {
      const status = await sessionApi.getSessionStatus(state.activeSession.id);
      updateState({
        sessionStatus: status,
        isLoadingStatus: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to refresh status';
      updateState({
        isLoadingStatus: false,
        sessionError: errorMessage,
      });
      throw error;
    }
  }, [state.activeSession, updateState]);

  /**
   * Save session changes to workspace
   */
  const saveSession = useCallback(async (): Promise<SaveWorkspaceResponse> => {
    if (!state.activeSession) {
      throw new Error('No active session to save');
    }

    try {
      const result = await sessionApi.saveSession(state.activeSession.id);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save session';
      updateState({ sessionError: errorMessage });
      throw error;
    }
  }, [state.activeSession, updateState]);

  /**
   * Send keepalive to prevent session expiration
   */
  const keepAlive = useCallback(async () => {
    if (!state.activeSession) {
      return;
    }

    try {
      await sessionApi.keepAlive(state.activeSession.id);
    } catch (error) {
      console.warn('Keepalive failed:', error);
    }
  }, [state.activeSession]);

  /**
   * Subscribe to HMR events
   */
  const subscribeToEvents = useCallback(
    (callback: (event: HMREvent) => void) => {
      eventListenersRef.current.add(callback);

      // Add listener to WebSocket service
      workspaceWebSocket.addEventListener('*', callback);

      // Return unsubscribe function
      return () => {
        eventListenersRef.current.delete(callback);
        workspaceWebSocket.removeEventListener('*', callback);
      };
    },
    []
  );

  /**
   * Handle WebSocket status events
   */
  const handleWebSocketStatusEvent = useCallback(
    (event: HMREvent) => {
      if (
        (event.type === 'connection-status' ||
          event.type === 'container-error') &&
        event.data &&
        state.activeSession?.id === event.sessionId
      ) {
        const { containerStatus, message, error } = event.data;

        // Update session status based on WebSocket events
        if (containerStatus === 'running') {
          updateState({
            sessionStatus: {
              sessionId: event.sessionId,
              status: 'running',
              isReady: true,
              previewUrl: state.activeSession?.previewUrl,
              metrics: state.sessionStatus?.metrics || {
                cpuUsage: 0,
                memoryUsage: 0,
                networkIn: 0,
                networkOut: 0,
                uptime: 0,
              },
            },
          });
        } else if (containerStatus === 'error') {
          updateState({
            sessionStatus: {
              sessionId: event.sessionId,
              status: 'error',
              isReady: false,
              error:
                message || error?.message || 'Session initialization failed',
              metrics: state.sessionStatus?.metrics || {
                cpuUsage: 0,
                memoryUsage: 0,
                networkIn: 0,
                networkOut: 0,
                uptime: 0,
              },
            },
          });
        }
      }
    },
    [
      state.activeSession?.id,
      state.activeSession?.previewUrl,
      state.sessionStatus?.metrics,
      updateState,
    ]
  );

  /**
   * Handle workspace status events from WebSocket
   */
  const handleWorkspaceStatusUpdate = useCallback(
    (event: HMREvent) => {
      if (event.type === 'workspace-status' && event.data) {
        const statusData = event.data as {
          workspaceStatus?: WorkspaceStatusResponse;
        };
        if (statusData.workspaceStatus) {
          const status = statusData.workspaceStatus;
          updateState({ sessionStatus: status });

          // CRITICAL FIX: Also update activeSession.isReady to match sessionStatus.isReady
          if (
            state.activeSession &&
            status.isReady !== state.activeSession.isReady
          ) {
            updateState({
              activeSession: {
                ...state.activeSession,
                isReady: status.isReady,
                status: status.status,
              },
            });
          }

          // Session is ready or in error state - no polling to stop
        }
      }
    },
    [updateState, state.activeSession]
  );

  /**
   * Start keepalive timer
   */
  const startKeepAlive = useCallback((sessionId: string) => {
    stopKeepAlive(); // Clear any existing timer

    const sendKeepAlive = async () => {
      try {
        await sessionApi.keepAlive(sessionId);
      } catch (error) {
        console.warn('Keepalive failed:', error);
      }
    };

    // Send keepalive every 30 minutes
    keepAliveRef.current = setInterval(sendKeepAlive, 30 * 60 * 1000);
  }, []);

  /**
   * Stop keepalive timer
   */
  const stopKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  /**
   * Initialize WebSocket connection when session becomes active
   */
  useEffect(() => {
    if (!user || !state.activeSession) {
      return;
    }

    const initializeWebSocket = async () => {
      try {
        const accessToken = await tokenManager.getValidAccessToken();
        if (!accessToken) {
          throw new Error('No access token available');
        }

        await workspaceWebSocket.connect(accessToken);

        // Subscribe to the current session
        if (state.activeSession) {
          await workspaceWebSocket.subscribeToSession(state.activeSession.id);
        }
      } catch (error) {
        console.error('Failed to initialize WebSocket for session:', error);
        updateState({
          isCreatingSession: false,
          webSocketConnectionState: workspaceWebSocket.getConnectionState(),
          webSocketError:
            error instanceof Error
              ? error.message
              : 'WebSocket connection failed',
          sessionError:
            error instanceof Error
              ? `WebSocket connection failed: ${error.message}`
              : 'WebSocket connection failed',
        });
      }
    };

    if (workspaceWebSocket.getConnectionState() === 'disconnected') {
      initializeWebSocket();
    } else if (
      workspaceWebSocket.getCurrentSessionId() !== state.activeSession.id
    ) {
      // Subscribe to new session if different from current
      workspaceWebSocket
        .subscribeToSession(state.activeSession.id)
        .catch((error) => {
          console.error('Failed to subscribe to session:', error);
          updateState({
            isCreatingSession: false,
            sessionError:
              error instanceof Error
                ? `Failed to subscribe to session: ${error.message}`
                : 'Failed to subscribe to session',
          });
        });
    }
  }, [user, state.activeSession, updateState]);

  /**
   * Handle WebSocket connection status changes
   */
  useEffect(() => {
    const handleConnectionChange = (
      connected: boolean,
      state: ConnectionState,
      error?: string
    ) => {
      updateState({
        isWebSocketConnected: connected,
        webSocketConnectionState: state,
        webSocketError: error || null,
      });
    };

    workspaceWebSocket.addConnectionListener(handleConnectionChange);

    return () => {
      workspaceWebSocket.removeConnectionListener(handleConnectionChange);
    };
  }, [updateState]);

  /**
   * Setup WebSocket event listeners
   */
  useEffect(() => {
    workspaceWebSocket.addEventListener(
      'connection-status',
      handleWebSocketStatusEvent
    );
    workspaceWebSocket.addEventListener(
      'container-error',
      handleWebSocketStatusEvent
    );
    workspaceWebSocket.addEventListener(
      'workspace-status',
      handleWorkspaceStatusUpdate
    );

    return () => {
      workspaceWebSocket.removeEventListener(
        'connection-status',
        handleWebSocketStatusEvent
      );
      workspaceWebSocket.removeEventListener(
        'container-error',
        handleWebSocketStatusEvent
      );
      workspaceWebSocket.removeEventListener(
        'workspace-status',
        handleWorkspaceStatusUpdate
      );
    };
  }, [handleWebSocketStatusEvent, handleWorkspaceStatusUpdate]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    const currentListeners = eventListenersRef.current;

    return () => {
      stopKeepAlive();

      // Clean up event listeners
      currentListeners.forEach((callback) => {
        workspaceWebSocket.removeEventListener('*', callback);
      });
      currentListeners.clear();
    };
  }, [stopKeepAlive]);

  return {
    ...state,
    createSession,
    deleteSession,
    refreshStatus,
    saveSession,
    keepAlive,
    subscribeToEvents,
  };
}
