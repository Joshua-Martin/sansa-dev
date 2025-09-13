/**
 * Core workspace session types for container management and real-time operations
 */

import type { X21Id, X21Timestamp } from '../app';
import type { ConnectionMetrics } from './hmr.types';
import type { ContainerMetrics } from './server';

export type Port = number;
export type ActivityLevel = 'active' | 'idle' | 'background' | 'disconnected';

export type WorkspaceStatus =
  | 'creating'
  | 'initializing'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'error';

export type ContainerStatus =
  | 'creating'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'error';

/**
 * Core workspace session entity
 * Represents a running container instance that may or may not be connected to a workspace
 */
export interface WorkspaceSession {
  id: X21Id;
  userId: X21Id;
  workspaceId?: X21Id; // Optional - may reference a persistent workspace
  containerId?: string;
  containerName: string;
  status: WorkspaceStatus;
  previewUrl: string;
  port: Port;
  toolServerPort?: Port; // Port for container tool server communication
  resources: ResourceAllocation;
  environment: PreviewEnvironment;
  createdAt: X21Timestamp;
  lastActivityAt?: X21Timestamp; // When the session last had user activity
  activityLevel: ActivityLevel; // Current activity level
  activeConnectionCount: number; // Number of active connections
  gracePeriodEndsAt?: X21Timestamp; // When grace period ends after disconnect
  connectionMetrics?: ConnectionMetrics; // Connection analytics data
  isReady: boolean;
  error?: string;
  hasSavedChanges: boolean; // Whether workspace has saved changes
  lastSavedAt?: X21Timestamp; // When workspace was last saved
  templateId?: X21Id; // Template used to initialize this workspace
  updatedAt: X21Timestamp;
}

/**
 * Resource allocation for workspace containers
 */
export interface ResourceAllocation {
  cpu: number; // CPU cores allocated
  memory: number; // MB allocated
  storage: number; // MB allocated
  networkBandwidth?: number; // MB/s limit
}

/**
 * Preview environment configuration
 */
export interface PreviewEnvironment {
  nodeVersion: string;
  buildTool: 'astro' | 'vite' | 'webpack';
  environmentVariables: Record<string, string>;
  workspaceMount: string; // Container path
  outputPath: string; // Build output path
  hmrEnabled: boolean;
  devServerPort: Port;
}

/**
 * Container specification for Docker
 */
export interface ContainerSpec {
  image: string;
  tag: string;
  command?: string[];
  args?: string[];
  workingDir: string;
  user?: string;
  environment: Record<string, string>;
  volumes: VolumeMount[];
  ports: PortMapping[];
  resources: ResourceConstraints;
  labels: Record<string, string>;
  network?: NetworkConfig;
}

export interface VolumeMount {
  source: string; // Host path or volume name
  target: string; // Container path
  readOnly?: boolean;
  type: 'bind' | 'volume' | 'tmpfs';
}

export interface PortMapping {
  containerPort: Port;
  hostPort?: Port;
  protocol: 'tcp' | 'udp';
  expose?: boolean;
}

export interface ResourceConstraints {
  cpuLimit: number; // CPU cores
  memoryLimit: number; // MB
  storageLimit: number; // MB
  pidsLimit?: number;
  ulimits?: Record<string, number>;
}

export interface NetworkConfig {
  name: string;
  aliases?: string[];
  ipv4Address?: string;
  driverOpts?: Record<string, string>;
}

/**
 * API request/response types for session operations
 */
export interface OpenWorkspaceSessionRequest {
  workspaceId?: X21Id; // Optional - may reference existing workspace
  templateId?: X21Id; // Used when creating session without existing workspace
}

/**
 * Workspace init session type - represents the initial session created for a workspace
 */
export type WorkspaceInitSession = WorkspaceSession;

/**
 * Create workspace response - returns session information
 */
export interface CreateWorkspaceResponse {
  session: WorkspaceInitSession;
  buildLogs?: string[];
  estimatedReadyTime?: number; // seconds
}

/**
 * Session status response with metrics
 */
export interface WorkspaceStatusResponse {
  sessionId: X21Id;
  status: WorkspaceStatus;
  isReady: boolean;
  previewUrl?: string;
  error?: string;
  metrics: ContainerMetrics;
}

// Re-export Docker container operation types from container.types.ts for convenience
export type {
  DockerContainerOperation,
  DockerContainerOperationResult,
  DockerContainerOperationType,
} from './container.types';
/**
 * Workspace session with persistence information
 * This represents a session that has been persisted but is still a session, not a workspace
 */
export interface SavedWorkspaceSession extends WorkspaceSession {
  hasSavedChanges: boolean;
  lastSavedAt: X21Timestamp;
  templateId: X21Id;
}
