# Workspace Container Communication Architecture

## Overview

The workspace system uses a hybrid approach for container communication:

- **Docker Commands**: Container lifecycle management (create, start, stop, remove, inspect)
- **HTTP API**: Operations inside running containers via tool server endpoints

This separation ensures proper security boundaries - the NestJS backend manages Docker containers as infrastructure, while all file operations, command execution, and workspace manipulation happens through secure HTTP APIs.

## Architecture Principles

### Docker Commands (Container Lifecycle)

- Used for: Container creation, starting, stopping, removal, inspection
- Security: Requires Docker socket access but limited to container management
- Scope: Host-level operations, container orchestration

### HTTP API (In-Container Operations)

- Used for: File operations, command execution, archive manipulation, workspace tools
- Security: Isolated to container boundaries, no host access
- Scope: Workspace-level operations inside containers

## Current Actions by Category

### 1. Docker Commands (Container Lifecycle) ✅ CORRECT

#### SessionService (`packages/nest/src/modules/workspace/services/session.service.ts`)

- **createContainer()** - Creates Docker containers with port mappings and environment
  - **How**: Calls Docker API to create container from workspace-core image
  - **Used by**: `initializeSessionAsync()` method during session creation
- **startContainer()** - Starts Docker containers
  - **How**: Calls Docker API to start created container
  - **Used by**: `initializeSessionAsync()` method after container creation
- **stopContainer()** - Stops running Docker containers
  - **How**: Calls Docker API to gracefully stop container
  - **Used by**: `deleteSession()`, cleanup operations
- **removeContainer()** - Removes Docker containers
  - **How**: Calls Docker API to delete container and free resources
  - **Used by**: `deleteSession()`, cleanup operations
- **getContainerInfo()** - Gets container metadata and status
  - **How**: Queries Docker API for container state, ports, etc.
  - **Used by**: Health checks, validation, recovery operations
- **getContainerMetrics()** - Gets container resource usage statistics
  - **How**: Queries Docker API for CPU, memory, network stats
  - **Used by**: `getSessionStatus()` for monitoring

#### ContainerRegistryService (`packages/nest/src/modules/workspace/services/container-registry.service.ts`)

- **getContainerInfo()** - Container discovery for registry recovery
  - **How**: Queries Docker API to validate container state during startup
  - **Used by**: `initializeFromDatabase()` for service recovery

#### WorkspaceInitializerService (`packages/nest/src/modules/workspace/services/workspace-initializer.service.ts`)

- **getContainerInfo()** - Container state validation before initialization
  - **How**: Queries Docker API to ensure container is running
  - **Used by**: `validateContainerState()` before workspace setup

#### TemplateService (`packages/nest/src/modules/workspace/services/templates/template.service.ts`)

- **getContainerInfo()** - Container state validation before template injection
  - **How**: Queries Docker API to ensure container is ready
  - **Used by**: `validateContainerState()` during template injection
- **Host-side Archive Creation** (spawnSync, fs operations) - Template archive creation
  - **How**: Uses host `tar` command and filesystem operations
  - **Used by**: `createTemplateArchive()` for template preparation

### 2. HTTP API (In-Container Operations)

#### Tool Server Endpoints ✅ CORRECTLY IMPLEMENTED

**ToolServerClient** (`packages/nest/src/modules/workspace/tool-server/tool-server-client.ts`)

- **makeHttpRequest()** - Direct HTTP communication with tool server
  - **How**: Uses `fetch()` to make HTTP requests to mapped tool server port
  - **Endpoints**: All tool server endpoints
  - **Used by**: All tool operations
  - **Response Handling**: Receives raw `ToolXResult` data from container, wraps in `ToolOperationResponse<ToolXResult>` structure

**Existing HTTP Endpoints:**

- `GET /health` - Health check ✅
  - **Handler**: `packages/x21-container/src/handlers/health.handler.ts`
  - **Returns**: Raw health data (no wrapper needed for simple health checks)
  - **Used by**: `SessionService.checkToolServerHealth()`, health monitoring
- `POST /tools/search` - File search operations ✅
  - **Handler**: `packages/x21-container/src/handlers/search.handler.ts`
  - **Returns**: `ToolSearchResult` (raw data), wrapped as `ToolSearchResponse` by NestJS client
  - **Used by**: AI agent file discovery tools
- `POST /tools/read` - File read operations ✅
  - **Handler**: `packages/x21-container/src/handlers/read.handler.ts`
  - **Returns**: `ToolReadResult` (raw data), wrapped as `ToolReadResponse` by NestJS client
  - **Used by**: AI agent file reading tools
