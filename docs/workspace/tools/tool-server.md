# Container Tool Server Implementation Guide

## Overview

This document provides a complete implementation guide for building the workspace container tool server from scratch. This server enables AI agents to interact with workspace containers through four standardized operations: search, read, command, and edit. The server runs on port 3001 within each container and must be built using Express.js with a layered architecture approach.

**Critical Implementation Requirements:**

- **Type Safety**: All interfaces must be defined in both the container package and shared package for consistency
- **Security**: Every file operation must validate paths to prevent directory traversal attacks
- **Performance**: All operations must include configurable limits and timeout controls
- **Reliability**: Every operation must have comprehensive error handling with machine-readable error codes
- **Maintainability**: Clear separation between HTTP handling, business logic, and utility functions

**System Integration Context:**
This new tool server will replace the existing container-tool-server.ts which currently handles template injection and container management. The new implementation must preserve all existing functionality while adding the new AI tool operations.

## Architecture Design

The tool server follows a five-layer architecture where each layer has distinct responsibilities and clear interfaces:

1. **Configuration Layer**: Manages all server settings, environment variables, and validation
2. **Server Layer**: Express.js HTTP server with middleware stack for security and request processing
3. **Handler Layer**: HTTP request/response handling with validation and error formatting
4. **Operation Layer**: Core business logic for file operations and command execution
5. **Utility Layer**: Reusable functions for path validation, pattern matching, and file system operations

## Directory Structure and File Organization

The tool server must be organized into the following directory structure within the existing x21-container package. Each file has a specific purpose and must be implemented according to the separation of concerns principle:

```
workspace/x21-container/src/tool-server/
├── index.ts                    # Main entry point and server lifecycle management
├── server.ts                   # Express.js server implementation with middleware
├── config.ts                   # Configuration management with environment variables
├── types.ts                    # Container-specific type definitions (mirrors shared package)
├── handlers/
│   ├── index.ts               # Central export file and route setup function
│   ├── search.handler.ts      # HTTP handler for search tool requests
│   ├── read.handler.ts        # HTTP handler for read tool requests
│   ├── command.handler.ts     # HTTP handler for command tool requests
│   ├── edit.handler.ts        # HTTP handler for edit tool requests
│   ├── health.handler.ts      # HTTP handler for health check requests
│   └── container.handler.ts   # HTTP handler for existing container operations
├── operations/
│   ├── index.ts               # Central export file for all operations
│   ├── search.operation.ts    # File system search with glob, regex, exact matching
│   ├── read.operation.ts      # File reading with metadata collection
│   ├── command.operation.ts   # Shell command execution with process management
│   ├── edit.operation.ts      # File modification with find-and-replace operations
│   └── container.operation.ts # Existing container operations (migrated)
├── utils/
│   ├── index.ts               # Central export file for all utilities
│   ├── path-validator.ts      # Path validation and security functions
│   ├── file-utils.ts          # File system helper functions
│   ├── pattern-matcher.ts     # Pattern matching utilities for search operations
│   └── error-handler.ts       # Error creation and formatting utilities
└── middleware/
    ├── index.ts               # Central export file and middleware setup function
    ├── rate-limiter.ts        # Rate limiting configuration and implementation
    ├── request-logger.ts      # Request logging middleware
    ├── error-handler.ts       # Global error handling middleware
    └── cors.ts                # CORS configuration middleware
```

**Core Files:**

- `index.ts` - Main entry point that exports the server class and starts the server process
- `server.ts` - Express.js server implementation with middleware configuration
- `config.ts` - Configuration management with environment variable support
- `types.ts` - Container-specific type definitions (must mirror shared package types)

**Handler Directory: `handlers/`**

