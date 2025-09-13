# Workspace Container Tool Interface System

## Overview

This document outlines the design and technical approach for implementing a tool interface system that enables AI agents to interact with workspace containers through standardized operations. The system bridges the gap between high-level AI operations and low-level container file system manipulation.

**Key Concepts:**

- **Workspace**: The container and its codebase content, saved as an archive
- **Session**: An instance of a container running a workspace
- **Tool**: A standardized operation that can be executed within a workspace container
- **Tool Interface**: The communication layer that enables external systems to execute tools

## Business Requirements

The tool interface system addresses the core need for AI agents to manipulate codebases within isolated container environments. This enables:

- **Autonomous Code Generation**: AI agents can search, read, and modify files to implement features
- **Intelligent Code Analysis**: Tools provide context for AI decision-making through file discovery and content analysis
- **Secure Execution Environment**: All operations are contained within isolated Docker containers
- **Session Isolation**: Each user's workspace operates independently with proper access controls

## Core Tool Capabilities

The system provides four fundamental operations, all executed at the codebase root (`/app`):

### 1. Search Tool - File Discovery

**Purpose**: Enable AI agents to discover and locate files within the codebase structure
**Capabilities**:

- Glob pattern matching for flexible file discovery (`*.tsx`, `src/**/*.js`)
- Regular expression search for complex pattern matching
- Exact filename matching for precise file location
- File metadata including size and modification timestamps
- Performance-optimized results with configurable limits

### 2. Read Tool - Content Access

**Purpose**: Provide complete file content access for AI analysis and context building
**Capabilities**:

- Full file content retrieval using UTF-8 encoding
- File metadata including size, modification dates, and line counts
- Path validation and security controls
- Support for all text-based file formats used in web development

### 3. Command Tool - Environment Interaction

**Purpose**: Enable AI agents to execute development commands within the workspace
**Capabilities**:

- Shell command execution in workspace root directory
- Complete command strings with arguments included
- Timeout controls to prevent hanging operations
- Comprehensive output capture (stdout, stderr, exit codes)
- Future extensibility for command restrictions and security policies

### 4. Edit Tool - Content Modification

**Purpose**: Allow AI agents to modify files with targeted find and replace operations
**Capabilities**:

- Precise find and replace operations for targeted edits
- Support for single or multiple replacements
- Efficient editing without full file content output
- Change tracking and metadata reporting
- Path validation and security controls

## Technical Architecture

### System Design Principles

The tool interface system follows a **layered architecture** that separates concerns and provides clear boundaries between components:

1. **API Layer**: REST endpoints for external tool requests with authentication and validation
2. **Service Layer**: Business logic for session management and request orchestration
3. **Transport Layer**: HTTP communication between server and container environments
4. **Container Layer**: Tool execution engine running within isolated Docker containers
5. **File System Layer**: Direct file operations within the workspace root directory

### Communication Architecture

The system uses a **request-response pattern** over HTTP to maintain simplicity and reliability:

- **Synchronous Operations**: All tool operations complete before returning results
- **Session-Based Routing**: Requests are routed to specific container instances based on session ID
- **Port-Based Communication**: Each container exposes tools on a dedicated port (3001)
- **Error Propagation**: Errors bubble up through the stack with context preservation
- **Unified Type System**: Raw business data (`ToolXResult`) from containers is wrapped in HTTP metadata (`ToolXResponse`) by the NestJS service layer

### Container Integration Strategy

Each workspace container runs **two concurrent processes**:

1. **Primary Application Server**: The main development server (on dynamic ports 8000-8100)
2. **Tool Interface Server**: HTTP server for tool operations (port 3001)
3. **Container Management Server**: Container operations and health checks (port 4321)

This multi-server approach ensures:

- **Isolation**: Tool operations don't interfere with the main application
- **Performance**: Tool requests don't block the development server
- **Reliability**: Tool server failures don't affect the workspace application
- **Scalability**: Each container manages its own tool execution independently

## Container-Side Implementation Strategy

### Tool Server Technical Approach

The container-side implementation centers around a **lightweight HTTP server** that runs alongside the main development server. This approach was chosen for several key reasons:

**Technology Selection Rationale:**

