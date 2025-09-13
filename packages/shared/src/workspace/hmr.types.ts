/**
 * Activity-Based Cleanup and HMR Types for WebSocket communication
 */

import type { X21Id, X21Timestamp } from '../app';
import type { WorkspaceStatusResponse } from './session.types';

export type HMREventType =
  | 'file-changed'
  | 'build-start'
  | 'build-complete'
  | 'build-error'
  | 'hot-reload'
  | 'full-reload'
  | 'connection-status'
  | 'container-ready'
  | 'container-error'
  | 'workspace-status';

export type ActivityLevel = 'active' | 'idle' | 'background' | 'disconnected';

export type ConnectionQuality = 'stable' | 'unstable' | 'poor';

/**
 * Activity event types for tracking user engagement
 */
export type ActivityEventType =
  | 'file-change'
  | 'build-request'
  | 'navigation'
  | 'interaction'
  | 'ping'
  | 'user-interaction'
  | 'file-activity'
  | 'focus-change';

/**
 * HMR event structure for WebSocket communication
 */
export interface HMREvent {
  type: HMREventType;
  sessionId: X21Id;
  timestamp: X21Timestamp;
  data: HMREventData;
}

export interface HMREventData {
  files?: string[]; // Changed file paths
  buildId?: X21Id;
  error?: BuildError;
  duration?: number; // milliseconds
  modules?: ModuleUpdate[];
  reload?: ReloadInfo;
  containerStatus?: string;
  message?: string;
  workspaceStatus?: WorkspaceStatusResponse;
}

export interface BuildError {
  code: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
}

export interface ModuleUpdate {
  path: string;
  type: 'added' | 'changed' | 'removed';
  acceptedBy?: string[]; // Modules that can handle this update
  timestamp: X21Timestamp;
}

export interface ReloadInfo {
  type: 'hot' | 'full';
  reason: string;
  affectedModules?: string[];
  preserveState?: boolean;
}

/**
 * Activity event for tracking user engagement
 */
export interface ActivityEvent {
  type: ActivityEventType;
  sessionId: X21Id;
  timestamp: X21Timestamp;
  metadata?: Record<string, unknown>;
}

/**
 * WebSocket message types for HMR and Activity
 */
export interface HMRWebSocketMessage {
  id: X21Id;
  type: 'event' | 'command' | 'response' | 'activity';
  sessionId: X21Id;
  timestamp: X21Timestamp;
  payload: HMREvent | HMRCommand | HMRResponse | ActivityEvent;
}

export interface HMRCommand {
  action: 'subscribe' | 'unsubscribe' | 'ping' | 'reload' | 'build';
  parameters?: Record<string, unknown>;
}

export interface HMRResponse {
  commandId: X21Id;
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * File watching configuration
 */
export interface FileWatchConfig {
  patterns: string[]; // Glob patterns to watch
  ignorePatterns: string[]; // Patterns to ignore
  debounceMs: number; // Debounce delay
  aggregateChanges: boolean; // Combine rapid changes
  includeContent: boolean; // Send file content with changes
}

/**
 * Connection state for activity-based cleanup
 */
export interface ConnectionState {
  sessionId: X21Id;
  userId: X21Id;
  websocketId: string;
  connectedAt: X21Timestamp;
  lastPingAt: X21Timestamp;
  lastActivityAt: X21Timestamp;
  activityLevel: ActivityLevel;
  connectionQuality: ConnectionQuality;
  gracePeriodEndsAt?: X21Timestamp;
}

/**
 * Connection metrics for monitoring
 */
export interface ConnectionMetrics {
  totalConnections: number;
  averageSessionDuration: number;
  lastDisconnectReason?: string;
  connectionQualityHistory: ConnectionQuality[];
  activityLevelTransitions: Array<{
    from: ActivityLevel;
    to: ActivityLevel;
    timestamp: X21Timestamp;
  }>;
}
