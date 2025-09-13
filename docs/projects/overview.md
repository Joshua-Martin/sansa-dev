# Projects System Implementation Plan

## Overview

The Projects System serves as the foundational organizational unit for the AI-powered landing page studio, providing users with the ability to create, manage, and organize their landing page projects. Each project represents a complete workspace containing associated chat threads, context items (brand assets, images, color palettes, product overviews), workspace sessions, and generated code files.

The system is designed around multi-tenant isolation, ensuring that all project data is securely scoped to the owning user while providing efficient access patterns for related resources. Projects act as the central hub that connects the chat/AI system, workspace management, context gathering, and file storage into a cohesive user experience.

Users can have multiple projects, but they will be restricted based on their plan (plan tracking etc will be outlined elsewhere and is not a concern of this document). A project is how we organize context, workspace (and the template), any saved code, and message threads (chats with the agent).

## Project Type Enhancement

### Current Project Type Analysis

The existing Project type in `packages/shared/src/project/index.ts` contains basic fields (id, userId, createdAt, updatedAt) but lacks essential metadata for a complete project management system.

### Enhanced Project Type Structure

The Project type will be expanded to include:

**Core Metadata Fields:**

- `name`: Human-readable project name for identification and organization
- `description`: Optional detailed description of the project's purpose
- `status`: Project lifecycle status ('draft', 'active', 'archived', 'deleted') for filtering and management
- `templateId`: Reference to the base template used for workspace initialization
- `lastAccessedAt`: Timestamp tracking when the project was last opened, used for sorting and cleanup

**Context Integration Fields:**

- `hasContext`: Boolean flag indicating whether context items have been configured
- `contextLastUpdatedAt`: Timestamp of the most recent context modification for cache invalidation

**Workspace Integration Fields:**

- `activeWorkspaceId`: Reference to the currently active workspace session, ensuring single workspace per project
- `workspaceLastCreatedAt`: Timestamp of the most recent workspace creation for session management

**Chat Integration Fields:**

- `activeThreadId`: Reference to the primary chat thread for quick access
- `threadCount`: Cached count of associated chat threads for performance
- `lastMessageAt`: Timestamp of the most recent chat activity for sorting

## Database Entity Design

### Project Entity Structure

**Location:** `packages/nest/src/shared/database/entities/project.entity.ts`

The Project entity will establish relationships with existing entities through foreign key constraints and TypeORM decorators:

**Primary Fields:**

- UUID primary key with automatic generation
- User relationship via foreign key with cascade delete for data cleanup
- Indexed fields for common query patterns (userId, status, lastAccessedAt)
- JSON metadata field for extensible project-specific configuration

**Relationship Mappings:**

- **User Relationship:** Many-to-one with User entity, ensuring ownership validation
- **LLM Threads:** One-to-many relationship enabling project-scoped chat history
- **Workspace Sessions:** One-to-many relationship for workspace lifecycle management
- **Context Items:** Implicit relationship through workspaceId foreign keys in context entities

**Indexing Strategy:**

- Composite index on (userId, status) for efficient project listing queries
- Individual indexes on lastAccessedAt and createdAt for sorting operations
- Index on activeWorkspaceId for workspace lookup operations

### Context Entity Modifications

**Affected Files:**

- `packages/nest/src/shared/database/entities/brand-image.entity.ts` (new file)
- `packages/nest/src/shared/database/entities/brand-asset.entity.ts` (new file)
- `packages/nest/src/shared/database/entities/color-palette.entity.ts` (new file)
- `packages/nest/src/shared/database/entities/product-overview.entity.ts` (new file)

Each context entity will include:

- `workspaceId` foreign key column with UUID type and indexing
- Many-to-one relationship with Project entity
- Cascade delete behavior to maintain data integrity
- User ownership validation through project relationship

### LLM Thread Entity Modifications

**File:** `packages/nest/src/shared/database/entities/llm-thread.entity.ts`

**Required Changes:**