- **Node.js Runtime**: Leverages existing container environment without additional language dependencies
- **Express.js Framework**: Minimal overhead HTTP server with robust middleware ecosystem
- **Native File System APIs**: Direct access to Node.js `fs` operations for optimal performance
- **Child Process Management**: Built-in `spawn` capabilities for secure command execution
- **Pattern Matching Libraries**: Established `glob` package for flexible file discovery

### Server Architecture Decisions

**Port Strategy**: The tool server operates on port 3001 to avoid conflicts with the primary development server (dynamic ports 8000-8100) and container management server (port 4321). This separation ensures:

- **Process Isolation**: Tool operations don't interfere with development workflows
- **Independent Scaling**: Each service can be monitored and managed separately
- **Clear Responsibility Boundaries**: Development server handles user interface, tool server handles AI operations

**Request Handling Pattern**: The server implements a **middleware-based request pipeline**:

1. **Request Logging**: All operations are logged for debugging and audit purposes
2. **Rate Limiting**: High-threshold protection (1000 req/min) against abuse without impacting normal use
3. **JSON Processing**: Large payload support (50MB) for file content operations
4. **Error Handling**: Comprehensive error capture with structured response formatting

### Security Architecture

**Path Validation Strategy**: All file operations implement strict path validation to prevent directory traversal attacks:

- **Root Boundary Enforcement**: All paths must resolve within `/app` directory
- **Absolute Path Resolution**: Relative paths are resolved against workspace root
- **Symbolic Link Protection**: Path resolution prevents escape via symbolic links

**Command Execution Controls**: The command tool implements multiple security layers:

- **Timeout Management**: Prevents resource exhaustion from long-running processes
- **Environment Isolation**: Commands execute with session-specific environment variables
- **Output Capture**: Complete stdout/stderr capture prevents information leakage
- **Process Management**: Proper cleanup of child processes prevents resource leaks

### Tool Implementation Specifications

### Search Tool - File Discovery Engine

**Technical Approach**: The search tool implements a **multi-strategy pattern matching system** to accommodate different AI search needs:

**Pattern Matching Strategies**:

- **Glob Pattern Engine**: Utilizes the `glob` library for filesystem-native pattern matching, supporting wildcards, directory traversal, and extension filtering
- **Regular Expression Engine**: Implements custom regex-based file discovery for complex pattern requirements
- **Exact Match Engine**: Provides direct filename lookup with case sensitivity controls

**Performance Optimization Strategy**:

- **Result Limiting**: Configurable maximum results (default 1000) to prevent memory exhaustion
- **Lazy Loading**: File metadata is retrieved only for matched files, not the entire filesystem
- **Metadata Only**: Returns file paths and metadata without content for efficient discovery
- **Execution Timing**: Built-in performance monitoring for optimization insights

**Response Data Structure**: Returns structured file information including absolute paths, file sizes, and modification timestamps for AI decision-making. Container operations return `ToolSearchResult` with an array of `ToolSearchFileResult` objects, which is wrapped as `ToolSearchResponse` by the NestJS service layer.

### Read Tool - Content Access Engine

**Technical Approach**: The read tool provides **complete file content access** with comprehensive metadata for AI context building:

**Content Retrieval Strategy**:

- **Full File Loading**: Always returns complete file contents (no partial reads for MVP simplicity)
- **UTF-8 Encoding**: Standardized UTF-8 encoding for all text files
- **Metadata Enrichment**: Provides file size, line count, and modification timestamps for AI decision-making
- **Path Resolution**: Supports both absolute and relative path inputs with security validation

**Performance Considerations**:

- **Memory Management**: Direct file-to-memory loading suitable for typical web development file sizes
- **Error Handling**: Comprehensive error reporting for missing files, permission issues, and read errors
- **Type Safety**: Container operations return `ToolReadResult` objects, wrapped as `ToolReadResponse` by the service layer

### Command Tool - Environment Interaction Engine

**Technical Approach**: The command tool enables **secure shell command execution** within the workspace environment:

**Process Management Strategy**:

