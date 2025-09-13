/**
 * Tool Operation Request/Response Types
 *
 * Unified types for all operations performed within workspace containers via HTTP.
 * All operations use the same request/response wrapper structure for consistency.
 */

import type { ToolOperationType } from './tool-operations.types';
import type { ToolSearchResult } from './search-tool.types';
import type { ToolReadResult } from './read-tool.types';
import type { ToolEditResult } from './edit-tool.types';
import type { ToolCommandResult } from './command-tool.types';
import type { NpmInstallResultData } from './npm.types';

/**
 * Request structure for all tool operations
 * Used by the Express server to handle all container operations
 */
export interface ToolOperationRequest {
  /** Unique request identifier */
  id: string;
  /** Type of tool operation to perform */
  operation: ToolOperationType;
  /** Session ID for the workspace */
  sessionId: string;
  /** Operation-specific parameters */
  parameters: Record<string, unknown>;
  /** Request timestamp */
  timestamp: string;
}

/**
 * Response structure for all tool operations
 * Returned by the Express server for all container operations
 */
export interface ToolOperationResponse<TData = unknown> {
  /** Request identifier matching the request */
  id: string;
  /** Whether the operation completed successfully */
  success: boolean;
  /** Type of operation that was performed */
  operation: ToolOperationType;
  /** Operation result data */
  data?: TData;
  /** Error message if operation failed */
  error?: string;
  /** Response timestamp */
  timestamp: string;
}

/**
 * Archive creation parameters
 * Used for workspace archiving and saving
 */
export interface ArchiveCreationParams {
  /** Patterns to exclude from archive */
  excludePatterns: string[];
}

/**
 * Archive upload parameters
 * Used for uploading and extracting archives
 */
export interface ArchiveUploadParams {
  /** Base64 encoded archive data */
  archiveData: string;
  /** Whether to clean target directory before extraction */
  cleanTarget?: boolean;
}

/**
 * Development server parameters
 * Used for starting the workspace development server
 */
export interface DevServerParams {
  /** Port number for the development server */
  port: number;
  /** Command to start the server */
  command: string;
  /** Command arguments */
  args?: string[];
  /** Environment variables for the server */
  environment?: Record<string, string>;
}

/**
 * Port allocation parameters
 * Used for dynamic port allocation within containers
 */
export interface PortAllocationParams {
  /** Port range for allocation */
  portRange: {
    min: number;
    max: number;
  };
  /** Preferred port number if available */
  preferredPort?: number;
}

/**
 * Port allocation result
 * Returned after successful port allocation
 */
export interface PortAllocationResult {
  /** The allocated port number */
  allocatedPort: number;
  /** Whether the preferred port was allocated */
  isPreferred: boolean;
}

/**
 * Archive extraction result data
 * Returned after successful archive extraction
 */
export interface ArchiveExtractionResultData {
  /** Number of files extracted from archive */
  filesExtracted: number;
  /** Target path where files were extracted */
  targetPath: string;
  /** Extraction duration in milliseconds */
  duration: number;
  /** Size of the extracted archive in bytes */
  archiveSize: number;
}

/**
 * Archive creation result data
 * Returned after successful archive creation
 */
export interface ArchiveCreationResultData {
  /** Base64 encoded archive data */
  archiveData: string;
  /** Size of the created archive in bytes */
  archiveSize: number;
  /** Number of files included in archive */
  filesArchived: number;
  /** Creation duration in milliseconds */
  duration: number;
}

/**
 * Archive upload result data
 * Returned after successful archive upload and extraction
 */
export interface ArchiveUploadResultData {
  /** Number of files extracted from uploaded archive */
  filesExtracted: number;
  /** Target path where files were extracted */
  targetPath: string;
  /** Upload and extraction duration in milliseconds */
  duration: number;
  /** Size of the uploaded archive in bytes */
  archiveSize: number;
}

/**
 * Development server result data
 * Returned after development server operations
 */
export interface DevServerResultData {
  /** Port the development server is running on */
  port: number;
  /** Process ID of the server (if available) */
  pid?: number;
  /** Command used to start the server */
  command: string;
  /** Current server status */
  status: 'starting' | 'running' | 'failed';
}

/**
 * Health check result data
 * Returned after health check operations
 */
export interface HealthCheckResultData {
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
 * Cleanup result data
 * Returned after cleanup operations
 */
export interface CleanupResultData {
  /** Number of files cleaned up */
  filesRemoved: number;
  /** Number of directories cleaned up */
  directoriesRemoved: number;
  /** Total size freed in bytes */
  bytesFreed: number;
  /** Cleanup duration in milliseconds */
  duration: number;
}

/**
 * Unified operation response types with proper typing
 * All operations now use the same consistent wrapper structure
 */

// Core tool operations
export type ToolSearchResponse = ToolOperationResponse<ToolSearchResult>;
export type ToolReadResponse = ToolOperationResponse<ToolReadResult>;
export type ToolEditResponse = ToolOperationResponse<ToolEditResult>;
export type ToolCommandResponse = ToolOperationResponse<ToolCommandResult>;
export type ToolHealthResponse = ToolOperationResponse<HealthCheckResultData>;

// Archive operations
export type CreateArchiveResponse =
  ToolOperationResponse<ArchiveCreationResultData>;
export type ExtractArchiveResponse =
  ToolOperationResponse<ArchiveExtractionResultData>;
export type UploadArchiveResponse =
  ToolOperationResponse<ArchiveUploadResultData>;

// Development server operations
export type StartDevServerResponse = ToolOperationResponse<DevServerResultData>;
export type StopDevServerResponse = ToolOperationResponse<{}>;

// System operations
export type GetAvailablePortResponse =
  ToolOperationResponse<PortAllocationResult>;
export type RunNpmInstallResponse = ToolOperationResponse<NpmInstallResultData>;

/**
 * Union type for all possible tool operation responses
 * Covers all operations that can be performed within workspace containers
 */
export type ToolResponse =
  | ToolSearchResponse
  | ToolReadResponse
  | ToolEditResponse
  | ToolCommandResponse
  | ToolHealthResponse
  | CreateArchiveResponse
  | ExtractArchiveResponse
  | UploadArchiveResponse
  | StartDevServerResponse
  | StopDevServerResponse
  | GetAvailablePortResponse
  | RunNpmInstallResponse;