- Add `workspaceId` column as nullable UUID foreign key (nullable for backward compatibility)
- Add many-to-one relationship with Project entity
- Create composite index on (workspaceId, userId, status) for efficient project-scoped queries
- Update existing queries to include project scoping where applicable

### Workspace Session Entity Integration

**File:** `packages/nest/src/modules/workspace/entities/session.entity.ts`

The entity already contains a `workspaceId` field but requires relationship enhancement:

- Add many-to-one relationship with Project entity
- Implement validation logic to ensure single active workspace per project
- Add business logic methods for project-workspace coordination

## Project CRUD Service Implementation

### Service Structure

**Location:** `packages/nest/src/shared/database/services/project.service.ts`

The ProjectService will follow established patterns from existing services (LLMThreadService, UserService) while providing project-specific business logic:

**Core CRUD Operations:**

- **Create Project:** Generate new project with default settings, create initial workspace template
- **Find Projects:** Retrieve user's projects with filtering, sorting, and pagination support
- **Update Project:** Modify project metadata with validation and conflict resolution
- **Delete Project:** Soft delete with cleanup of associated resources (threads, workspace sessions, context items)

**Advanced Query Methods:**

- **Find with Context Summary:** Retrieve projects with aggregated context item counts
- **Find with Active Workspace:** Join with workspace sessions to include active workspace information
- **Find Recently Accessed:** Sort by lastAccessedAt for dashboard display
- **Count by Status:** Aggregate project counts for user dashboard statistics

**Business Logic Methods:**

- **Activate Project:** Set project as active, manage workspace session lifecycle
- **Archive Project:** Transition project to archived state, cleanup active resources
- **Validate Ownership:** Ensure user has permission to access/modify project
- **Update Activity Timestamps:** Maintain lastAccessedAt and related metadata

**Integration Helper Methods:**

- **Sync Context Status:** Update hasContext flag based on associated context items
- **Update Thread Metadata:** Maintain threadCount and lastMessageAt from associated threads
- **Cleanup Orphaned Resources:** Remove dangling workspace sessions and context items

### Repository Patterns

The service will utilize TypeORM Repository patterns with:

- Query builders for complex filtering and joining operations
- Transaction support for multi-entity operations (project creation with initial context)
- Optimistic locking for concurrent modification handling
- Soft delete implementation with status-based filtering

## API Endpoint Design

### Project Controller Structure

**Location:** `packages/nest/src/modules/projects/project.controller.ts`

**Authentication & Authorization:**

- All endpoints protected with JWT authentication guard
- User ID extracted from JWT token for ownership validation
- Project access validated through service layer authorization checks

### Core API Endpoints

**POST /api/projects**

- **Purpose:** Create new project with optional initial configuration
- **Request Body:** Project name, description, template ID, initial context data
- **Response:** Complete project object with generated IDs and timestamps
- **Business Logic:** Generate unique project name if conflicts exist, initialize default workspace template, create initial context placeholders

**GET /api/projects**

- **Purpose:** Retrieve user's projects with filtering and pagination
- **Query Parameters:** Status filter, search term, sort order, pagination limits
- **Response:** Paginated project list with context summaries and workspace status
- **Business Logic:** Apply user-scoped filtering, include aggregated metadata (thread count, context item counts), sort by recent activity

**GET /api/projects/:workspaceId**

- **Purpose:** Retrieve detailed project information with related data
- **Path Parameters:** Project UUID
- **Query Parameters:** Include options (context, threads, workspace)
- **Response:** Complete project object with optional related data
- **Business Logic:** Validate ownership, lazy load requested associations, update lastAccessedAt timestamp

**PUT /api/projects/:workspaceId**

- **Purpose:** Update project metadata and configuration
- **Path Parameters:** Project UUID
- **Request Body:** Partial project update data
- **Response:** Updated project object
- **Business Logic:** Validate ownership, merge update data, maintain consistency of computed fields

**DELETE /api/projects/:workspaceId**

- **Purpose:** Soft delete project and cleanup associated resources
- **Path Parameters:** Project UUID
- **Response:** Confirmation message
- **Business Logic:** Validate ownership, transition to deleted status, schedule cleanup of workspace sessions and context items