- `index.ts` - Central export file for all handlers and route setup function
- `search.handler.ts` - HTTP handler for search tool requests
- `read.handler.ts` - HTTP handler for read tool requests
- `command.handler.ts` - HTTP handler for command tool requests
- `edit.handler.ts` - HTTP handler for edit tool requests
- `health.handler.ts` - HTTP handler for health check requests
- `container.handler.ts` - HTTP handler for existing container operations (template injection, npm install, dev server management)

**Operations Directory: `operations/`**

- `index.ts` - Central export file for all operations
- `search.operation.ts` - File system search logic with glob, regex, and exact matching
- `read.operation.ts` - File reading logic with metadata collection
- `command.operation.ts` - Shell command execution with process management
- `edit.operation.ts` - File modification logic with find-and-replace operations
- `container.operation.ts` - Existing container operations migrated from current implementation

**Utilities Directory: `utils/`**

- `index.ts` - Central export file for all utilities
- `path-validator.ts` - Path validation and security functions
- `file-utils.ts` - File system helper functions
- `pattern-matcher.ts` - Pattern matching utilities for search operations
- `error-handler.ts` - Error creation and formatting utilities

**Middleware Directory: `middleware/`**

- `index.ts` - Central export file for all middleware and setup function
- `rate-limiter.ts` - Rate limiting configuration and implementation
- `request-logger.ts` - Request logging middleware
- `error-handler.ts` - Global error handling middleware
- `cors.ts` - CORS configuration middleware

## Detailed File Implementation Specifications

### 1. Main Entry Point (`index.ts`)

**Primary Purpose**: This file serves as the main entry point for the entire tool server system. It must handle server initialization, provide a clean API for other parts of the system to use, and manage the server lifecycle including graceful shutdown.

**Required Imports**: Import the ToolServer class from server.ts, configuration utilities from config.ts, and all type definitions from types.ts. Also import the existing container functionality that needs to be preserved.

**Export Requirements**: Export the main ToolServer class, all configuration interfaces, all error code enumerations, and a convenience function for creating and starting a server instance with default configuration.

**Server Creation Function**: Implement a function called createToolServer that accepts optional configuration overrides, merges them with defaults, creates a new ToolServer instance, starts it, and returns the running server. This function must handle any startup errors and provide meaningful error messages.

**CLI Entry Point Logic**: Include conditional logic that detects if this file is being run directly (not imported). When run directly, create a server with default configuration, start it, and set up signal handlers for graceful shutdown. The signal handlers must listen for SIGTERM and SIGINT, call the server's stop method, and exit with appropriate codes.

**Error Handling**: All startup errors must be logged with detailed information and cause the process to exit with code 1. Success messages should be logged to stderr to avoid interfering with any structured output.

**Graceful Shutdown**: Implement proper cleanup that waits for the server to finish processing existing requests before terminating. The shutdown process must not take longer than 10 seconds and should force-terminate if needed.

### 2. Server Implementation (`server.ts`)

**Primary Purpose**: This file contains the main ToolServer class that manages the Express.js HTTP server instance. It must handle server lifecycle, middleware configuration, route setup, and global error handling.

**Required Imports**: Import Express.js and its types, Node.js HTTP Server, the configuration interface, middleware setup function, route setup function, and all tool-related types.

**ToolServer Class Structure**: Create a class with private properties for the Express app instance, HTTP server instance (initially null), and the configuration object. The configuration must be stored as readonly to prevent accidental modification.

**Constructor Logic**: The constructor must accept a ToolServerConfig parameter, store it, create a new Express application instance, and call a private setup method. The setup method must not start the server, only configure it.

**Start Method Implementation**: Create an async start method that returns a Promise. Use the Express app's listen method to start the server on the configured host and port. Wrap this in a Promise that resolves when the server starts successfully or rejects if there's an error. Store the server instance for later use in stopping. Log startup information including the server URL and workspace root path.

**Stop Method Implementation**: Create an async stop method that gracefully shuts down the server. If a server instance exists, call its close method and wait for it to complete. Set the server instance to null after stopping. If no server instance exists, resolve immediately.