- `POST /tools/command` - Generic command execution ✅
  - **Handler**: `packages/x21-container/src/handlers/command.handler.ts`
  - **Returns**: `ToolCommandResult` (raw data), wrapped as `ToolCommandResponse` by NestJS client
  - **Used by**: AI agent command execution tools
- `POST /tools/edit` - File edit operations ✅
  - **Handler**: `packages/x21-container/src/handlers/edit.handler.ts`
  - **Returns**: `ToolEditResult` (raw data), wrapped as `ToolEditResponse` by NestJS client
  - **Used by**: AI agent file editing tools
- `POST /api/archive/extract` - Extract archives ✅
  - **Handler**: `packages/x21-container/src/handlers/archive.handler.ts`
  - **Operation**: `packages/x21-container/src/operations/archive.operation.ts`
  - **Used by**: Template injection, workspace restoration
- `POST /api/npm/install` - NPM package installation ✅
  - **Handler**: `packages/x21-container/src/handlers/npm.handler.ts`
  - **Operation**: `packages/x21-container/src/operations/npm.operation.ts`
  - **Used by**: Template setup, dependency management
- `POST /api/dev-server/start` - Start development server ✅
  - **Handler**: `packages/x21-container/src/handlers/dev-server.handler.ts`
  - **Operation**: `packages/x21-container/src/operations/dev-server.operation.ts`
  - **Used by**: Template initialization, workspace startup
- `POST /api/dev-server/stop` - Stop development server ✅
  - **Handler**: `packages/x21-container/src/handlers/dev-server.handler.ts`
  - **Operation**: `packages/x21-container/src/operations/dev-server.operation.ts`
  - **Used by**: Cleanup operations, session shutdown
- `GET /api/dev-server/status` - Development server status ✅
  - **Handler**: `packages/x21-container/src/handlers/dev-server.handler.ts`
  - **Used by**: Status monitoring
- `POST /api/ports/allocate` - Port allocation ✅
  - **Handler**: `packages/x21-container/src/handlers/port.handler.ts`
  - **Operation**: `packages/x21-container/src/operations/port.operation.ts`
  - **Used by**: Dynamic port allocation for services
- `POST /api/cleanup` - Cleanup operations ✅
  - **Handler**: `packages/x21-container/src/handlers/cleanup.handler.ts`
  - **Operation**: `packages/x21-container/src/operations/cleanup.operation.ts`
  - **Used by**: Resource cleanup, temporary file removal

## To Do: Required Fixes and Missing Components

### 1. Incorrect Docker Command Usage ❌ NEEDS FIXING

#### WorkspaceArchiveService (`packages/nest/src/modules/workspace/services/workspace-archive.service.ts`)

**PROBLEM: `createWorkspaceArchive()` method**

```typescript
// CURRENT: Uses docker exec
const tarCommand = [
  'tar',
  '-czf',
  '/tmp/workspace.tar.gz',
  '-C',
  '/app',
  ...excludeArgs,
  '.',
];
const result = await this.dockerService.execCommand(containerId, tarCommand);
const archiveBuffer = await this.dockerService.copyFromContainer(
  containerId,
  '/tmp/workspace.tar.gz'
);
await this.dockerService.execCommand(containerId, [
  'rm',
  '-f',
  '/tmp/workspace.tar.gz',
]);
```

**SHOULD BE: HTTP API call**

```typescript
// NEW: HTTP request to create archive
const response = await this.toolServerClient.createArchive(connection, {
  sourcePath: '/app',
  excludePatterns: this.getExcludePatterns(),
});
const archiveBuffer = Buffer.from(response.archiveData, 'base64');
```

**PROBLEM: `extractWorkspaceArchive()` method**

```typescript
// CURRENT: Uses docker cp + docker exec
await this.dockerService.copyToContainer(
  containerId,
  archiveBuffer,
  '/tmp/workspace.tar.gz'
);
const extractCommand = ['tar', '-xzf', '/tmp/workspace.tar.gz', '-C', '/app'];
const result = await this.dockerService.execCommand(
  containerId,
  extractCommand
);
await this.dockerService.execCommand(containerId, ['npm', 'install']);
```

**SHOULD BE: HTTP API calls**

```typescript
// NEW: HTTP requests
await this.toolServerClient.uploadAndExtractArchive(connection, {
  archiveData: archiveBuffer.toString('base64'),
  targetPath: '/app',
});
await this.toolServerClient.runNpmInstall(connection, '/app');
```

#### TemplateService (`packages/nest/src/modules/workspace/services/templates/template.service.ts`)

**PROBLEM: `injectTemplateViaContainerTools()` method**