### Extended API Endpoints

**POST /api/projects/:workspaceId/activate**

- **Purpose:** Set project as active and ensure workspace availability
- **Business Logic:** Update lastAccessedAt, create or resume workspace session, return workspace connection details

**POST /api/projects/:workspaceId/archive**

- **Purpose:** Archive project and cleanup active resources
- **Business Logic:** Update status to archived, terminate active workspace sessions, maintain data for potential restoration

**GET /api/projects/:workspaceId/context**

- **Purpose:** Retrieve complete context data for project
- **Response:** Aggregated context object with all brand assets, images, colors, and product overview
- **Business Logic:** Compose context from individual entities, apply user permissions, cache for performance

## Workspace System Integration

### Single Workspace Constraint

The system enforces a strict one-workspace-per-project policy to maintain resource efficiency and user experience consistency:

**Workspace Creation Logic:**

- Before creating new workspace, terminate any existing active workspace for the project
- Update Project entity's activeWorkspaceId field with new workspace reference
- Implement cleanup job to remove terminated workspace containers and data

**Workspace Reuse Logic:**

- Check for existing active workspace before creating new session
- Validate workspace health and accessibility before reuse
- Update workspace activity timestamps to prevent premature cleanup

**Project-Workspace Coordination:**

- Project activation automatically ensures workspace availability
- Project archival triggers workspace session termination
- Project deletion schedules workspace resource cleanup

### Workspace Service Integration

**Modified Files:**

- `packages/nest/src/modules/workspace/workspace.service.ts`
- `packages/nest/src/modules/workspace/workspace.controller.ts`

**Required Changes:**

- Add project validation to workspace creation methods
- Implement project-scoped workspace queries
- Add workspace cleanup methods triggered by project lifecycle events
- Update workspace session entity relationships

### Template Management

Projects will specify template IDs for workspace initialization:

- Template validation during project creation
- Template versioning support for project upgrades
- Custom template support for advanced users

## Chat and LLM System Integration

### Thread-Project Association

**Modified Files:**

- `packages/nest/src/shared/database/entities/llm-thread.entity.ts`
- `packages/nest/src/shared/database/services/llm-thread.service.ts`
- `packages/nest/src/modules/chat-agent/chat-agent.service.ts`

### LLM Thread Service Changes

**Enhanced Query Methods:**

- **Find Threads by Project:** Retrieve all threads associated with a specific project
- **Create Project Thread:** Create new thread with automatic project association
- **Get Project Thread Summary:** Aggregate thread statistics for project dashboard

**Business Logic Updates:**

- Thread creation requires valid project ID and user ownership validation
- Thread deletion updates project metadata (threadCount, lastMessageAt)
- Thread archival maintains project association for potential restoration

### Chat Agent Service Integration

**Modified Methods:**

- **Process Chat Message:** Include project context in LLM system prompts
- **Generate Streaming Response:** Access project-specific context data for enhanced responses
- **Create Thread:** Automatically associate with active project or allow project selection

**Context Integration:**

- LLM prompts enriched with project context (brand assets, color palettes, product information)
- Chat responses consider project-specific requirements and constraints
- Context updates trigger cache invalidation for active chat sessions

### Message-Project Relationship

Messages inherit project association through their parent thread relationship:

- No direct project foreign key in message entities (normalized through thread)
- Project-scoped message queries utilize thread relationship joins
- Message search and filtering support project-level scoping

## Security and Data Access Patterns

### Multi-Tenant Data Isolation

**User-Project Boundary:**

- All project queries include user ID filtering at the database level
- Service layer validates project ownership before any operations
- API endpoints extract user ID from authenticated JWT tokens

**Resource Access Control:**

- Context items accessible only through owned projects
- Chat threads scoped to project ownership
- Workspace sessions validated through project ownership chain

### Data Consistency Patterns

**Transactional Operations:**

- Project creation with initial context setup uses database transactions
- Project deletion with resource cleanup handled through background jobs
- Concurrent project modifications use optimistic locking

**Cache Invalidation:**

