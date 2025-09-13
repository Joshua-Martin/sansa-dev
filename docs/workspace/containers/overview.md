# New Container Architecture Overview

## Introduction

This document outlines the complete architectural migration from template-specific Docker images to a unified core container system with runtime template injection. This new architecture fundamentally changes how workspace containers are provisioned, managed, and extended while maintaining all existing functionality.

## Current System Problems

The existing system builds separate Docker images for each template, creating several inefficiencies:

**Resource Waste**: Each template duplicates the same Node.js runtime, system tools, and base dependencies in separate images.

**Slow Provisioning**: Creating workspace sessions requires pulling template-specific images and potentially building containers.

**Complex Template Management**: Adding or modifying templates requires Docker builds, image pushes, and registry management.

**Tool Integration Challenges**: The planned tool interface system would need to be duplicated across all template images.

**Maintenance Overhead**: Each template image needs individual updates, security patches, and dependency management.

## New Architecture Vision

### Core Container Foundation

**Single Pre-Built Image**: One `workspace-core:latest` image contains all necessary infrastructure for any workspace type.

**Tool System Integration**: The core container includes the complete tool interface system outlined in the workspace tools overview, providing search, read, command, and edit capabilities.

**Runtime Content Injection**: Templates and user content are injected into the running container rather than being built into images.

**Dual-Directory Structure**: Clear separation between system infrastructure (`/tools/`) and user workspace (`/app/`).

### Template as File Collections

**No More Docker Images**: Templates become simple collections of files without build processes.

**Instant Availability**: New templates are immediately usable without builds or deployments.

**Simplified Development**: Template creation requires only file management, no Docker expertise.

**Flexible Configuration**: Templates define their requirements through metadata files rather than Docker configurations.

## Architectural Components

### Core Container Image

**System Infrastructure**:

- Node.js 20 runtime with all necessary system tools
- Tool interface system running on port 3001
- Express.js server for tool operations
- WebSocket communication capabilities
- File system utilities for workspace management

**Type Safety Layer**:

- x21-container package with shared TypeScript types
- Communication interfaces between backend and container
- Validation utilities for tool operations
- Error handling and logging infrastructure

**User Workspace Environment**:

- Clean `/app/` directory for user code
- Development server capabilities on port 4321
- Package management and build tool support
- Archive extraction and creation utilities

### x21-container Package

**Purpose**: Provides type-safe communication between the NestJS backend and the container tool system.

**Location**: Container package at `workspace/x21-container/` (outside monorepo workspace).

**Key Features**:

- Exports necessary types from `@sansa-dev/shared` for container use
- Defines tool operation request and response interfaces
- Provides session management and identification types
- Includes validation utilities for request/response handling
- Enables WebSocket message type definitions

**Integration**: Built into the core container image during build time, providing full TypeScript support for all tool operations.

### Archive-Based Template System

**Template Archive Creation**: Template directories are compressed into tar.gz archives on the host filesystem.

**Process Flow**:

1. TemplateService creates archive from template directory on host
2. Archive is copied into container via Docker API
3. Container tool server extracts archive into `/app/` directory
4. npm install and development server startup follow extraction
5. Container is completely agnostic about template content

**Template Structure**: Templates remain as directories of files, but are processed into archives for injection, eliminating container filesystem access issues.

## System Integration

### Backend Service Changes

**SessionService Modifications**:

- Update container creation to use core image instead of template images
- Change image reference from template-specific to `workspace-core:latest`
- Maintain existing port allocation and resource management
- Preserve container security and networking configurations

**WorkspaceInitializerService Updates**:

- Replace TemplateService calls with archive-based template processing
- Handle both template archive extraction for new workspaces and saved archive restoration for existing workspaces
- Maintain existing error handling and logging patterns
- Ensure compatibility with current workspace creation flow

**Archive System Compatibility**:

- Existing workspace save/load functionality continues to work
- Archives target the `/app/` directory content
- Restoration process extracts archives to the user workspace directory
- Maintains existing exclusion patterns and file handling

### Template Migration Process

**Structure Conversion**:

- Remove Dockerfiles from all template directories
- Create template.json metadata files for each template
- Update package.json files to remove Docker-specific configurations
- Verify template file structures are compatible with injection

**Service Implementation**:

- Create TemplateInjectionService with file copying and dependency management
- Update existing services to use injection instead of image-based initialization
- Implement proper error handling for injection-specific failures
- Add logging and monitoring for injection operations

**Testing and Validation**:

