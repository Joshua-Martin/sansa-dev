# Starting Point Implementation Plan

## Overview

The goal of this "starting point" build is to establish the foundational workspace infrastructure that allows users to immediately see a live, HMR-enabled preview of a baseline landing page when they navigate to the builder page. This creates the core preview experience without any AI functionality - just the ability to spin up isolated user workspaces with hot module replacement and display them in the frontend iframe.

The system will work as follows:

1. User navigates to `/builder` page in the frontend
2. Frontend triggers backend to create a new preview session
3. Backend spins up a Docker container with a pre-built Astro landing page template
4. Container runs Astro dev server with HMR enabled
5. Frontend iframe connects to the container's dev server URL
6. User sees live preview with working hot reload capabilities

This establishes the container orchestration, workspace management, and preview infrastructure that will later support AI-driven file modifications.

## New Files to Add

### Backend Infrastructure

#### `/packages/nest/src/modules/workspace/workspace.module.ts`

Module that handles all workspace and preview session functionality. Imports Docker service, file management service, and WebSocket gateway for HMR events. Exports workspace service and controller for use by other modules. Configures TypeORM entities for workspace persistence.

#### `/packages/nest/src/modules/workspace/workspace.service.ts`

Core service that orchestrates workspace lifecycle. Creates preview sessions by generating unique container names, pulling base template images, mounting project volumes, and starting containers with proper port allocation. Manages workspace cleanup, health monitoring, and resource quotas. Coordinates with Docker service for container operations and file service for template initialization.

#### `/packages/nest/src/modules/workspace/workspace.controller.ts`

REST API endpoints for workspace operations. Provides POST endpoint to create preview sessions, GET endpoint to check session status, DELETE endpoint for cleanup. Handles authentication and validates user permissions for workspace access. Returns preview URLs and session metadata to frontend.

#### `/packages/nest/src/modules/workspace/workspace.gateway.ts`

WebSocket gateway for real-time HMR communication. Manages socket connections per workspace session, forwards file change events from containers to frontend clients, handles container status updates, and manages connection lifecycle. Provides rooms-based broadcasting for session-specific events.

#### `/packages/nest/src/modules/workspace/entities/session.entity.ts`

TypeORM entity for persisting workspace session data. Stores session ID, user ID, container ID, preview URL, port allocation, status, creation/expiry timestamps, and resource allocation. Includes relationships to user entity and indexes for efficient querying by user and status.

#### `/packages/nest/src/modules/workspace/dto/create-workspace.dto.ts`

Data transfer objects for workspace API requests and responses. Defines request structure for creating sessions, response format with session details, status update payloads, and error responses. Includes validation decorators and API documentation annotations.

#### `/packages/nest/src/shared/services/docker.service.ts`

Docker integration service that provides programmatic container management. Must install `dockerode` package: `npm install dockerode @types/dockerode`. Service uses Docker socket at `/var/run/docker.sock` (requires privileged container). Key methods: `pullImage(imageName)`, `createContainer(options)`, `startContainer(containerId)`, `stopContainer(containerId)`. Container creation options must include port mapping `{ '4321/tcp': [{ HostPort: dynamicPort }] }`, volume mounts for workspace files, environment variables, and resource limits `{ Memory: 512 * 1024 * 1024, CpuShares: 512 }`. Implements proper error handling for Docker daemon connection failures and container operation timeouts.

#### `/packages/nest/src/shared/services/template.service.ts`

Template management service that handles baseline landing page setup. Manages template file operations, dependency installation, configuration generation, and workspace initialization. Must implement `initializeWorkspace(sessionId, templateName)` method that copies template files to container volume, runs `npm install` inside container, and verifies Astro dev server startup. Uses Docker exec API to run commands inside containers: `docker.getContainer(containerId).exec({ Cmd: ['npm', 'install'], AttachStdout: true })`. Handles file system operations through container volume mounts and ensures proper file permissions for Node.js processes.

### Shared Type Definitions

#### `/packages/shared/src/workspace/workspace.types.ts`

Comprehensive type definitions for workspace functionality. Defines WorkspaceSession interface with session metadata, ContainerSpec for Docker configuration, PreviewEnvironment for development settings, ResourceAllocation for limits, and WorkspaceStatus enumeration. Includes request/response types for API operations.