- Project metadata cached with TTL-based expiration
- Context changes trigger project cache invalidation
- Workspace status updates propagate to project cache

**Audit and Compliance:**

- Project access logging for security monitoring
- User data deletion compliance through cascading deletes
- Data retention policies enforced through project lifecycle management

### Performance Optimization

**Database Indexing:**

- Composite indexes for common query patterns (user + status, user + lastAccessed)
- Foreign key indexes for relationship queries
- Partial indexes for active projects to improve query performance

**Query Optimization:**

- Lazy loading for optional project associations (context, threads, workspace)
- Pagination support for large project collections
- Aggregation queries for dashboard statistics

**Caching Strategy:**

- Project metadata caching with context-aware invalidation
- Context data caching with project-scoped keys
- Workspace session status caching for quick availability checks

## Implementation File Structure

### New Files to Create

**Shared Types:**

- `packages/shared/src/project/project.types.ts` - Enhanced project types, API request/response interfaces
- `packages/shared/src/project/project-api.types.ts` - API-specific request and response types

**Database Layer:**

- `packages/nest/src/shared/database/entities/project.entity.ts` - Main project entity with relationships
- `packages/nest/src/shared/database/services/project.service.ts` - CRUD operations and business logic
- `packages/nest/src/shared/database/entities/brand-image.entity.ts` - Brand image entity with project relationship
- `packages/nest/src/shared/database/entities/brand-asset.entity.ts` - Brand asset entity with project relationship
- `packages/nest/src/shared/database/entities/color-palette.entity.ts` - Color palette entity with project relationship
- `packages/nest/src/shared/database/entities/product-overview.entity.ts` - Product overview entity with project relationship

**API Layer:**

- `packages/nest/src/modules/projects/project.controller.ts` - REST API endpoints
- `packages/nest/src/modules/projects/project.module.ts` - NestJS module configuration
- `packages/nest/src/modules/projects/dto/create-project.dto.ts` - Request validation DTOs
- `packages/nest/src/modules/projects/dto/update-project.dto.ts` - Update request validation DTOs

### Files to Modify

**Existing Entities:**

- `packages/nest/src/shared/database/entities/llm-thread.entity.ts` - Add workspaceId relationship
- `packages/nest/src/modules/workspace/entities/session.entity.ts` - Enhance project relationship

**Existing Services:**

- `packages/nest/src/shared/database/services/llm-thread.service.ts` - Add project-scoped queries
- `packages/nest/src/shared/database/services/llm-message.service.ts` - Add project context access
- `packages/nest/src/modules/workspace/workspace.service.ts` - Add project validation and coordination
- `packages/nest/src/modules/chat-agent/chat-agent.service.ts` - Add project context integration

**Existing Controllers:**

- `packages/nest/src/modules/chat-agent/chat-agent.controller.ts` - Add project-scoped endpoints
- `packages/nest/src/modules/workspace/workspace.controller.ts` - Add project validation

**Shared Type Updates:**

- `packages/shared/src/project/index.ts` - Enhance base Project type
- `packages/shared/src/context/types/context.types.ts` - Update context interfaces for project relationships

## Migration and Data Integrity

### Database Migration Strategy

**Migration Files Required:**

- Add workspaceId columns to llm_threads table with nullable constraint
- Create projects table with full schema and indexes
- Create context entity tables (brand_images, brand_assets, color_palettes, product_overviews)
- Add foreign key constraints and relationship indexes
- Create composite indexes for optimized query patterns

### Backward Compatibility

**Existing Data Handling:**

- Existing LLM threads will have null workspaceId initially
- Migration script to create default projects for existing threads
- Gradual migration approach allowing mixed project/non-project threads during transition

### Data Validation

**Consistency Checks:**

- Orphaned context items cleanup procedures
- Project ownership validation across all related entities
- Workspace session project association validation

This implementation plan provides a comprehensive foundation for the Projects System while maintaining integration with existing systems and ensuring scalable, secure multi-tenant operation. The phased approach allows for incremental development and testing while preserving backward compatibility during the transition period.