- Verify all existing templates work with the new injection system
- Test archive save/load compatibility with injected templates
- Validate development server startup and HMR functionality
- Confirm tool system integration works correctly

## Workflow Changes

### Workspace Creation Process

**New Flow**:

1. Create container from pre-built `workspace-core:latest` image
2. Start container with tool system and infrastructure ready
3. Either extract template archive OR restore user archive to `/app/`
4. Execute npm install and start user development server
5. Workspace is ready for use with full tool capabilities

**Performance Benefits**:

- No Docker builds during workspace creation
- Faster container startup with pre-installed infrastructure
- Immediate template availability without image pulls
- Reduced resource usage with shared core image

### Template Development Workflow

**Simplified Process**:

1. Create template directory with source files
2. Add template.json metadata configuration
3. Template is immediately available for workspace creation
4. No build, push, or deployment steps required

**Development Benefits**:

- Instant template testing and iteration
- No Docker expertise required for template creation
- Direct file editing and debugging capabilities
- Simplified dependency management

### Tool System Integration

**Built-In Capabilities**:

- Search operations for file discovery within workspaces
- Read operations for file content access
- Command execution for development tool integration
- Edit operations for file modification and code generation

**Communication Layer**:

- Type-safe API between backend and container tools
- WebSocket support for real-time operations
- Standardized error handling and response formatting
- Session-based security and access control

## Migration Strategy

### Phase 1: Foundation Setup

1. Create x21-container package with initial type definitions
2. Build core container image with tool infrastructure
3. Update build scripts to create core image instead of template images
4. Test basic container creation and tool system functionality

### Phase 2: Template System Migration

1. Convert existing templates to file-based structure
2. Update TemplateService to create archives from template directories
3. Update container tool server to handle archive extraction operations
4. Test template archive creation and container extraction flow

### Phase 3: Service Integration

1. Modify SessionService and related services for core container usage
2. Ensure archive system compatibility with new structure
3. Update error handling and logging for new architecture
4. Perform end-to-end testing of workspace lifecycle

### Phase 4: Tool System Activation

1. Implement tool server within core container
2. Add tool operation handlers and WebSocket communication
3. Test tool functionality with backend integration
4. Validate complete workspace and tool system operation

## Benefits and Impact

### Performance Improvements

- **Faster Workspace Creation**: Elimination of Docker builds reduces provisioning time by 50% or more
- **Resource Efficiency**: Single cached image serves all workspace types
- **Reduced Network Usage**: No template-specific image downloads required
- **Better Caching**: Core infrastructure cached once, reused for all sessions

### Development Experience

- **Simplified Template Creation**: No Docker knowledge required for template development
- **Instant Template Updates**: Template changes available immediately without builds
- **Better Debugging**: Direct file access within containers for troubleshooting
- **Reduced Complexity**: Fewer moving parts in the overall system architecture

### System Scalability

- **Extensible Tool System**: Foundation for additional workspace capabilities
- **Consistent Environment**: Same tool versions and infrastructure across all workspaces
- **Easier Maintenance**: Single image to update for infrastructure improvements
- **Future-Proof Architecture**: Supports planned features and enhancements

## Backwards Compatibility Notice

**Important**: This migration does NOT maintain backwards compatibility with the existing template-based Docker system. The new architecture represents a fundamental change in workspace provisioning and management.

**Impact**:

- Existing workspace sessions using old template images will continue to function until terminated
- New workspace sessions will use the new core container and injection system
- Saved workspace archives remain compatible due to file-based storage approach
- Template developers must migrate their templates to the new file-based structure

**Migration Priority**: The focus is on implementing the new system correctly rather than maintaining compatibility with the old approach. This allows for cleaner implementation, better performance, and improved maintainability.

## Success Metrics

### Technical Metrics

- Core container image builds successfully with all dependencies
- Template injection completes within acceptable time limits
- All existing templates work with the new injection system
- Tool system provides full functionality as specified in the tools overview
- Archive save/load maintains existing functionality

### Performance Metrics

- Workspace creation time reduced by at least 50%
- Container image size optimized for efficient caching
- Tool operations respond within acceptable latency limits
- Resource usage per workspace comparable or improved
- System can handle increased concurrent workspace sessions

### Developer Experience Metrics

- Template creation process simplified and documented
- New template development requires no Docker expertise
- Template testing and iteration cycle significantly faster
- System debugging and troubleshooting improved with direct file access
- Overall system complexity reduced for maintenance and development