- **Shell Command Execution**: Uses Node.js `spawn` with shell parsing for complete command strings
- **Timeout Controls**: Configurable timeout (default 30 seconds) prevents resource exhaustion
- **Command String Processing**: Full command strings including arguments parsed by shell
- **Output Capture**: Complete stdout and stderr capture with exit code reporting

**Security and Reliability Features**:

- **Process Isolation**: Commands execute in workspace root with controlled environment
- **Resource Management**: Automatic cleanup of child processes and handles
- **Timeout Enforcement**: Forceful termination of hanging processes
- **Comprehensive Logging**: Execution time tracking and detailed error reporting
- **Consistent Response Format**: Container operations return `ToolCommandResult`, wrapped as `ToolCommandResponse` by the service layer

### Edit Tool - Content Modification Engine

**Technical Approach**: The edit tool provides **targeted find and replace operations** for efficient file modifications:

**Find and Replace Strategy**:

- **Exact Text Matching**: Precise string matching to locate replacement targets
- **Targeted Replacements**: Efficient editing without requiring full file content from AI
- **Single or Multiple**: Support for replacing first occurrence or all occurrences
- **Change Tracking**: Detailed reporting of replacement count and file size changes

**Operation Features**:

- **Atomic Operations**: Complete find/replace operations ensure consistent file state
- **Validation Checks**: Path security validation and file existence verification
- **Operation Reporting**: Comprehensive success/failure reporting with replacement metrics
- **Structured Results**: Container operations return `ToolEditResult`, wrapped as `ToolEditResponse` by the service layer

### Container Integration Strategy

**Docker Image Modification Approach**: The tool system requires minimal modifications to existing container templates:

**Dependency Management**:

- **Additional NPM Packages**: Express.js, glob, and express-rate-limit packages added to container image
- **No Runtime Changes**: Leverages existing Node.js runtime without additional language requirements
- **Minimal Footprint**: Tool server adds approximately 2-3MB to container image size

**Process Management Strategy**:

- **Multi-Process Architecture**: Container runs the development server, tool server, and container management server concurrently
- **Background Execution**: Tool server runs as background process to avoid blocking main application
- **Process Monitoring**: Both processes are monitored for health and automatic restart capabilities
- **Graceful Shutdown**: Proper signal handling ensures clean termination of both processes

**Port Allocation Strategy**:

- **Fixed Port Assignment**: Tool server consistently uses port 3001 across all containers
- **Port Exposure**: Additional port exposure in Docker configuration for tool server access
- **Network Isolation**: Tool server accessible only from host system, not external networks

## Server-Side Implementation Strategy

### Service Layer Architecture

The server-side implementation follows a **service-oriented architecture** that provides clean separation between API concerns and business logic:

**Workspace Tool Service Design**:

- **Session Management**: Validates user ownership and session state before tool execution
- **Request Orchestration**: Manages the complete request lifecycle from validation to response
- **Error Translation**: Converts container-level errors into user-friendly API responses
- **Logging Integration**: Comprehensive operation logging for debugging and audit purposes

**HTTP Client Strategy**:

- **Axios Integration**: Leverages established HTTP client with robust error handling
- **Timeout Management**: 60-second timeout prevents hanging requests
- **Connection Pooling**: Efficient connection reuse for multiple tool operations
- **Error Propagation**: Structured error handling with context preservation

### Session Validation Architecture

**Multi-Layer Validation Approach**:

1. **Authentication Layer**: JWT token validation ensures authenticated requests
2. **Authorization Layer**: User ownership verification prevents cross-user access
3. **Session State Layer**: Validates container is running and ready for operations
4. **Resource State Layer**: Ensures container has necessary resources available

**Security Validation Strategy**:

- **Database-Level Validation**: Session ownership verified through database queries
- **State Consistency Checks**: Container status validation before tool execution
- **Request Sanitization**: Input validation and sanitization before forwarding to containers
- **Error Information Control**: Prevents leakage of internal system details in error responses

### API Controller Architecture

**REST Endpoint Design Strategy**: The controller layer implements a **session-scoped API pattern** that ensures proper isolation and security:

**URL Structure Design**:

