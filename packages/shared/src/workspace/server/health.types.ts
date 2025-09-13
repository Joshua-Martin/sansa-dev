/**
 * Health Check Types
 *
 * Types for container health monitoring and status reporting
 * used by the Express server health endpoints.
 */

/**
 * Container health data
 * Comprehensive health information for the container tool server
 */
export interface ContainerHealthData {
  /** Current health status */
  status: 'healthy' | 'unhealthy' | 'starting' | 'stopped';
  /** Server uptime in seconds */
  uptime: number;
  /** Whether template has been injected successfully */
  templateInjected: boolean;
  /** Whether development server is currently running */
  devServerRunning: boolean;
  /** Port the development server is running on */
  devServerPort?: number;
  /** Timestamp of last health check */
  lastHealthCheck: string;
  /** Workspace root path */
  workspacePath: string;
}

/**
 * Health server configuration
 * Configuration for the health check endpoints
 */
export interface HealthServerConfig {
  /** Port for health server */
  port: number;
  /** Host address for health server */
  host: string;
}

/**
 * Container metrics for monitoring
 * Resource usage and performance metrics
 */
export interface ContainerMetrics {
  /** CPU usage percentage */
  cpuUsage: number;
  /** Memory usage in MB */
  memoryUsage: number;
  /** Network input in bytes */
  networkIn: number;
  /** Network output in bytes */
  networkOut: number;
  /** Container uptime in seconds */
  uptime: number;
  /** Build time in seconds (if applicable) */
  buildTime?: number;
}
