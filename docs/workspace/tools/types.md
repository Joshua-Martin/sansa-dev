# Workspace Tool Interface Types

## Overview

This document provides comprehensive TypeScript type definitions for the workspace container tool interface system. These types define the contracts between the server-side API and container-side tool implementations, ensuring type safety and clear communication protocols.

**Usage Context:**

- **Shared Package**: All types are implemented in `packages/shared/src/workspace/server/` with separate files for each tool
- **Server Integration**: Used by NestJS services and controllers for request/response handling
- **Container Integration**: Used by container tool server for request processing and response formatting
- **AI Agent Integration**: Provides clear interface contracts for AI agent tool usage

**Type System Architecture:**

- **Raw Data Types**: `ToolXResult` interfaces represent the raw business data returned by container operations
- **Wrapped Response Types**: `ToolXResponse` types are `ToolOperationResponse<ToolXResult>` wrappers with metadata
- **Unified Operations**: Single `ToolOperationType` enum covers all operations consistently
- **HTTP Communication**: All operations use HTTP with standardized request/response wrappers

## Core Tool Operation Types

### Search Tool Types

The search tool enables file discovery within workspace containers using various pattern matching strategies.

#### SearchRequest Interface

```typescript
/**
 * Request payload for search tool operations
 *
 * Used by AI agents to discover files within the workspace codebase.
 * Supports multiple search strategies for different discovery needs.
 * Returns file paths only - use read tool to get content.
 */
export interface ToolSearchRequest {
  /**
   * Search pattern to match against file paths
   * - For 'glob': Standard glob patterns like '*.tsx', 'src/**/*.js'
   * - For 'regex': JavaScript regular expression string
   * - For 'exact': Exact filename to locate
   */
  pattern: string;

  /**
   * Search strategy to use for pattern matching
   * - 'glob': Filesystem glob pattern matching (most common)
   * - 'regex': Regular expression matching against file paths
   * - 'exact': Exact filename matching
   */
  type: 'glob' | 'regex' | 'exact';

  /**
   * Whether pattern matching should be case sensitive
   * Default: false (case-insensitive matching)
   * Useful for exact matches in case-sensitive filesystems
   */
  caseSensitive?: boolean;

  /**
   * Maximum number of results to return
   * Default: 1000
   * Prevents memory exhaustion from overly broad searches
   */
  maxResults?: number;
}
```

#### SearchFileResult Interface

```typescript
/**
 * Individual file result from search operations
 *
 * Represents a single file that matches the search criteria.
 * Contains only essential metadata - use read tool for content.
 */
export interface ToolSearchFileResult {
  /**
   * Absolute path to the file from container root
   * Always starts with '/app' for workspace files
   * Used for subsequent read/edit operations
   */
  path: string;

  /**
   * File size in bytes
   * Helps AI agents decide whether to read large files
   * Used for memory management decisions
   */
  size: number;

  /**
   * Last modification timestamp in ISO 8601 format
   * Enables AI agents to understand file recency
   * Format: '2024-01-15T10:30:45.123Z'
   */
  lastModified: string;
}
```

#### SearchResult Interface (Raw Data)

```typescript
/**
 * Raw result data from search tool operations
 *
 * Provides search results along with metadata about the operation
 * for AI agent decision-making and performance monitoring.
 * This is the raw data returned by container operations.
 */
export interface ToolSearchResult {
  /**
   * Whether the search operation completed successfully
   * false indicates an error occurred during search
   */
  success: boolean;

  /**
   * Array of files matching the search criteria
   * Empty array if no matches found
   * Limited by maxResults parameter
   */
  results: ToolSearchFileResult[];

  /**
   * Total number of files found (before maxResults limit)
   * Helps AI agents understand if results were truncated
   * May be larger than results.length
   */
  totalFound: number;

  /**
   * Search operation execution time in milliseconds
   * Used for performance monitoring and optimization
   * Typical values: 10-500ms depending on search scope
   */
  executionTime: number;

  /**
   * Error message if operation failed
   * Only present when success=false
   * Human-readable error description
   */
  error?: string;
}
```

