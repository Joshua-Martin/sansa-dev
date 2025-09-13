import type { ContainerHealthStatus } from '@sansa-dev/shared';

/**
 * Container connection information for routing
 */
export interface ContainerConnection {
  /** Session ID this container belongs to */
  sessionId: string;
  /** User ID who owns this session */
  userId: string;
  /** Docker container ID */
  containerId: string;
  /** Container name */
  containerName: string;
  /** Host where container is running (for dev container: usually container name) */
  host: string;
  /** Port where container tool server is accessible */
  toolServerPort: number;
  /** Port where user's dev server is running */
  devServerPort: number;
  /** Container status */
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  /** When this container was registered */
  registeredAt: Date;
  /** Last successful health check */
  lastHealthCheck?: Date;
  /** Container health status */
  healthStatus?: ContainerHealthStatus;
}


