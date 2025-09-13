# Workspace Storage & Persistence System

## Overview

This document outlines the implementation of persistent workspace storage, allowing users to save their workspace changes and resume their work when they return. The system saves workspace source files as compressed archives to our existing storage infrastructure (MinIO/R2) and restores them into fresh containers on demand.

## Goals

### Primary Goals

1. **Persistent Workspaces**: Users can save their workspace changes and have them persist across sessions
2. **Seamless Resume**: When users return, their workspace opens with all saved changes intact
3. **HMR Continuity**: Restored workspaces maintain full Hot Module Replacement functionality
4. **Simple Save/Load**: Single save button triggers workspace persistence, automatic loading on return

### User Experience Flow

1. User opens builder page → System checks for saved workspace
2. If saved workspace exists → Load and restore files into new container
3. If no saved workspace → Create new workspace from template + perform initial save
4. User makes code changes in container (via AI or direct editing)
5. User clicks save → Archive workspace files and upload to storage
6. User leaves and returns → Workspace restored with all changes intact

## Architecture Overview

### Storage Strategy

- **Format**: Tar.gz compressed archives containing source files
- **Exclusions**: node_modules, .git, dist, build outputs (per todo list)
- **Restoration**: Extract files + run `npm install` to rebuild dependencies
- **Overwrite Policy**: Each save overwrites previous archive (no versioning in MVP)

### Storage Key Structure

```
/workspaces/{userId}/{workspaceId|default}/workspace.tar.gz
```

- Uses stable identifiers (userId + workspaceId) for predictable paths
- Overwrites on each save to prevent archive accumulation
- Falls back to "default" workspace if no workspaceId provided

## Database Schema Changes

### WorkspaceSessionEntity Updates

**File**: `packages/nest/src/shared/database/entities/session.entity.ts`

```typescript
// New columns to add:
@Column('boolean', { default: false })
hasSavedChanges: boolean;

@Column('timestamp with time zone', { nullable: true })
lastSavedAt: Date | null;

@Column('varchar', { length: 255, nullable: true })
templateId: string | null;
```

### Migration Required

**Location**: `packages/nest/migrations/`
**File**: `{timestamp}-add-workspace-persistence.sql`

```sql
ALTER TABLE workspace_sessions
ADD COLUMN has_saved_changes BOOLEAN DEFAULT FALSE,
ADD COLUMN last_saved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN template_id VARCHAR(255);

CREATE INDEX idx_workspace_sessions_has_saved_changes ON workspace_sessions(has_saved_changes);
CREATE INDEX idx_workspace_sessions_last_saved_at ON workspace_sessions(last_saved_at);
```

## New File Structure

### Core Services Directory

```
packages/nest/src/modules/workspace/services/
├── workspace-persistence.service.ts    # Main persistence logic
└── workspace-archive.service.ts        # Archive creation/extraction utilities
```

### Updated Existing Files

```
packages/nest/src/modules/workspace/
├── workspace.service.ts                # Modified: getOrCreateWorkspace, save methods
├── workspace.controller.ts             # Modified: new save endpoint
├── workspace.module.ts                 # Modified: register new services
└── dto/
    └── save-workspace.dto.ts           # New: save request validation
```

### Shared Services Updates

```
packages/nest/src/shared/services/
└── docker.service.ts                  # Modified: add copyToContainer, execCommand
```

### Type Definitions

```
packages/shared/src/workspace/
└── workspace.types.ts                 # Modified: add persistence types
```

## Detailed File Breakdown

### 1. WorkspacePersistenceService

**Path**: `packages/nest/src/modules/workspace/services/workspace-persistence.service.ts`

**Purpose**: Core service handling workspace save/load operations

**Key Methods**:

- `saveWorkspace(session)`: Creates tar archive of container files and uploads to storage
- `loadWorkspace(containerId, storageKey)`: Downloads and extracts archive into container
- `generateWorkspaceStorageKey(userId, workspaceId)`: Creates predictable storage paths

**Dependencies**: StorageService, DockerService

**Why Needed**: Abstracts all persistence logic away from main WorkspaceService, maintains single responsibility

### 2. WorkspaceArchiveService

**Path**: `packages/nest/src/modules/workspace/services/workspace-archive.service.ts`

**Purpose**: Utility service for creating and extracting tar archives from containers

**Key Methods**:

- `createWorkspaceArchive(containerId)`: Executes tar command in container, returns buffer
- `extractWorkspaceArchive(containerId, archiveBuffer)`: Copies and extracts archive in container
- `getExcludePatterns()`: Returns list of patterns to exclude from archives