#### SearchResponse Interface (HTTP Wrapper)

```typescript
/**
 * Complete HTTP response from search tool operations
 *
 * Wraps the raw search result data with HTTP metadata
 * for consistent API communication and debugging.
 */
export type ToolSearchResponse = ToolOperationResponse<ToolSearchResult>;
```

### Read Tool Types

The read tool provides complete file content access for AI analysis and context building.

#### ReadRequest Interface

```typescript
/**
 * Request payload for read tool operations
 *
 * Used by AI agents to retrieve complete file contents
 * for analysis, context building, or modification planning.
 * Always uses UTF-8 encoding for text files.
 */
export interface ToolReadRequest {
  /**
   * Path to the file to read
   * Can be absolute (/app/src/file.tsx) or relative (src/file.tsx)
   * Relative paths are resolved against workspace root (/app)
   */
  path: string;
}
```

#### ReadResult Interface (Raw Data)

```typescript
/**
 * Raw result data from read tool operations
 *
 * Provides file content along with comprehensive metadata
 * for AI agent context and decision-making.
 * This is the raw data returned by container operations.
 */
export interface ToolReadResult {
  /**
   * Whether the read operation completed successfully
   * false indicates file not found, permission denied, or other error
   */
  success: boolean;

  /**
   * Complete file content as string
   * Empty string if file is empty
   * Only present when success=true
   */
  content: string;

  /**
   * File size in bytes
   * Matches content.length for text files
   * Useful for AI agents to understand file complexity
   */
  size: number;

  /**
   * Last modification timestamp in ISO 8601 format
   * Helps AI agents understand file recency
   * Format: '2024-01-15T10:30:45.123Z'
   */
  lastModified: string;

  /**
   * Text encoding used for reading the file
   * Always 'utf8' for all text files
   */
  encoding: 'utf8';

  /**
   * Number of lines in the file
   * Calculated by counting newline characters
   * Helps AI agents understand file structure
   */
  lineCount: number;

  /**
   * Error message if operation failed
   * Only present when success=false
   * Examples: 'File not found', 'Permission denied'
   */
  error?: string;
}
```

#### ReadResponse Interface (HTTP Wrapper)

```typescript
/**
 * Complete HTTP response from read tool operations
 *
 * Wraps the raw read result data with HTTP metadata
 * for consistent API communication and debugging.
 */
export type ToolReadResponse = ToolOperationResponse<ToolReadResult>;
```

### Command Tool Types

The command tool enables AI agents to execute shell commands within the workspace environment.

#### CommandRequest Interface

```typescript
/**
 * Request payload for command tool operations
 *
 * Used by AI agents to execute shell commands for building,
 * testing, package management, and other development tasks.
 * Simplified to command string and timeout only.
 */
export interface ToolCommandRequest {
  /**
   * Complete command to execute including arguments
   * Examples: 'npm install', 'git status', 'ls -la', 'grep -r "pattern" src/'
   * Full command string parsed by shell
   */
  command: string;

  /**
   * Maximum execution time in milliseconds
   * Default: 30000 (30 seconds)
   * Commands exceeding timeout are forcefully terminated
   */
  timeout?: number;
}
```

#### CommandResult Interface (Raw Data)

```typescript
/**
 * Raw result data from command tool operations
 *
 * Provides command output, exit status, and execution metadata
 * for AI agent decision-making and error handling.
 * This is the raw data returned by container operations.
 */
export interface ToolCommandResult {
  /**
   * Whether the command completed successfully
   * Based on exit code (0 = success) and timeout status
   * false for non-zero exit codes or timeouts
   */
  success: boolean;

  /**
   * Standard output from command execution
   * Captured as string, may contain newlines
   * Empty string if no stdout produced
   */
  stdout: string;

  /**
   * Standard error output from command execution
   * Captured as string, may contain newlines
   * Empty string if no stderr produced
   */
  stderr: string;

  /**
   * Process exit code
   * 0 indicates successful execution
   * Non-zero values indicate various error conditions
   */
  exitCode: number;

  /**
   * Command execution time in milliseconds
   * Actual time taken, may be less than timeout
   * Used for performance monitoring
   */
  executionTime: number;

  /**
   * Whether the command was terminated due to timeout
   * true if command exceeded timeout limit
   * false for normal completion (success or error)
   */
  timedOut: boolean;

  /**
   * Error message if operation failed
   * Only present when success=false
   * Human-readable error description
   */
  error?: string;
}
```