**Server Setup Method**: Create a private setupServer method that configures the Express application. This method must call the middleware setup function first, then the route setup function, and finally add the global error handler. The order is critical - middleware must be configured before routes, and the error handler must be last.

**Global Error Handler**: Implement a private method that serves as the final error handler for unhandled errors. This method must log the error details, create a standardized error response with appropriate HTTP status code, and send it to the client. Include request context in the error response for debugging purposes.

**Error Response Format**: All error responses must follow the ToolErrorResponse interface with success set to false, a human-readable error message, a machine-readable error code, and optional details object containing timestamp, request path, and HTTP method.

### 3. Configuration Management (`config.ts`)

**Primary Purpose**: This file manages all configuration for the tool server, including environment variable parsing, default value assignment, and configuration validation. It must provide a single source of truth for all server settings.

**ToolServerConfig Interface**: Define an interface with the following required properties: port (number for server listening port), host (string for server bind address), workspaceRoot (string for workspace directory path), rateLimit (object with windowMs and max properties for rate limiting), requestTimeout (number in milliseconds), maxRequestSize (string like "50mb"), logging (object with enabled boolean and level string), and security (object with enableHelmet boolean and corsOrigins string array).

**Environment Variable Mapping**: Each configuration property must have a corresponding environment variable. Port should read from TOOL_SERVER_PORT defaulting to 3001. Host should read from TOOL_SERVER_HOST defaulting to "0.0.0.0". Workspace root should read from WORKSPACE_ROOT defaulting to "/app". Rate limit window should read from RATE_LIMIT_WINDOW_MS defaulting to 60000. Rate limit max should read from RATE_LIMIT_MAX defaulting to 1000. Request timeout should read from REQUEST_TIMEOUT defaulting to 60000. Max request size should read from MAX_REQUEST_SIZE defaulting to "50mb". Logging enabled should read from LOGGING_ENABLED defaulting to true unless explicitly set to "false". Log level should read from LOG_LEVEL defaulting to "info". Helmet enabled should read from ENABLE_HELMET defaulting to true unless set to "false". CORS origins should read from CORS_ORIGINS as comma-separated values defaulting to ["*"].

**Default Configuration Function**: Implement a function called createDefaultConfig that accepts optional partial configuration overrides. This function must parse all environment variables, apply defaults, then merge any provided overrides using object spread syntax. All environment variable parsing must handle string-to-number conversion and array parsing for CORS origins.

**Configuration Validation Function**: Create a validateConfig function that accepts a ToolServerConfig and throws descriptive errors for invalid values. Validate that port is between 1 and 65535. Validate that workspaceRoot is an absolute path starting with "/". Validate that rate limit max is at least 1 and window is at least 1000 milliseconds. Validate that log level is one of the allowed values. Validate that request timeout is positive.

**Type Safety Requirements**: All configuration properties must be strongly typed. Use string literal unions for log levels and other enumerated values. Ensure environment variable parsing handles edge cases like undefined values and invalid number formats gracefully.

**Updated Type System Integration**: The tool server now uses a unified type system where:

- Container operations return `ToolXResult` interfaces (raw business data)
- HTTP responses are wrapped as `ToolXResponse = ToolOperationResponse<ToolXResult>`
- All operations use the unified `ToolOperationType` enum
- Types are organized in separate files under `packages/shared/src/workspace/server/`

### 4. Tool Operation Handlers

#### Search Handler (`handlers/search.handler.ts`)

**Primary Purpose**: This handler processes HTTP requests for the search tool operation. It must validate incoming requests, delegate to the search operation, measure execution time, and format responses according to the ToolSearchResponse interface.

**Required Imports**: Import Express types for Request, Response, and NextFunction. Import ToolSearchRequest and ToolSearchResult interfaces from the types file. Import the searchFiles function from the operations layer. Import request validation utilities.

