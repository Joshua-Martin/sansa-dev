# Workspace Management System Overview

## System Architecture

The Workspace Management System is a comprehensive platform that provides isolated, containerized development environments with real-time collaboration features. It consists of multiple interconnected components across frontend, backend, and infrastructure layers.

## Core Components

### 1. Backend Services (NestJS)

#### Workspace Service (`workspace.service.ts`)

The central service orchestrating workspace lifecycle management:

- **Creation**: Generates unique container names and allocates ports within configured ranges (8000-8100)
- **Lifecycle**: Manages workspace states (creating → initializing → running → stopping → stopped)
- **Resource Management**: Handles CPU, memory, and storage allocation with configurable defaults
- **Template Integration**: Initializes workspaces using predefined templates
- **Error Handling**: Comprehensive error boundaries with graceful degradation

#### Session Activity Manager (`session-activity-manager.service.ts`)

Intelligent activity tracking and cleanup system:

- **Connection Monitoring**: Tracks WebSocket connections per session in real-time
- **Activity Levels**: Classifies user engagement (active, idle, background, disconnected)
- **Timeout Management**: Progressive timeouts based on activity levels (2min active → 10min idle → 30min background)
- **Grace Periods**: 30-second reconnection windows for disconnected sessions
- **Health Checks**: Connection quality assessment (stable, unstable, poor)

#### Activity-Based Cleanup Processor (`activity-based-cleanup.processor.ts`)

Event-driven cleanup system replacing traditional cron jobs:

- **Smart Cleanup**: Only terminates containers when truly inactive
- **Health Monitoring**: Validates container health before cleanup
- **Orphaned Session Handling**: Cleans up sessions without active connections
- **Error Recovery**: Comprehensive error handling with detailed logging

#### WebSocket Gateway (`workspace.gateway.ts`)

Real-time communication hub:

- **Session Rooms**: Socket.io rooms for session-specific broadcasting
- **HMR Events**: Hot Module Replacement notifications for file changes
- **Activity Tracking**: Records user interactions and navigation events
- **Connection Management**: Handles authentication and session lifecycle
- **Broadcasting**: Container status, build updates, and workspace events

#### Queue System (`queue/`)

Background job processing infrastructure:

- **BullMQ Integration**: Redis-backed job queues for reliability
- **Cleanup Jobs**: Session cleanup, health checks, and maintenance tasks
- **Job Persistence**: Failed job retry logic with exponential backoff
- **Monitoring**: Queue health metrics and job status tracking

### 2. Database Layer

#### Workspace Session Entity (`workspace-session.entity.ts`)

Core database model with activity tracking:

```typescript
{
  id: UUID,
  userId: UUID,
  containerId?: string,
  status: WorkspaceStatus,
  activityLevel: ActivityLevel,
  lastActivityAt: Date,
  activeConnectionCount: number,
  gracePeriodEndsAt?: Date,
  connectionMetrics: ConnectionMetrics,
  // Resource and environment configuration
}
```

Key features:

- **Composite Indexing**: Optimized queries for user + status and activity level lookups
- **JSON Storage**: Flexible resource allocation and environment configuration
- **Activity Tracking**: Real-time connection and engagement metrics

### 3. Frontend Components

#### Workspace Hook (`useWorkspace.ts`)

React hook providing unified workspace management:

```typescript
const {
  workspace,
  status,
  isLoading,
  createWorkspace,
  deleteWorkspace,
  refreshStatus,
  subscribeToEvents,
} = useWorkspace();
```

Features:

- **State Management**: Unified state for workspace data and connection status
- **Automatic Polling**: Status updates with ETag-based caching
- **Error Handling**: Connection recovery and retry logic
- **Event Subscription**: Real-time HMR and status event handling

#### Preview Component (`workspace-preview.tsx`)

Interactive preview system:

- **Device Simulation**: Responsive viewport switching (desktop, tablet, mobile)
- **Loading States**: Progressive loading indicators during container startup
- **Error Boundaries**: Graceful error handling with retry mechanisms
- **Security**: Sandboxed iframe with proper CSP headers

#### WebSocket Service (`websocket.service.ts`)

Robust real-time communication:

- **Connection Resilience**: Automatic reconnection with exponential backoff
- **Authentication**: JWT-based WebSocket authentication
- **Circuit Breaker**: Prevents cascading failures during outages
- **Activity Events**: User interaction, file changes, and navigation tracking

### 4. Shared Type System

#### Core Types (`workspace.types.ts`)

Foundation type definitions:

- **WorkspaceSession**: Complete session state and configuration
- **ResourceAllocation**: CPU, memory, storage, and network constraints
- **PreviewEnvironment**: Node.js, build tools, and development configuration
- **ContainerMetrics**: Real-time resource usage statistics

#### Activity Types (`hmr.types.ts`)

Real-time interaction types:

- **ActivityEventType**: file-change, navigation, user-interaction, ping
- **HMREvent**: Hot reload notifications and build status updates
- **ConnectionState**: WebSocket connection lifecycle states

#### Container Types (`container.types.ts`)

Docker integration types:

- **ContainerInfo**: Docker API container metadata
- **DockerContainerConfig**: Creation specifications with resource limits
- **ContainerStats**: Detailed runtime statistics and monitoring