#### `/packages/shared/src/workspace/hmr.types.ts`

Hot module replacement type definitions for WebSocket communication. Defines HMREvent interface for file change notifications, ConnectionStatus for socket states, FileChangeEvent for specific file updates, and BuildStatus for container build states. Includes message payload structures for real-time updates.

### Frontend Integration

#### `/packages/frontend/src/lib/workspace/workspace.api.ts`

Frontend API client for workspace operations. Must use fetch API with proper error handling and TypeScript types from shared package. Key functions: `createWorkspace()` - POST to `/api/v1/workspace/create`, `getWorkspaceStatus(sessionId)` - GET to `/api/v1/workspace/${sessionId}/status`, `deleteWorkspace(sessionId)` - DELETE to `/api/v1/workspace/${sessionId}`. Include JWT token in Authorization header. Implement retry logic for network failures and timeout handling for slow container startup.

#### `/packages/frontend/src/lib/workspace/websocket.service.ts`

WebSocket client service for HMR communication. Must connect to workspace gateway at `ws://localhost:3000/workspace` with authentication token. Handle WebSocket events: `connection`, `disconnect`, `hmr-update`, `build-status`, `error`. Implement automatic reconnection with exponential backoff. Use EventEmitter or RxJS Subject for reactive event handling. Include connection state management and proper cleanup on disconnect.

#### `/packages/frontend/src/hooks/useWorkspace.ts`

React hook for workspace state management. Must use React state for loading, error, and session data. Implement useEffect for workspace creation on mount and cleanup on unmount. Return object with `{ workspace, isLoading, error, createWorkspace, deleteWorkspace }`. Include WebSocket integration for real-time status updates. Handle race conditions and prevent memory leaks with proper cleanup.

#### `/packages/frontend/src/components/workspace/workspace-preview.tsx`

Preview iframe component that displays workspace content. Must implement iframe with `src={workspace?.previewUrl}`, loading spinner during container startup, error boundary for failed loads. Include sandbox attributes: `sandbox="allow-scripts allow-same-origin allow-forms"` for security. Implement responsive sizing with CSS: `width: 100%, height: 100vh, border: none`. Handle iframe load events and error states with proper user feedback.

### Template Infrastructure

#### `/workspace-templates/baseline-landing/package.json`

Package configuration for baseline Astro template. Must include exact versions: `"astro": "^4.0.0"`, `"@astrojs/tailwind": "^5.0.0"`, `"tailwindcss": "^3.4.0"`, `"@astrojs/node": "^8.0.0"`. Scripts section needs `"dev": "astro dev --host 0.0.0.0 --port 4321"`, `"build": "astro build"`, `"preview": "astro preview --host 0.0.0.0"`. The host 0.0.0.0 binding is critical for container accessibility from host machine.

#### `/workspace-templates/baseline-landing/astro.config.mjs`

Astro configuration for development mode. Must export config with `server: { host: '0.0.0.0', port: 4321 }` for container networking. Include `integrations: [tailwind()]` for styling. Set `output: 'static'` for build mode. Configure `vite: { server: { hmr: { port: 4321 } } }` to ensure HMR works through container port mapping. Include `devToolbar: { enabled: false }` to prevent toolbar issues in iframe.

#### `/workspace-templates/baseline-landing/src/pages/index.astro`

Main landing page template with professional design. Must import Layout component: `import Layout from '../layouts/Layout.astro'`. Include complete HTML structure with hero section using Tailwind classes like `bg-gradient-to-r from-blue-600 to-purple-600`, features grid with `grid grid-cols-1 md:grid-cols-3 gap-8`, and responsive typography with `text-4xl md:text-6xl font-bold`. Include interactive elements to test HMR functionality.

#### `/workspace-templates/baseline-landing/src/layouts/Layout.astro`

Base layout component accepting `title` prop. Must include `<html lang="en">`, proper meta tags including viewport, and Tailwind CSS import. Structure: `<head>` with meta tags, `<body>` with slot for page content. Include `<meta name="viewport" content="width=device-width, initial-scale=1.0">` for mobile responsiveness. Add `<link rel="preconnect" href="https://fonts.googleapis.com">` for font optimization.

#### `/workspace-templates/baseline-landing/tailwind.config.mjs`