#### CommandResponse Interface (HTTP Wrapper)

```typescript
/**
 * Complete HTTP response from command tool operations
 *
 * Wraps the raw command result data with HTTP metadata
 * for consistent API communication and debugging.
 */
export type ToolCommandResponse = ToolOperationResponse<ToolCommandResult>;
```

### Edit Tool Types

The edit tool provides efficient file modification using find and replace operations for precise, targeted edits.

#### EditRequest Interface

```typescript
/**
 * Request payload for edit tool operations
 *
 * Used by AI agents to make targeted modifications to files using
 * find and replace operations. Enables precise edits without
 * requiring full file content output from AI agents.
 */
export interface ToolEditRequest {
  /**
   * Path to the file to edit
   * Can be absolute (/app/src/file.tsx) or relative (src/file.tsx)
   * Relative paths are resolved against workspace root (/app)
   */
  path: string;

  /**
   * Text to find in the file for replacement
   * Must be an exact match of existing content
   * Can be a single line or multiple lines
   * Used to locate the precise position for edit
   */
  findText: string;

  /**
   * Text to replace the found text with
   * Can be empty string for deletion
   * Can be multiple lines for insertions
   * Maintains file structure and formatting
   */
  replaceText: string;

  /**
   * Whether to replace all occurrences of findText
   * Default: false (replace only first occurrence)
   * When true, replaces every instance of findText in the file
   */
  replaceAll?: boolean;
}
```

#### EditResult Interface (Raw Data)

```typescript
/**
 * Raw result data from edit tool operations
 *
 * Provides edit results and metadata for AI agent confirmation
 * and change tracking purposes for find/replace operations.
 * This is the raw data returned by container operations.
 */
export interface ToolEditResult {
  /**
   * Whether the edit operation completed successfully
   * false indicates file not found, text not found, or other error
   */
  success: boolean;

  /**
   * Number of replacements made in the file
   * 0 if findText was not found in the file
   * 1 if replaceAll=false and text was found
   * Multiple if replaceAll=true and text found multiple times
   */
  replacementCount: number;

  /**
   * Original file size in bytes before edit
   * Used for change impact assessment
   */
  previousSize: number;

  /**
   * New file size in bytes after edit
   * Used for change impact assessment
   */
  newSize: number;

  /**
   * Estimated number of lines that changed
   * Calculated by comparing line counts of findText vs replaceText
   * Approximation for change magnitude assessment
   */
  linesChanged: number;

  /**
   * New last modification timestamp in ISO 8601 format
   * Timestamp when the edit operation completed
   * Format: '2024-01-15T10:30:45.123Z'
   */
  lastModified: string;

  /**
   * Error message if operation failed
   * Only present when success=false
   * Examples: 'File not found', 'Text not found', 'Permission denied'
   */
  error?: string;
}
```

#### EditResponse Interface (HTTP Wrapper)

```typescript
/**
 * Complete HTTP response from edit tool operations
 *
 * Wraps the raw edit result data with HTTP metadata
 * for consistent API communication and debugging.
 */
export type ToolEditResponse = ToolOperationResponse<ToolEditResult>;
```

## Health and Status Types

### Health Check Types

Used for monitoring tool server availability and status.

#### HealthCheckResult Interface (Raw Data)

