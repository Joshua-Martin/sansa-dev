# Core Container Architecture & x21-container Package

## Overview

The core container architecture replaces the current template-specific Docker images with a single, pre-built container image that includes all necessary infrastructure. This container serves as the foundation for all workspace sessions and includes the tool interface system outlined in the workspace tools overview.

## Goals

### Primary Objectives

1. **Eliminate Template Image Redundancy**: Replace multiple template-specific Docker images with one core image
2. **Enable Tool Infrastructure**: Provide a standardized container with all tool capabilities pre-installed
3. **Improve Performance**: Faster workspace provisioning through pre-built infrastructure
4. **Reduce Complexity**: Simplify template management by separating runtime from content
5. **Support Future Features**: Create extensible foundation for additional workspace capabilities

### Key Benefits

- **Lightning Fast Provisioning**: No Docker builds during workspace creation
- **Consistent Environment**: Same tool versions and infrastructure across all workspaces
- **Resource Efficiency**: One cached image spawns many containers
- **Type Safety**: Shared types between backend and container for tool communication

## Architecture Design

### Container Structure

The core container image contains two primary directories:

**Tool Infrastructure Directory (`/tools/`)**:

- Pre-installed tool system with all dependencies
- Express.js server running on port 3001 for tool operations
- x21-container package with shared TypeScript types
- WebSocket communication capabilities
- File system operation utilities

**User Workspace Directory (`/app/`)**:

- Empty directory where user code will be injected
- Template files or restored archives are placed here
- User's development server runs from this location on port 4321
- All user modifications and saves occur within this directory

### x21-container Package

The x21-container package provides type safety and shared interfaces between the backend services and the container tool system.

**Package Location**: `workspace/x21-container/`

**Purpose**:

- Export necessary types from the shared package for container use
- Define container-specific tool operation interfaces
- Provide validation utilities for tool requests and responses
- Enable type-safe communication between backend and container

**Key Components**:

- Tool request and response type definitions
- Session management types for container identification
- Error handling interfaces for consistent error reporting
- WebSocket message types for real-time communication
- Container status and metrics reporting types

**Dependencies**:

- Depends on `@sansa-dev/shared` workspace package for core types
- Includes Express.js and related dependencies for tool server
- Contains validation libraries for request/response handling

## Implementation Requirements

### Package Creation

Create the x21-container package in the monorepo workspace:

**File Structure**:

```
workspace/x21-container/
├── package.json (with workspace dependencies)
├── tsconfig.json (TypeScript configuration)
├── src/
│   ├── index.ts (main exports)
│   ├── tools/ (tool-specific types)
│   ├── session/ (session management types)
│   └── utils/ (validation utilities)
└── README.md (package documentation)
```

**Workspace Integration**:

- The x21-container is now located at `workspace/x21-container` (not part of monorepo workspace)
- Configure as workspace dependency in package.json
- Set up proper TypeScript path mapping for imports

### Core Container Image Build Process

**Build Script Modification**:

- Replace `build-templates.sh` with `build-core-container.sh`
- Build single core image instead of multiple template images
- Include x21-container package and dependencies in image
- Push to local registry as `localhost:5100/workspace-core:latest`

**Dockerfile Structure**:

- Start from Node.js 20 Alpine base image
- Install system dependencies (curl, tar, gzip)
- Copy and install x21-container package with dependencies
- Set up tool infrastructure in `/tools/` directory
- Create empty `/app/` directory with proper permissions
- Configure dual-port exposure (3001 for tools, 4321 for user app)
- Set up startup script for tool server initialization

### Backend Service Integration

**Session Service Changes**:

- Modify `SessionService.initializeSessionAsync()` method
- Change container image reference from template-specific to core image
- Update container creation to use `workspace-core:latest`
- Maintain existing port allocation and resource management

**Archive-Based Template System**:

- Templates are created as tar.gz archives on the host filesystem
- Archives are copied into containers via Docker API
- Container tool server extracts archives into `/app/` directory
- Dependency installation and development server startup follow extraction

**Archive Compatibility**:

- Ensure existing archive save/load system works with new structure
- Archive creation targets `/app/` directory content
- Archive restoration extracts to `/app/` directory
- Maintain existing exclusion patterns for node_modules, dist, etc.

## Migration Strategy

### Phase 1: Package and Image Setup

1. Create x21-container package with initial type definitions
2. Build core container image with tool infrastructure
3. Update build scripts and registry configuration
4. Test core container creation and basic functionality

### Phase 2: Backend Integration

1. Update TemplateService to create archives on host filesystem
2. Modify SessionService to use core image instead of template images
3. Update container tool server to handle `extract-archive` operations
4. Ensure archive system compatibility with new structure

### Phase 3: Template Migration

1. Convert existing templates from Docker projects to file collections
2. Remove Dockerfiles from template directories
3. Update container tool server with new archive extraction logic
4. Test template archive creation and container extraction flow

### Phase 4: Tool System Integration

1. Implement tool server within core container
2. Add tool operation handlers for search, read, command, edit
3. Set up WebSocket communication with backend
4. Test end-to-end tool functionality

## Backwards Compatibility

**Important Note**: Backwards compatibility is NOT a priority for this migration. The new architecture represents a fundamental change in how workspaces are provisioned and managed. Existing workspace sessions may need to be recreated, and any saved archives should be compatible due to the file-based storage approach, but the container infrastructure will be completely replaced.

The focus should be on implementing the new system correctly rather than maintaining compatibility with the old template-based approach. This allows for cleaner implementation and better long-term maintainability.

## Success Criteria

### Functional Requirements

- Core container image builds successfully with all dependencies
- Template injection works for all existing templates
- Archive save/load maintains existing functionality
- Tool system provides all four core operations (search, read, command, edit)
- Workspace provisioning time improves significantly

### Technical Requirements

- Single core image replaces all template-specific images
- x21-container package provides full type safety
- No Docker builds occur during workspace provisioning
- All existing API endpoints continue to function
- WebSocket communication works for tool operations

### Performance Requirements

- Workspace creation time reduced by at least 50%
- Container image size optimized for caching efficiency
- Tool operations respond within acceptable latency limits
- Resource usage per workspace remains comparable or improved