Tailwind configuration using `export default` syntax. Must include `content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}']` to scan all template files. Define custom theme extensions for brand colors, typography scale, and spacing. Include `plugins: []` array for future plugin additions. Set `darkMode: 'class'` for dark mode support.

#### `/workspace-templates/baseline-landing/Dockerfile`

Multi-stage Dockerfile starting with `FROM node:20-alpine AS base`. Install dependencies stage: `WORKDIR /app`, `COPY package*.json ./`, `RUN npm ci --only=production`. Development stage: copy source files, expose port 4321, set user to node for security. Final CMD: `["npm", "run", "dev"]`. Include health check: `HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:4321/ || exit 1`.

### Template Setup Commands

#### Initial Template Creation

Developer must run these commands to create the baseline template:

```bash
# Create template directory
mkdir -p workspace-templates/baseline-landing
cd workspace-templates/baseline-landing

# Initialize Astro project
npm create astro@latest . -- --template minimal --typescript --no-install
npm install

# Add required integrations
npx astro add tailwind --yes
npm install @astrojs/node

# Create required directories
mkdir -p src/components src/layouts

# Build initial Docker image
docker build -t baseline-landing-template .
```

#### Container Registry Setup

After creating template, developer must build and push to local registry:

```bash
# Tag for local registry
docker tag baseline-landing-template localhost:5000/baseline-landing-template:latest

# Push to registry (requires registry service running)
docker push localhost:5000/baseline-landing-template:latest
```

#### Development Verification

Test template works in container environment:

```bash
# Run container locally to verify
docker run -p 4321:4321 baseline-landing-template:latest

# Verify HMR works by editing files and checking browser updates
# Container should restart dev server on file changes
```

### Container Orchestration

#### `/.devcontainer/preview-template/docker-entrypoint.sh`

Container startup script for workspace initialization. Must be executable (`chmod +x`). Script sequence: check Node.js version, run `npm install` if node_modules missing, set proper file permissions with `chown -R node:node /app`, start Astro dev server with `npm run dev`. Include signal handling: `trap 'kill -TERM $PID' TERM INT` for graceful shutdown. Add logging: `echo "Starting Astro dev server..."` and error handling for failed startup.

#### `/.devcontainer/preview-template/healthcheck.js`

Health check script for container readiness monitoring. Must use Node.js http module to check `http://localhost:4321/` endpoint. Script should exit with code 0 for healthy, 1 for unhealthy. Include timeout handling (5 second max), retry logic, and proper error logging. Used by Docker HEALTHCHECK instruction and backend container monitoring.

### Required Infrastructure Setup

#### Docker Development Environment

Developer must update existing Docker setup to support container-in-container:

```bash
# Update .devcontainer/docker-compose.yml to add Docker socket mount
# Add to app service volumes:
- /var/run/docker.sock:/var/run/docker.sock

# Add MinIO for object storage simulation
# Add registry service for container images
# Add port range 8000-8100 for preview containers
```

#### Backend Dependencies

Install required packages in NestJS backend:

```bash
cd packages/nest
npm install dockerode @types/dockerode
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install socket.io
```

#### Database Schema Updates

Add workspace session table to database:

```bash
# Generate TypeORM migration
npm run migration:generate -- -n CreateWorkspaceSession

# Migration should create table with:
# - id (UUID primary key)
# - userId (UUID foreign key)
# - containerId (string)
# - previewUrl (string)
# - port (number)
# - status (enum)
# - createdAt, expiresAt (timestamps)
```

#### Frontend Dependencies

Install required packages in Next.js frontend:

```bash
cd packages/frontend
npm install socket.io-client
# WebSocket and workspace API integration already uses existing fetch/auth setup
```

## System Interactions

### Workspace Creation Flow

When frontend requests workspace creation, the workspace service generates a unique session identifier and container name using format `workspace-${userId}-${timestamp}`. Docker service pulls the baseline template image `localhost:5000/baseline-landing-template:latest` and creates container with specific options: port mapping from container 4321 to dynamic host port (8000-8100 range), volume mount for workspace files, environment variables for development mode. Template service initializes container by copying template files to volume, running `docker exec container npm install`, and waiting for health check to pass. Container starts with Astro dev server listening on allocated port. Backend returns preview URL format `http://localhost:${dynamicPort}` to frontend for iframe integration. Process includes error handling for port conflicts, container startup failures, and template initialization issues.