```typescript
/**
 * Raw result data from tool server health check operations
 *
 * Provides basic health status for monitoring and debugging
 * tool server availability within containers.
 * This is the raw data returned by container operations.
 */
export interface HealthCheckResultData {
  /**
   * Current health status of the tool server
   * 'healthy': Server is running and responsive
   * 'unhealthy': Server has issues or is not responding properly
   */
  status: 'healthy' | 'unhealthy';

  /**
   * Timestamp when health check was performed
   * ISO 8601 format: '2024-01-15T10:30:45.123Z'
   * Used for health check freshness validation
   */
  timestamp: string;

  /**
   * Optional additional health information
   * May include version, uptime, or other diagnostic data
   * Used for detailed health monitoring
   */
  details?: Record<string, unknown>;
}
```

#### HealthResponse Interface (HTTP Wrapper)

```typescript
/**
 * Complete HTTP response from health check operations
 *
 * Wraps the raw health check result data with HTTP metadata
 * for consistent API communication and debugging.
 */
export type ToolHealthResponse = ToolOperationResponse<HealthCheckResultData>;
```

## Error Handling Types

### Standard Error Codes

Enumeration of standard error codes used across all tool operations.

```typescript
/**
 * Standard error codes for tool operations
 *
 * Provides consistent, machine-readable error identification
 * across all tool types for programmatic error handling.
 */
export enum ToolErrorCode {
  // Generic errors
  /** Internal server error occurred */
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  /** Request exceeded rate limit */
  RATE_LIMIT = 'RATE_LIMIT',

  /** Invalid request format or missing required fields */
  INVALID_REQUEST = 'INVALID_REQUEST',

  // Search tool errors
  /** Search pattern not provided */
  MISSING_PATTERN = 'MISSING_PATTERN',

  /** Invalid search type specified */
  INVALID_SEARCH_TYPE = 'INVALID_SEARCH_TYPE',

  /** Search operation failed */
  SEARCH_ERROR = 'SEARCH_ERROR',

  // Read tool errors
  /** File path not provided */
  MISSING_PATH = 'MISSING_PATH',

  /** File not found at specified path */
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',

  /** Path is not a file (directory, symlink, etc.) */
  NOT_A_FILE = 'NOT_A_FILE',

  /** File read operation failed */
  READ_ERROR = 'READ_ERROR',

  // Command tool errors
  /** Command not provided */
  MISSING_COMMAND = 'MISSING_COMMAND',

  /** Command execution timed out */
  COMMAND_TIMEOUT = 'COMMAND_TIMEOUT',

  /** Command execution failed */
  COMMAND_ERROR = 'COMMAND_ERROR',

  // Edit tool errors
  /** Find text not provided */
  MISSING_FIND_TEXT = 'MISSING_FIND_TEXT',

  /** Text to find was not found in the file */
  TEXT_NOT_FOUND = 'TEXT_NOT_FOUND',

  /** File edit operation failed */
  EDIT_ERROR = 'EDIT_ERROR',

  /** Path outside workspace boundaries */
  FORBIDDEN_PATH = 'FORBIDDEN_PATH',

  // Session and security errors
  /** Session not found or access denied */
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',

  /** Session not ready for tool operations */
  SESSION_NOT_READY = 'SESSION_NOT_READY',

  /** Tool server not available in container */
  TOOL_SERVER_UNAVAILABLE = 'TOOL_SERVER_UNAVAILABLE',
}
```

### Base Error Response Interface

```typescript
/**
 * Standard error response structure for all tool operations
 *
 * Provides consistent error reporting format across all tools
 * for reliable error handling by AI agents and client applications.
 */
export interface ToolErrorResponse {
  /**
   * Always false for error responses
   * Indicates operation did not complete successfully
   */
  success: false;

  /**
   * Human-readable error message
   * Suitable for display to users or logging
   * Should be descriptive but not expose internal details
   */
  error: string;

  /**
   * Machine-readable error code
   * Used for programmatic error handling
   * Maps to ToolErrorCode enum values
   */
  code: ToolErrorCode;

  /**
   * Optional additional error context
   * May include validation errors, field-specific issues, etc.
   * Used for detailed error analysis
   */
  details?: Record<string, unknown>;
}
```

