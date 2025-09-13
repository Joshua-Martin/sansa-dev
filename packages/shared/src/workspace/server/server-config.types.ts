/**
 * Server Configuration Types
 *
 * Configuration types for the Express-based container tool server
 */

/**
 * Container tool configuration
 * Core configuration for the container tool server
 *
 * NOT CONFIGURABLE OVER HTTP
 */
export interface ContainerToolConfig {
  /** Workspace root directory path */
  workspacePath: string;
  /** Tools directory path */
  toolsPath: string;
  /** Default port for the tool server */
  defaultPort: number;
  /** Health check interval in milliseconds */
  healthCheckInterval: number;
}

/**
 * Tool server configuration
 * Complete configuration for the Express-based tool server
 *
 * NOT CONFIGURABLE OVER HTTP
 */
export interface ToolServerConfig {
  /** Port number for tool server */
  port: number;
  /** Host address to bind to */
  host: string;
  /** Workspace root directory path */
  workspaceRoot: string;
  /** Rate limiting configuration */
  rateLimit: {
    /** Time window in milliseconds */
    windowMs: number;
    /** Maximum requests per window */
    max: number;
  };
  /** Request timeout in milliseconds */
  requestTimeout: number;
  /** Maximum request body size */
  maxRequestSize: string;
  /** Logging configuration */
  logging: {
    /** Enable request logging */
    enabled: boolean;
    /** Log level */
    level: string;
  };
  /** Security configuration */
  security: {
    /** Enable Helmet security middleware */
    enableHelmet: boolean;
    /** CORS allowed origins */
    corsOrigins: string[];
  };
}