**Why Needed**: Separates low-level archive operations from business logic, reusable utilities

### 3. Updated WorkspaceService

**Path**: `packages/nest/src/modules/workspace/workspace.service.ts`

**Modified Methods**:

- `getOrCreateWorkspace()`: Now checks for saved workspaces before creating new ones
- `createNewWorkspaceWithInitialSave()`: Performs initial save after container creation
- `saveWorkspace()`: New method handling save requests
- `findMostRecentSavedWorkspace()`: Database query for user's latest saved workspace
- `restoreSavedWorkspace()`: Creates container and loads saved files

**Why Modified**: Central orchestration of workspace lifecycle now includes persistence

### 4. Updated WorkspaceController

**Path**: `packages/nest/src/modules/workspace/workspace.controller.ts`

**New Endpoint**:

```typescript
@Post(':sessionId/save')
async saveWorkspace(@CurrentUserId() userId: string, @Param('sessionId') sessionId: string)
```

**Why Added**: Provides REST API endpoint for frontend save button functionality

### 5. SaveWorkspaceDto

**Path**: `packages/nest/src/modules/workspace/dto/save-workspace.dto.ts`

**Purpose**: Request validation for save operations (future extensibility)

**Why Needed**: Follows existing DTO patterns, allows for future save options/metadata

### 6. Updated DockerService

**Path**: `packages/nest/src/shared/services/docker.service.ts`

**New Methods**:

- `copyToContainer(containerId, data, containerPath)`: Copies buffer data to container filesystem
- `execCommand(containerId, command, options)`: Executes commands inside containers

**Why Modified**: Archive operations require copying data to containers and executing tar/npm commands

### 7. Updated Workspace Types

**Path**: `packages/shared/src/workspace/workspace.types.ts`

**New Interfaces**:

```typescript
interface SavedWorkspace extends WorkspaceSession {
  hasSavedChanges: boolean;
  lastSavedAt: string;
  templateId?: string;
}

interface WorkspaceSaveResponse {
  success: boolean;
  savedAt: string;
}
```

**Why Added**: Type safety for new persistence-related data structures

## Integration with Existing Storage System

### Storage Service Usage

The workspace persistence system integrates with the existing storage infrastructure:

**Upload Process**:

```typescript
await this.storageService.uploadFile({
  file: archiveBuffer,
  filename: 'workspace.tar.gz',
  mimeType: 'application/gzip',
  userId: session.userId,
  workspaceId: session.workspaceId || 'default',
  category: 'workspace-archive',
});
```

**Download Process**:

```typescript
const archiveBuffer = await this.storageService.downloadFile(storageKey);
```

### Storage Categories

A new category `workspace-archive` will be added to the existing file validation rules in the shared storage types.

## Implementation Sequence

### Phase 1: Foundation

1. Create database migration for new columns
2. Implement WorkspaceArchiveService (tar operations)
3. Add new methods to DockerService (copyToContainer, execCommand)

### Phase 2: Core Logic

4. Implement WorkspacePersistenceService
5. Update WorkspaceService with save/load methods
6. Add save endpoint to WorkspaceController

### Phase 3: Integration

7. Modify getOrCreateWorkspace to check for saved workspaces
8. Add initial save logic after workspace creation
9. Update workspace types and DTOs

### Phase 4: Testing & Refinement

10. Test save/restore cycle with real workspaces
11. Verify HMR functionality after restoration
12. Handle edge cases and error scenarios

## Technical Considerations

### Archive Creation

- Uses `tar -czf` with exclude patterns for node_modules, .git, etc.
- Archives created in-memory to avoid temporary files on host
- Compression reduces storage costs and transfer time

### Container Restoration

- Fresh containers ensure clean state
- File extraction preserves permissions and structure
- `npm install` rebuilds dependencies from package.json

### Error Handling

- Failed saves don't prevent workspace usage
- Corrupted archives fall back to template creation
- Storage errors logged but don't crash workspace service

### Performance

- Archives are compressed to minimize storage and bandwidth
- Async operations prevent blocking workspace creation
- Initial saves happen after container is fully ready

## Future Enhancements (Out of Scope)

- Multiple workspace slots per user
- Workspace versioning/history
- Selective file saving
- Workspace sharing between users
- Incremental saves (only changed files)

## Dependencies

### Existing Services Used

- StorageService (MinIO/R2 file operations)
- DockerService (container management)
- WorkspaceSessionEntity (database persistence)

### New Dependencies

- Node.js tar operations (via docker exec)
- Additional database indexes for performance
- Storage category for workspace archives

This implementation provides a solid foundation for workspace persistence while maintaining simplicity and leveraging existing infrastructure.