## Union Types for Tool Operations

## HTTP Communication Wrapper Types

### Tool Operation Request Wrapper

```typescript
/**
 * Generic wrapper for all tool operation requests
 *
 * Provides consistent HTTP request structure with metadata
 * for debugging, tracing, and operation management.
 */
export interface ToolOperationRequest<TParams = unknown> {
  /** Unique request identifier for tracing */
  id: string;
  /** Type of operation being requested */
  operation: ToolOperationType;
  /** Operation-specific parameters */
  parameters: TParams;
  /** Request timestamp */
  timestamp: string;
}
```

### Tool Operation Response Wrapper

```typescript
/**
 * Generic wrapper for all tool operation responses
 *
 * Provides consistent HTTP response structure with metadata
 * for debugging, monitoring, and error handling.
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
```

### Combined Request Types

```typescript
/**
 * Union type for all possible tool request types
 *
 * Used by generic tool handling functions and middleware
 * that need to process any type of tool request.
 */
export type AllRequestType =
  | ToolSearchRequest
  | ToolReadRequest
  | ToolCommandRequest
  | ToolEditRequest;
```

### Combined Response Types

```typescript
/**
 * Union type for all possible tool response types
 *
 * Used by generic tool handling functions and middleware
 * that need to process any type of tool response.
 */
export type AllResponseType =
  | ToolSearchResponse
  | ToolReadResponse
  | ToolCommandResponse
  | ToolEditResponse
  | ToolHealthResponse
  | ToolErrorResponse;
```

### Tool Operation Type

```typescript
/**
 * Available tool operation types
 *
 * Unified enum covering all operations consistently
 * Used for routing and operation identification.
 */
export type ToolOperationType =
  | 'search'
  | 'read'
  | 'edit'
  | 'command'
  | 'health'
  | 'create-archive'
  | 'upload-and-extract-archive'
  | 'run-npm-install'
  | 'start-dev-server'
  | 'stop-dev-server'
  | 'get-available-port';
```

## Server-Side Integration Types

### Service Method Signatures

Types for server-side service implementations.

```typescript
/**
 * Interface for workspace tool service implementations
 *
 * Defines the contract for server-side tool service classes
 * that handle tool execution and session management.
 */
export interface IWorkspaceToolService {
  /**
   * Execute search tool in specified session
   * @param sessionId - Workspace session identifier
   * @param userId - User identifier for authorization
   * @param request - Search operation parameters
   * @returns Promise resolving to search results
   */
  executeSearch(
    sessionId: string,
    userId: string,
    request: ToolSearchRequest
  ): Promise<ToolSearchResponse>;

  /**
   * Execute read tool in specified session
   * @param sessionId - Workspace session identifier
   * @param userId - User identifier for authorization
   * @param request - Read operation parameters
   * @returns Promise resolving to file content
   */
  executeRead(
    sessionId: string,
    userId: string,
    request: ToolReadRequest
  ): Promise<ToolReadResponse>;

  /**
   * Execute command tool in specified session
   * @param sessionId - Workspace session identifier
   * @param userId - User identifier for authorization
   * @param request - Command operation parameters
   * @returns Promise resolving to command results
   */
  executeCommand(
    sessionId: string,
    userId: string,
    request: ToolCommandRequest
  ): Promise<ToolCommandResponse>;

  /**
   * Execute edit tool in specified session
   * @param sessionId - Workspace session identifier
   * @param userId - User identifier for authorization
   * @param request - Edit operation parameters
   * @returns Promise resolving to edit results
   */
  executeEdit(
    sessionId: string,
    userId: string,
    request: ToolEditRequest
  ): Promise<ToolEditResponse>;

  /**
   * Check tool server health in specified session
   * @param sessionId - Workspace session identifier
   * @param userId - User identifier for authorization
   * @returns Promise resolving to health status
   */
  checkToolHealth(sessionId: string, userId: string): Promise<boolean>;
}
```