### 5. Infrastructure & Development

#### Docker Development Environment

Complete development stack via Docker Compose:

```yaml
services:
  app: # Main application container
  db: # PostgreSQL database
  redis: # Session storage and queues
  minio: # Object storage for files
  registry: # Container registry
  cadvisor: # Resource monitoring
```

#### DevContainer Configuration

VS Code integration with:

- **Pre-configured Extensions**: Docker, YAML, Git tools
- **Service Dependencies**: Automatic startup of all required services
- **Volume Management**: Node.js monorepo with separate package caches
- **Resource Allocation**: 4 CPUs, 8GB RAM for development

## System Flow

### 1. Workspace Creation

1. **API Request**: Frontend calls `POST /workspace/create`
2. **Validation**: User authentication and resource quota checks
3. **Container Creation**: Docker service creates isolated environment
4. **Template Application**: Initializes with selected template
5. **WebSocket Setup**: Establishes real-time communication channel
6. **Status Updates**: Progressive status notifications to frontend

### 2. Real-time Activity Tracking

1. **Connection Registration**: WebSocket service registers user connection
2. **Activity Events**: Frontend sends user interactions, file changes, navigation
3. **State Updates**: Activity manager updates session activity levels
4. **Timeout Management**: Progressive timeouts based on engagement levels
5. **Cleanup Decisions**: Intelligent cleanup when sessions become truly inactive

### 3. Hot Module Replacement

1. **File Changes**: Development server detects file modifications
2. **WebSocket Broadcast**: Gateway sends HMR events to connected clients
3. **Frontend Updates**: Preview iframe receives and applies changes
4. **State Preservation**: Maintains application state during hot reloads

### 4. Resource Cleanup

1. **Activity Monitoring**: Continuous tracking of user engagement
2. **Timeout Evaluation**: Progressive activity level assessment
3. **Grace Period**: 30-second window for reconnection
4. **Container Cleanup**: Safe shutdown and resource reclamation
5. **Database Updates**: Session status and metrics updates

## Key Features

### Intelligent Resource Management

- **Activity-Based Cleanup**: Only terminates truly inactive sessions
- **Progressive Timeouts**: 2min → 10min → 30min based on engagement
- **Grace Periods**: Reconnection windows prevent premature cleanup
- **Health Monitoring**: Container validation before cleanup

### Real-time Collaboration

- **WebSocket Gateway**: Bi-directional communication with authentication
- **Room-based Broadcasting**: Session-specific event distribution
- **Connection Resilience**: Automatic recovery from network issues
- **Activity Synchronization**: Real-time user presence and activity

### Scalable Architecture

- **Container Orchestration**: Docker-based isolation per workspace
- **Background Processing**: Redis-backed job queues for reliability
- **Resource Quotas**: Configurable CPU, memory, and storage limits
- **Port Management**: Dynamic port allocation within defined ranges

### Development Experience

- **Template System**: Pre-configured starting points for different project types
- **Hot Reloading**: Instant preview updates without full page refreshes
- **Device Preview**: Responsive testing across different viewport sizes
- **Error Recovery**: Comprehensive error handling with user-friendly messages

## Monitoring & Observability

### Queue Monitoring

- **Job Status**: Active, waiting, completed, failed job counts
- **Processing Metrics**: Average processing time and failure rates
- **Health Checks**: Queue connectivity and Redis integration status

### Connection Metrics

- **Activity Levels**: Distribution of active, idle, background sessions
- **Connection Quality**: Stable, unstable, poor connection classification
- **Session Duration**: Average session length and engagement patterns

### Resource Usage

- **Container Metrics**: CPU, memory, network usage per workspace
- **Port Utilization**: Active port allocation within configured ranges
- **Cleanup Effectiveness**: Successful cleanup operations and failure rates

## Security Considerations

### Authentication & Authorization

- **JWT Integration**: Token-based authentication for all operations
- **Session Isolation**: User-specific workspace access control
- **WebSocket Security**: Authenticated real-time communication channels

### Container Security

- **Resource Limits**: CPU, memory, and network bandwidth constraints
- **Network Isolation**: Restricted container network access
- **Image Security**: Trusted base images with regular updates

### Data Protection

- **Connection Encryption**: Secure WebSocket communication
- **Session Privacy**: Isolated user data and workspace environments
- **Audit Logging**: Comprehensive activity and access logging

## Future Enhancements

### Planned Features

1. **Advanced Templates**: More sophisticated initialization with custom configurations
2. **Collaborative Editing**: Multi-user workspace sharing and conflict resolution
3. **Resource Optimization**: Machine learning-based resource allocation
4. **Advanced Monitoring**: Detailed performance analytics and alerting
5. **Backup & Recovery**: Automated workspace snapshots and restoration

### Scalability Improvements

1. **Horizontal Scaling**: Load balancing across multiple container hosts
2. **Database Optimization**: Query optimization and connection pooling
3. **Caching Layer**: Redis-based caching for frequently accessed data
4. **CDN Integration**: Distributed asset delivery for improved performance

This overview provides a comprehensive reference for developers working with the Workspace Management System, covering all major components and their interactions across the full-stack architecture.