**Handler Function Structure**: Create an async function called handleSearch that accepts typed Express request, response, and next function parameters. Use TypeScript generics to properly type the request body as ToolSearchRequest and response as ToolSearchResult.

**Request Validation Logic**: At the start of the handler, call a validation function to check the request body. The validation must verify that the pattern field is provided and non-empty, the type field is one of the allowed values (glob, regex, exact), and any optional parameters like maxResults and caseSensitive are valid. If validation fails, immediately return a 400 status response with the appropriate error code and message.

**Execution Time Tracking**: Record the start time before calling the search operation and calculate the execution time after completion. This timing information must be included in the response for performance monitoring.

**Operation Delegation**: Call the searchFiles function from the operations layer, passing the validated request body and the workspace root path from the server configuration. The workspace root must be accessed through the Express app locals where it was stored during server setup.

**Success Response Formatting**: When the search operation completes successfully, construct a ToolSearchResult object with success set to true, the results array from the operation, the total count of found files, and the calculated execution time. Send this as JSON with a 200 status code.

**Error Handling**: Wrap the entire handler in a try-catch block. If any error occurs during processing, pass it to the Express error handling middleware using the next function. Do not attempt to handle errors directly in this handler - let the global error handler manage them for consistency.

**Type Safety**: Ensure all request and response objects are properly typed using the interfaces defined in the types file. The handler must not compile if there are any type mismatches between the expected interfaces and actual usage.

#### Read Handler (`handlers/read.handler.ts`)

**Primary Purpose**: This handler processes HTTP requests for the read tool operation. It must validate file path requests, delegate to the read operation, and return file content with comprehensive metadata.

**Required Imports**: Import Express types for Request, Response, and NextFunction. Import ToolReadRequest and ToolReadResult interfaces. Import the readFile function from operations. Import path validation utilities.

**Handler Function Structure**: Create an async function called handleRead with properly typed Express parameters. Use TypeScript generics to type the request body as ToolReadRequest and response as ToolReadResult.

**Request Validation**: Validate that the request body contains a valid path field that is non-empty and properly formatted. The validation must check for dangerous path patterns, ensure the path is within allowed boundaries, and verify it's a valid file path format. If validation fails, return a 400 status with appropriate error details.

**Operation Delegation**: Call the readFile operation function, passing the validated request and workspace root path. The operation layer will handle the actual file system interaction and security checks.

**Response Handling**: The read operation returns a complete ToolReadResult object that can be sent directly to the client. No additional formatting is needed since the operation layer handles success/failure formatting.

**Error Propagation**: Use try-catch to handle any unexpected errors and pass them to the Express error handling middleware. The operation layer should handle most errors internally and return them in the response object.

#### Command Handler (`handlers/command.handler.ts`)

**Primary Purpose**: This handler processes HTTP requests for command execution within the workspace container. It must validate command requests, manage execution timeouts, and capture all output safely.

**Required Imports**: Import Express types, ToolCommandRequest and ToolCommandResult interfaces, the executeCommand function from operations, and command validation utilities.

**Handler Function Structure**: Create an async handleCommand function with typed Express parameters. Use generics to properly type the request body and response.

**Request Validation**: Validate that the command field is present, non-empty, and doesn't contain dangerous patterns. Check that the timeout value (if provided) is within acceptable limits. Validate that the command doesn't attempt to access restricted system areas or execute prohibited operations.

**Security Considerations**: The handler must ensure that commands can only be executed within the workspace directory context. All command execution must be sandboxed to prevent access to system files or other containers.

**Operation Delegation**: Call the executeCommand operation with the validated request and workspace root. The operation layer handles the actual process spawning, output capture, and timeout management.

**Response Handling**: The command operation returns a complete ToolCommandResult object that can be sent directly. The response includes stdout, stderr, exit code, execution time, and timeout status.

**Error Handling**: Use try-catch to handle unexpected errors and delegate to Express error middleware. Most errors should be handled by the operation layer and returned in the response structure.