- **Session-Based Routing**: All tool operations are scoped to specific session IDs (`/sessions/:sessionId/tools/*`)
- **RESTful Operations**: Each tool maps to a distinct HTTP POST endpoint for operation clarity
- **Health Monitoring**: Dedicated GET endpoint for tool server health verification
- **Version Management**: API versioning support for future compatibility

**Security Integration Strategy**:

- **JWT Authentication**: All endpoints require valid JWT tokens through guard integration
- **User Context Injection**: Automatic user ID extraction from JWT for authorization
- **Input Validation**: Request body validation through NestJS pipe integration
- **Error Handling**: Structured error responses with appropriate HTTP status codes

**Request Processing Pattern**:

- **Parameter Extraction**: Session ID extracted from URL parameters
- **User Authentication**: User ID extracted from JWT token
- **Request Validation**: Input validation and sanitization
- **Service Delegation**: Business logic delegated to service layer
- **Response Formatting**: Consistent response structure across all endpoints

## Implementation Strategy

### Development Phases

**Phase 1: Container Infrastructure**

- **Tool Server Foundation**: Implement lightweight Express.js server within container template
- **Docker Integration**: Modify baseline template Dockerfile and entrypoint scripts
- **Process Management**: Establish dual-process architecture for main app and tool server
- **Security Framework**: Implement path validation and rate limiting infrastructure
- **Testing Infrastructure**: Create container-level testing suite for tool operations

**Phase 2: Server Integration Layer**

- **Type System**: Define comprehensive TypeScript interfaces for all tool operations
- **Service Layer**: Implement WorkspaceToolService with session management and HTTP client logic
- **API Layer**: Create REST controller with proper authentication and validation
- **Module Integration**: Integrate tool services into existing workspace module architecture
- **Error Handling**: Establish error handling patterns and logging infrastructure

**Phase 3: System Integration**

- **End-to-End Validation**: Complete request flow testing from API to container
- **Performance Optimization**: Load testing and performance tuning for tool operations
- **Security Hardening**: Comprehensive security testing and vulnerability assessment
- **Documentation**: API documentation and integration guides for AI agent developers

### Technical Considerations

**Performance Requirements**:

- **Response Time**: Tool operations should complete within 5-10 seconds for typical files
- **Concurrency**: Support multiple concurrent tool operations per session
- **Resource Usage**: Minimal impact on container performance and memory usage
- **Scalability**: Architecture supports horizontal scaling across multiple containers

**Security Framework**:

- **Defense in Depth**: Multiple security layers from API authentication to container isolation
- **Principle of Least Privilege**: Tool operations have minimal necessary permissions
- **Audit Trail**: Comprehensive logging for security monitoring and debugging
- **Future Extensibility**: Framework for adding command restrictions and policy controls

**Monitoring and Observability**:

- **Operation Metrics**: Track tool usage patterns, performance, and error rates
- **Health Monitoring**: Container tool server health checks and automatic recovery
- **Debug Capabilities**: Comprehensive logging for troubleshooting tool operations
- **Performance Insights**: Metrics collection for optimization and capacity planning

## API Interface Specification

### Endpoint Structure

The tool system exposes RESTful endpoints following the pattern:
`/api/v1/sessions/:sessionId/tools/{operation}`

**Available Operations**:

- `POST /search` - File discovery and pattern matching
- `POST /read` - Complete file content retrieval
- `POST /command` - Shell command execution
- `POST /edit` - Atomic file modification
- `GET /health` - Tool server health verification

### Authentication and Authorization

- **JWT Token Required**: All endpoints require valid authentication tokens
- **Session Ownership Validation**: Users can only access their own workspace sessions
- **Request Validation**: Input sanitization and validation on all operations
- **Error Response Standardization**: Consistent error format across all endpoints

## Future Enhancement Opportunities

**Post-MVP Capabilities**:

- **Command Policy Engine**: Configurable command restrictions and security policies
- **Operation Caching**: Result caching for frequently accessed files and search patterns
- **Streaming Operations**: Large file handling with streaming responses
- **WebSocket Integration**: Real-time operation status and progress updates
- **Audit and Analytics**: Comprehensive usage analytics and security audit trails

This tool interface system provides a robust, secure, and scalable foundation for AI-driven workspace interactions while maintaining clear separation of concerns and extensibility for future enhancements.