```typescript
// CURRENT: Uses docker cp
await this.dockerService.copyToContainer(
  containerId,
  templateArchive,
  archivePath
);
```

**SHOULD BE: HTTP API call**

```typescript
// NEW: HTTP upload and extract
await this.toolServerClient.uploadAndExtractArchive(connection, {
  archiveData: templateArchive.toString('base64'),
  targetPath: '/app',
});
```

#### ToolServerClient (`packages/nest/src/modules/workspace/tool-server/tool-server-client.ts`)

**PROBLEM: Using generic command endpoint instead of dedicated endpoints**

```typescript
// CURRENT: All operations use /tools/command
extractArchive(); // Uses generic command execution
runNpmInstall(); // Uses generic command execution
startDevServer(); // Uses generic command execution
// etc.
```

**SHOULD BE: Use dedicated endpoints**

```typescript
// NEW: Use specific API endpoints
extractArchive() → POST /api/archive/extract
runNpmInstall() → POST /api/npm/install
startDevServer() → POST /api/dev-server/start
stopDevServer() → POST /api/dev-server/stop
getAvailablePort() → POST /api/ports/allocate
cleanup() → POST /api/cleanup
```

### 2. Missing Container Tool Server Endpoints ❌ NEED TO ADD

#### Missing Archive Creation Endpoint

**Endpoint**: `POST /api/archive/create`
**Purpose**: Create archive from workspace files and return as base64
**Request**:

```typescript
{
  sourcePath: string;      // Default: '/app'
  excludePatterns: string[]; // Files/dirs to exclude
}
```

**Response**:

```typescript
{
  success: boolean;
  data: {
    archiveData: string;   // Base64 encoded archive
    archiveSize: number;   // Size in bytes
    filesArchived: number; // Number of files included
    duration: number;      // Operation time in ms
  };
  error?: string;
}
```

**Files to create**:

- `packages/x21-container/src/handlers/archive-create.handler.ts`
- `packages/x21-container/src/operations/archive-create.operation.ts`
- Update `packages/x21-container/src/handlers/index.ts` to add route

#### Missing Archive Upload Endpoint

**Endpoint**: `POST /api/archive/upload`
**Purpose**: Upload and extract archive to workspace
**Request**:

```typescript
{
  archiveData: string;     // Base64 encoded archive
  targetPath: string;      // Default: '/app'
  cleanTarget?: boolean;   // Clean target before extract
}
```

**Response**:

```typescript
{
  success: boolean;
  data: {
    filesExtracted: number;
    targetPath: string;
    duration: number;
    archiveSize: number;
  };
  error?: string;
}
```

**Files to create**:

- `packages/x21-container/src/handlers/archive-upload.handler.ts`
- `packages/x21-container/src/operations/archive-upload.operation.ts`
- Update `packages/x21-container/src/handlers/index.ts` to add route

### 3. Missing NestJS Service Layer Methods ❌ NEED TO ADD

#### ToolServerClient additions needed

**File**: `packages/nest/src/modules/workspace/tool-server/tool-server-client.ts`

**Missing Methods**:

```typescript
async createArchive(
  connection: ContainerConnection,
  request: { sourcePath: string; excludePatterns: string[] }
): Promise<ArchiveCreateResult>

async uploadAndExtractArchive(
  connection: ContainerConnection,
  request: { archiveData: string; targetPath: string; cleanTarget?: boolean }
): Promise<ArchiveExtractResult>
```

#### ToolServerService additions needed

**File**: `packages/nest/src/modules/workspace/tool-server/tool-server.service.ts`

**Missing Methods**:

```typescript
async createArchive(
  connection: ContainerConnection,
  sourcePath: string = '/app',
  excludePatterns: string[] = []
): Promise<ArchiveCreateResult>

async uploadAndExtractArchive(
  connection: ContainerConnection,
  archiveData: string,
  targetPath: string = '/app',
  cleanTarget: boolean = false
): Promise<ArchiveExtractResult>
```

### 4. Implementation Priority

1. **High Priority**: Fix `WorkspaceArchiveService` - This affects save/load functionality
2. **High Priority**: Add missing container endpoints (`/api/archive/create`, `/api/archive/upload`)
3. **Medium Priority**: Fix `TemplateService` docker cp usage
4. **Low Priority**: Update `ToolServerClient` to use dedicated endpoints instead of generic commands

### 5. Security Benefits

After these changes:

- ✅ No more `docker exec` commands for file operations
- ✅ No more `docker cp` operations for file transfers
- ✅ All container operations use HTTP API with proper boundaries
- ✅ Reduced attack surface - no arbitrary command execution
- ✅ Better logging and error handling through HTTP responses
- ✅ Consistent API patterns for all container operations