### Hot Module Replacement Flow

Container monitors file changes using Astro's built-in HMR system with Vite dev server. File change events automatically trigger browser refresh through WebSocket connection on port 4321. Backend workspace gateway listens for container status changes and forwards to frontend clients. Frontend receives HMR events through Socket.IO connection and updates iframe content without full page reload. Build errors and status updates flow through the same WebSocket connection for real-time feedback. Developer must ensure Astro config includes proper HMR settings and container networking allows WebSocket connections.

### Resource Management

Docker service implements resource quotas per container: 512MB memory limit, 0.5 CPU cores, 1GB storage limit. Workspace service tracks active sessions in database and implements automatic cleanup for expired sessions (default 2 hour timeout) or inactive sessions (30 minutes without activity). Container health monitoring runs every 30 seconds, detects failed containers, and triggers cleanup procedures. Port allocation service manages available ports in 8000-8100 range, prevents conflicts with port locking mechanism, and releases ports on session cleanup.

### Security and Isolation

Each workspace runs in isolated Docker container with restricted network access (no external internet), resource limits enforced by Docker, and read-only file system except for workspace directory. Container volumes are scoped to individual sessions using unique volume names preventing cross-user access. Preview URLs are only accessible from frontend domain (CORS restrictions), include session validation, and expire with session lifecycle. WebSocket connections require JWT authentication and are scoped to user sessions with proper authorization checks.

### Database Persistence

Workspace sessions are persisted in PostgreSQL using TypeORM entity with fields: id (UUID), userId (foreign key), containerId (string), previewUrl (string), port (number), status (enum: creating/running/stopping/stopped/error), createdAt/expiresAt (timestamps), resourceAllocation (JSON). Database includes indexes on userId and status for efficient querying. Session cleanup includes container termination, database record deletion, port release, and volume cleanup.

### Frontend Integration

Builder page component uses useWorkspace hook to initialize workspace on mount, displays loading spinner during container startup (typically 30-60 seconds), and shows error states for failed initialization. Preview iframe component handles URL updates when workspace is ready, implements loading states with progress indicators, and includes error boundaries for iframe failures. WebSocket integration provides real-time status updates and HMR events using Socket.IO client. Proper cleanup on component unmount prevents resource leaks by calling deleteWorkspace API and closing WebSocket connections.

### Development Testing Workflow

Developer should test complete flow: navigate to builder page, verify workspace creation API call, check container startup in Docker logs, confirm Astro dev server accessibility at preview URL, test HMR by editing template files, verify WebSocket events in browser dev tools, and confirm proper cleanup when leaving page. Include error testing: container startup failures, port conflicts, network issues, and resource exhaustion scenarios.

This implementation provides the foundational workspace infrastructure needed for the AI landing page builder, establishing container orchestration, preview functionality, and real-time updates that will support future AI-driven modifications.

## Implementation Status

### Completed Components

The following components have been successfully implemented and are ready for integration:

#### Shared Type System

- **Workspace Types** (`packages/shared/src/workspace/workspace.types.ts`): Core workspace session management types including WorkspaceSession, ResourceAllocation, PreviewEnvironment, and API request/response types
- **HMR Types** (`packages/shared/src/workspace/hmr.types.ts`): Hot Module Replacement WebSocket communication types for real-time file change events and build notifications
- **Container Types** (`packages/shared/src/workspace/container.types.ts`): Docker container orchestration types including ContainerInfo, ContainerStats, and creation options
- **Template Types** (`packages/shared/src/workspace/template.types.ts`): Template definition and initialization types for workspace setup

#### Backend Infrastructure