#### Edit Handler (`handlers/edit.handler.ts`)

**Primary Purpose**: This handler processes HTTP requests for file editing operations using find-and-replace functionality. It must validate edit requests, ensure atomic operations, and provide detailed change tracking.

**Required Imports**: Import Express types, ToolEditRequest and ToolEditResult interfaces, the editFile function from operations, and edit validation utilities.

**Handler Function Structure**: Create an async handleEdit function with properly typed Express parameters. Use TypeScript generics for type safety on request and response objects.

**Request Validation**: Validate that the path field is present and secure, the findText field is non-empty, and the replaceText field is provided (can be empty for deletions). Check that the replaceAll flag is a valid boolean if provided. Ensure the path is within workspace boundaries and the file is editable.

**Atomic Operation Requirements**: The edit operation must be atomic - either the entire operation succeeds or fails without partial modifications. The handler should not need to manage this directly as it's handled by the operation layer.

**Operation Delegation**: Call the editFile operation with the validated request and workspace root path. The operation handles file locking, backup creation, and atomic replacement.

**Change Tracking**: The response includes detailed information about what changed: number of replacements made, file size before and after, estimated lines changed, and new modification timestamp.

**Error Handling**: Use try-catch for unexpected errors and delegate to Express middleware. The operation layer handles most file system errors and returns them in the response structure.

### 5. Core Operations

#### Search Operation (`operations/search.operation.ts`)

**Primary Purpose**: This operation implements the core file search functionality with support for three search strategies: glob patterns, regular expressions, and exact filename matching. It must provide efficient searching with result limiting and comprehensive metadata collection.

**Required Imports**: Import Node.js file system promises, path utilities, the glob library for pattern matching, and all relevant type definitions. Import utility functions for path validation and error creation.

**Main Search Function**: Create an async function called searchFiles that accepts a ToolSearchRequest and workspace root path, returning a ToolSearchResult. This function must extract the pattern, search type, case sensitivity flag, and maximum results limit from the request. Based on the search type, delegate to the appropriate specialized search function.

**Glob Search Implementation**: Create a function that uses the glob library to find files matching the provided pattern. Configure glob options to search within the workspace root, return absolute paths, handle case sensitivity, disable symlink following for security, and exclude hidden files by default. After getting matches, limit results to the specified maximum and collect file metadata (size, modification time) for each match.

**Regex Search Implementation**: Create a function that compiles the pattern into a regular expression with appropriate flags for case sensitivity. Implement a directory walking algorithm that recursively visits all files in the workspace, tests each file path against the regex, and collects matching results up to the specified limit.

**Exact Search Implementation**: Create a function that searches for files with exactly matching filenames. Walk the directory tree and compare the basename of each file against the target pattern, handling case sensitivity appropriately. Collect matches up to the result limit.

**Directory Walking Utility**: Implement a recursive directory traversal function that visits all files and directories within the workspace. This function should accept a callback that processes each file with its stats. Handle errors gracefully by skipping inaccessible files rather than failing the entire operation.

**Performance Optimization**: Implement early termination when the maximum result limit is reached for regex and exact searches. Use efficient file system operations and avoid loading file contents during search operations.

**Security Considerations**: Ensure all file operations stay within the workspace root directory. Validate that symlinks don't escape the workspace boundary. Handle permission errors gracefully without exposing system information.

**Metadata Collection**: For each matching file, collect the absolute path, file size in bytes, and last modification timestamp in ISO 8601 format. This metadata helps AI agents make informed decisions about which files to read or modify.

**Error Handling**: Wrap all operations in try-catch blocks and throw appropriate tool errors with specific error codes. Handle individual file access errors by skipping those files rather than failing the entire search.

#### Read Operation (`operations/read.operation.ts`)

**Primary Purpose**: This operation implements secure file content retrieval with comprehensive metadata collection, path validation, and UTF-8 encoding support. It must handle all file reading scenarios and return structured responses.