## Container-Side Integration Types

### Tool Handler Function Signatures

Types for container-side tool handler implementations.

```typescript
/**
 * Function signature for container tool handlers
 *
 * Defines the contract for tool handler functions
 * in the container-side Express.js server.
 */
export type ToolHandler<TRequest, TResponse> = (
  req: express.Request & { body: TRequest },
  res: express.Response
) => Promise<void>;

/**
 * Specific handler type signatures for each tool
 */
export type SearchHandler = ToolHandler<ToolSearchRequest, ToolSearchResult>;
export type ReadHandler = ToolHandler<ToolReadRequest, ToolReadResult>;
export type CommandHandler = ToolHandler<ToolCommandRequest, ToolCommandResult>;
export type EditHandler = ToolHandler<ToolEditRequest, ToolEditResult>;
```

## Configuration Types

### Tool Server Configuration

```typescript
/**
 * Configuration options for container tool server
 *
 * Used to configure the Express.js server running
 * within workspace containers.
 */
export interface ToolServerConfig {
  /**
   * Port number for tool server
   * Default: 3001
   * Should not conflict with main application port
   */
  port: number;

  /**
   * Workspace root directory path
   * Default: '/app'
   * All file operations are scoped to this directory
   */
  workspaceRoot: string;

  /**
   * Rate limiting configuration
   * Prevents abuse while allowing normal operation
   */
  rateLimit: {
    /** Time window in milliseconds (default: 60000 = 1 minute) */
    windowMs: number;
    /** Maximum requests per window (default: 1000) */
    max: number;
  };

  /**
   * Request timeout in milliseconds
   * Default: 60000 (60 seconds)
   * Maximum time to wait for tool operations
   */
  requestTimeout: number;

  /**
   * Maximum request body size
   * Default: '50mb'
   * Supports large file content in edit operations
   */
  maxRequestSize: string;

  /**
   * Logging configuration
   */
  logging: {
    /** Enable request logging */
    enabled: boolean;
    /** Log level: 'debug' | 'info' | 'warn' | 'error' */
    level: string;
  };
}
```

## Usage Examples

### AI Agent Integration Example

```typescript
/**
 * Example of how AI agents would use these types
 * for tool operations within workspace containers.
 */
class AIWorkspaceAgent {
  constructor(private toolService: IWorkspaceToolService) {}

  async analyzeAndModifyProject(
    sessionId: string,
    userId: string
  ): Promise<string> {
    // Search for React components
    const searchRequest: ToolSearchRequest = {
      pattern: '**/*.tsx',
      type: 'glob',
      caseSensitive: false,
      maxResults: 100,
    };

    const searchResult = await this.toolService.executeSearch(
      sessionId,
      userId,
      searchRequest
    );

    if (!searchResult.success) {
      throw new Error(`Search failed: ${searchResult.error}`);
    }

    // Read the first component file
    if (searchResult.results.length > 0) {
      const readRequest: ToolReadRequest = {
        path: searchResult.results[0].path,
      };

      const readResult = await this.toolService.executeRead(
        sessionId,
        userId,
        readRequest
      );

      if (readResult.success) {
        // Make a targeted edit to add a prop
        const editRequest: ToolEditRequest = {
          path: searchResult.results[0].path,
          findText: 'interface Props {',
          replaceText: 'interface Props {\n  className?: string;',
          replaceAll: false,
        };

        const editResult = await this.toolService.executeEdit(
          sessionId,
          userId,
          editRequest
        );

        if (editResult.success && editResult.data) {
          return `Found ${searchResult.data?.totalFound} components. Modified first component with ${editResult.data.replacementCount} replacements.`;
        }
      }
    }

    return 'No components found in project.';
  }
}
```

This comprehensive type system ensures type safety, clear contracts, and reliable communication between all components of the workspace tool interface system.