- **Workspace Module** (`packages/nest/src/modules/workspace/workspace.module.ts`): Complete NestJS module with TypeORM integration and service dependencies
- **Workspace Service** (`packages/nest/src/modules/workspace/workspace.service.ts`): Core orchestration service handling container lifecycle, port allocation, resource management, and session cleanup
- **Workspace Controller** (`packages/nest/src/modules/workspace/workspace.controller.ts`): REST API endpoints for workspace CRUD operations with proper authentication and validation
- **Workspace Gateway** (`packages/nest/src/modules/workspace/workspace.gateway.ts`): WebSocket gateway for real-time HMR communication with session-based broadcasting
- **Database Entity** (`packages/nest/src/modules/workspace/entities/session.entity.ts`): TypeORM entity for workspace session persistence with proper indexing
- **Docker Service** (`packages/nest/src/shared/services/docker.service.ts`): Complete Docker integration service with container management, health monitoring, and metrics collection
- **Template Service** (`packages/nest/src/shared/services/template.service.ts`): Template initialization service with dependency installation and development server verification
- **WebSocket JWT Guard** (`packages/nest/src/shared/guards/ws-jwt.guard.ts`): Authentication guard for WebSocket connections

#### Frontend Integration

- **Workspace API Client** (`packages/frontend/src/lib/workspace/workspace.api.ts`): Complete API client with authentication, retry logic, and error handling
- **WebSocket Service** (`packages/frontend/src/lib/workspace/websocket.service.ts`): WebSocket client for HMR communication with automatic reconnection and event management
- **useWorkspace Hook** (`packages/frontend/src/hooks/useWorkspace.ts`): React hook for workspace state management with lifecycle handling and real-time updates
- **Workspace Preview Component** (`packages/frontend/src/components/workspace/workspace-preview.tsx`): Responsive preview component with device simulation, loading states, and error handling
- **Builder Page Integration** (`packages/frontend/src/app/(app)/builder/page.tsx`): Updated builder page to use workspace functionality with automatic session creation and cleanup

#### System Integration

- **Module Registration**: Workspace module properly integrated into main application module
- **Package Dependencies**: Docker integration packages (dockerode, @types/dockerode) installed in backend
- **Type Safety**: All components use strict TypeScript with shared types, no `any` types or type assertions

### Remaining Implementation Tasks

The following components still need to be implemented to complete the starting point build:

#### Template Infrastructure Setup

- **Astro Project Initialization**: Use Astro CLI to create the baseline landing page template instead of manual file creation
  ```bash
  # Create template directory and initialize with Astro CLI
  mkdir -p workspace-templates/baseline-landing
  cd workspace-templates/baseline-landing
  npm create astro@latest . -- --template minimal --typescript --no-install
  ```
- **Template Customization**: After CLI initialization, customize the generated template for container deployment
- **Docker Image Building**: Create Dockerfile and build process for the baseline template
- **Container Registry Setup**: Configure local registry and push baseline template image

#### Docker Development Environment Updates

- **Container-in-Container Support**: Update docker-compose.yml to enable Docker socket mounting and privileged mode
- **MinIO Integration**: Add MinIO service for object storage simulation
- **Container Registry**: Add local Docker registry service for template images
- **Port Range Allocation**: Configure port range 8000-8100 for preview containers
- **Resource Monitoring**: Add cAdvisor for container resource monitoring

#### Database Schema Implementation

- **Migration Generation**: Create TypeORM migration for workspace_sessions table
- **Database Updates**: Run migrations to create required database schema
- **Index Optimization**: Ensure proper indexing for workspace queries

#### Development Environment Verification

- **End-to-End Testing**: Verify complete workflow from builder page load to live preview
- **Container Lifecycle**: Test container creation, initialization, and cleanup processes
- **WebSocket Communication**: Verify real-time HMR events and status updates
- **Error Handling**: Test error scenarios and recovery mechanisms

#### Production Readiness

- **Environment Configuration**: Set up proper environment variables for Docker socket paths and registry endpoints
- **Security Hardening**: Implement container security policies and resource limits
- **Monitoring Integration**: Add logging and metrics collection for workspace operations
- **Cleanup Automation**: Implement scheduled cleanup of expired workspace sessions

### Next Steps Priority Order

1. **Initialize Astro Template**: Use CLI to create baseline landing page template with proper Astro configuration
2. **Docker Environment Setup**: Update development container configuration for container-in-container support
3. **Database Migration**: Create and run workspace session table migration
4. **Template Docker Image**: Build and register baseline template Docker image
5. **Integration Testing**: Verify end-to-end workspace creation and preview functionality

The core infrastructure is complete and ready for template integration. The remaining tasks focus on template creation, environment setup, and system verification rather than additional code development.