**Required Imports**: Import Node.js file system promises, path utilities, and all relevant type definitions including ToolReadRequest, ToolReadResponse, and error codes. Import path validation utilities.

**Main Read Function**: Create an async function called readFile that accepts a ToolReadRequest and workspace root path, returning a ToolReadResult. This function must handle all aspects of file reading including validation, security checks, content retrieval, and metadata collection.

**Path Validation and Resolution**: Use the path validation utility to ensure the requested path is within workspace boundaries and resolve it to an absolute path. Handle both relative and absolute path inputs appropriately.

**File Existence and Type Checking**: Use file system stats to verify the path exists and points to a regular file (not a directory, symlink, or special file). Return appropriate error responses for missing files or invalid file types.

**Content Reading**: Read the entire file content using UTF-8 encoding. The operation assumes all files are text files and uses UTF-8 encoding consistently. Handle large files appropriately but don't implement streaming for the MVP.

**Metadata Collection**: Collect comprehensive file metadata including file size in bytes, last modification timestamp in ISO 8601 format, encoding used (always UTF-8), and line count calculated by counting newline characters in the content.

**Success Response Construction**: When file reading succeeds, construct a ToolReadResult with success set to true, the complete file content, and all collected metadata.

**Error Response Construction**: For various error scenarios, construct appropriate ToolReadResult objects with success set to false, specific error codes (FILE_NOT_FOUND, NOT_A_FILE, READ_ERROR), human-readable error messages, and empty values for content and metadata fields.

**Error Code Mapping**: Map specific file system errors to appropriate tool error codes. Handle ENOENT (file not found), EACCES (permission denied), EISDIR (is directory), and other common file system errors with specific error codes and messages.

**Security Considerations**: All file operations must stay within the workspace root directory. Use the path validation utility to prevent directory traversal attacks. Don't expose system-level error details that could reveal information about the container structure.

### 6. Security and Utilities

#### Path Validator (`utils/path-validator.ts`)

**Primary Purpose**: This utility provides comprehensive path validation and security controls to prevent directory traversal attacks and ensure all file operations stay within workspace boundaries. It's critical for container security.

**Required Imports**: Import Node.js path utilities and error code definitions from the types file.

**Main Validation Function**: Create a function called validatePath that accepts an input path string and workspace root path, returning a validated absolute path. This function must handle both relative and absolute input paths and ensure the resolved path stays within the workspace boundary.

**Path Resolution Logic**: If the input path is absolute, resolve it directly. If it's relative, resolve it relative to the workspace root. Use Node.js path.resolve to handle path resolution and path.normalize to resolve any ".." or "." components.

**Boundary Validation**: After normalizing both the resolved path and workspace root, verify that the resolved path starts with the workspace root followed by a path separator, or is exactly equal to the workspace root. This prevents directory traversal attacks that attempt to access files outside the workspace.

**Error Handling**: Throw descriptive errors for invalid paths with appropriate error codes. Handle missing paths, paths outside workspace boundaries, and other validation failures with specific error messages that don't reveal system information.

**Path Safety Checker**: Create a function called isPathSafe that checks for dangerous patterns in path strings. This should detect directory traversal attempts (..), double slashes (//), invalid filename characters, and attempts to access system directories like /proc, /sys, or /dev.

**Security Considerations**: The validator must be bulletproof against all known directory traversal techniques including URL encoding, Unicode normalization attacks, and symlink-based attacks. Always normalize paths before validation and never trust user input.

**Error Creation Utility**: Implement a helper function to create path validation errors with consistent error codes and messages. The error objects should include both human-readable messages and machine-readable error codes for proper error handling.

#### Pattern Matcher (`utils/pattern-matcher.ts`)

**Primary Purpose**: This utility provides optimized pattern matching functions for the three search types supported by the search operation. It must handle glob patterns, regular expressions, and exact matches with proper validation and error handling.

**Required Imports**: Import the minimatch library for glob pattern matching. No other external dependencies should be needed for regex and exact matching.

**Glob Pattern Matching**: Create a function called matchesGlob that uses the minimatch library to test if a filename matches a glob pattern. Configure minimatch options to handle case sensitivity, exclude dot files by default, and enable base matching for filename-only patterns.

**Regex Pattern Matching**: Create a function called matchesRegex that compiles the pattern into a RegExp object with appropriate flags for case sensitivity and tests it against the filename. Wrap in try-catch to handle invalid regex patterns gracefully by returning false.

**Exact Pattern Matching**: Create a function called matchesExact that performs simple string comparison with optional case sensitivity. For case-insensitive matching, convert both strings to lowercase before comparison.

**Pattern Validation Functions**: Implement validation functions for each pattern type to verify syntax before attempting to use them. For glob patterns, check for balanced brackets and braces. For regex patterns, attempt to create a RegExp object and catch any syntax errors. For exact patterns, simply verify the pattern is non-empty.

**Validation Dispatcher**: Create a main validatePattern function that accepts a pattern and type, then delegates to the appropriate specific validation function based on the type parameter.

**Error Handling**: All pattern matching functions must handle invalid patterns gracefully by returning false rather than throwing errors. This prevents search operations from failing due to malformed patterns.

**Performance Considerations**: Cache compiled regular expressions if the same pattern is used multiple times. Optimize glob matching by using minimatch's built-in optimizations. For exact matching, use simple string comparison which is the fastest option.

## Server Interface Upgrades and Migration Strategy

### Current State Analysis

The existing container-tool-server.ts uses Node.js's built-in HTTP module with manual request parsing and routing. This implementation currently handles template injection, npm operations, and development server management but lacks the robust architecture needed for the new AI tool operations.

**Current Implementation Limitations:**

1. **Manual HTTP Handling**: All request parsing, routing, and response formatting is implemented manually
2. **Limited Middleware**: Only basic CORS headers with no comprehensive security or logging
3. **No Request Validation**: No structured validation of request bodies or parameters
4. **Basic Error Handling**: Simple error responses without consistent formatting or error codes
5. **No Rate Limiting**: No protection against abuse or excessive requests
6. **Difficult Extensibility**: Adding new endpoints requires manual routing modifications

**Current Functionality to Preserve:**

- Health check endpoint at /health
- Container operation endpoint at /container-operation for template injection
- Root path handling with status page generation
- Graceful shutdown handling for SIGTERM and SIGINT
- Integration with existing container management functions

### Recommended Migration to Express.js

**Migration Benefits:**

1. **Robust Architecture**: Professional-grade HTTP server with proven middleware ecosystem
2. **Built-in Security**: Helmet.js integration for comprehensive security headers and protection
3. **Request Processing**: Automatic JSON parsing, parameter extraction, and validation support
4. **Error Handling**: Centralized error handling with consistent response formatting
5. **Rate Limiting**: Built-in protection against abuse with configurable limits per endpoint
6. **Logging**: Comprehensive request/response logging for debugging and monitoring
7. **Testing Support**: Extensive testing utilities and mocking capabilities
8. **Maintainability**: Clean separation of concerns with middleware-based architecture

**Required Express.js Dependencies:**

- express: Core framework
- helmet: Security middleware
- cors: Cross-origin resource sharing configuration
- express-rate-limit: Rate limiting middleware
- morgan: Request logging middleware
- express-validator: Request validation middleware

**Middleware Stack Configuration:**

1. **Helmet Security**: Configure security headers, XSS protection, and content security policy
2. **CORS Configuration**: Set up cross-origin resource sharing with configurable origins
3. **Rate Limiting**: Implement per-IP rate limiting with different limits for different endpoints
4. **Body Parsing**: Configure JSON and text parsing with size limits (50MB for large file operations)
5. **Request Logging**: Set up comprehensive logging of all requests and responses
6. **Request Validation**: Add validation middleware for each endpoint type
7. **Error Handling**: Implement global error handler that formats all errors consistently

**Performance Impact Assessment:**

- Express.js adds approximately 1-2ms overhead per request
- Built-in optimizations for common HTTP operations
- Better memory management for concurrent requests
- Improved connection pooling and keep-alive support
- More efficient request parsing and routing

### Migration Implementation Strategy

**Step 1: Preserve Existing Functionality**
Create a new container.handler.ts that wraps all existing container operations (template injection, npm install, dev server management) and exposes them through Express routes. This ensures no functionality is lost during the migration.

**Step 2: Implement New Tool Architecture**
Build the complete tool server architecture alongside the existing functionality. The new Express server must handle both existing container operations and new AI tool operations.

**Step 3: Update Container Entrypoint**
Modify the container startup process to use the new Express-based tool server instead of the current HTTP server implementation. Update the setup-container.sh script to start the new server.

**Step 4: Validate Integration**
Ensure all existing container functionality continues to work through the new Express-based interface. Test template injection, npm operations, and development server management.

## Type System Requirements

### Shared Package Integration

**Critical Requirement**: All request and response types must be defined in both the container package and the shared package to ensure consistency across the system.

**Shared Package Location**: Types are organized in separate files under `packages/shared/src/workspace/server/` including:

- `search-tool.types.ts`: ToolSearchRequest, ToolSearchResult, ToolSearchFileResult
- `read-tool.types.ts`: ToolReadRequest, ToolReadResult
- `command-tool.types.ts`: ToolCommandRequest, ToolCommandResult
- `edit-tool.types.ts`: ToolEditRequest, ToolEditResult
- `health.types.ts`: HealthCheckResultData
- `tool-operations-wrapper.types.ts`: ToolOperationRequest, ToolOperationResponse, and ToolXResponse type aliases
- `tool-operations.types.ts`: Union types, ToolOperationType enum, and helper interfaces
- `error-codes.types.ts`: ToolErrorCode enumeration and ToolErrorResponse

**Container Package Types**: Container handlers import types directly from the shared package using `@sansa-dev/shared`. Container operations return the raw `ToolXResult` types, which are then wrapped by the NestJS service layer into `ToolXResponse` types for HTTP communication.

**Type Consistency Enforcement**: Use TypeScript's strict mode and ensure both packages compile with the same TypeScript configuration. Any changes to types must be made in the shared package first, then imported by the container package.

**Import Strategy**: The container package must import types from the shared package using relative imports that work within the monorepo structure. The shared package must not depend on the container package to avoid circular dependencies.

### Container-Specific Extensions

**Additional Types**: The container package may define additional types for internal implementation details that are not part of the shared API contract, such as configuration interfaces, internal utility types, and implementation-specific error types.

**Configuration Types**: Define container-specific configuration types that extend or complement the shared types but are only used within the container implementation.

## Implementation Checklist

### Prerequisites

1. Update package.json to include Express.js and related dependencies
2. Ensure TypeScript configuration supports the new architecture
3. Create type definitions in shared package first
4. Set up proper import paths between packages

### Core Implementation

1. Implement configuration management with environment variable support
2. Create Express server with comprehensive middleware stack
3. Implement all four tool operation handlers with proper validation
4. Create all four tool operations with complete functionality
5. Implement security utilities including path validation and pattern matching
6. Create middleware for rate limiting, logging, and error handling

### Integration and Testing

1. Migrate existing container functionality to new Express architecture
2. Update container startup scripts to use new server
3. Test all existing functionality continues to work
4. Test all new AI tool operations function correctly
5. Validate security controls prevent directory traversal and other attacks
6. Test error handling and response formatting
7. Verify performance meets requirements under load

This comprehensive implementation provides a robust, secure, and maintainable foundation for the workspace container tool interface system while preserving all existing functionality.
