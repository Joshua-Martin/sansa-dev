# Template Architecture Migration

## Overview

The template system has been fundamentally restructured to work with the new core container architecture. Templates are now processed as tar.gz archives on the host filesystem and injected into clean core containers at runtime. This change eliminates container filesystem access issues and enables much faster workspace provisioning.

## Goals

### Primary Objectives

1. **Eliminate Template Docker Images**: Convert templates from full Docker projects to simple file collections
2. **Enable Archive-Based Injection**: Templates are archived on host and extracted in containers
3. **Maintain Template Functionality**: All existing template features continue to work
4. **Simplify Template Management**: Adding new templates becomes a file copy operation
5. **Improve Development Workflow**: Template changes don't require Docker rebuilds

### Key Changes

- Templates remain as directories of files without Dockerfiles
- Template initialization happens via archive extraction, not file copying
- Template metadata is stored in JSON configuration files
- Package dependencies are installed after archive extraction

## Template Structure Changes

### Current Template Structure (To Be Replaced)

Templates currently exist as complete Docker projects with their own build process:

```
workspace-templates/baseline-landing/
├── Dockerfile (REMOVE)
├── package.json
├── astro.config.mjs
├── tsconfig.json
├── src/ (template source files)
├── public/ (static assets)
└── README.md
```

### New Template Structure

Templates become simple file collections with metadata:

```
workspace-templates/baseline-landing/
├── template.json (NEW - template metadata)
├── package.json (template dependencies)
├── astro.config.mjs
├── tsconfig.json
├── src/ (template source files)
├── public/ (static assets)
└── README.md
```

### Template Metadata File

Each template must include a `template.json` file containing:

**Template Identification**:

- Template name and description
- Version information
- Template type classification

**Build Configuration**:

- Node.js version requirements
- Package manager preference (npm, pnpm, yarn)
- Build and development commands
- Output directory configuration

**Development Server Settings**:

- Default port configuration
- HMR (Hot Module Replacement) settings
- Health check configuration

**File Handling Instructions**:

- Files to exclude during injection
- Files that require processing or substitution
- Permission requirements for executable files

## Backend Service Changes

### TemplateService Archive Creation

**Purpose**: Replace the current TemplateService.initializeWorkspace() method with an archive-based system that creates tar.gz archives from template directories on the host.

**Location**: Update existing service at `packages/nest/src/modules/workspace/services/templates/template.service.ts`

**Key Responsibilities**:

- Load template metadata from template.json files
- Create tar.gz archives from template directories on host filesystem
- Copy archives into containers via Docker API
- Trigger container tool server to extract archives into `/app/` directory
- Execute npm install and start development server after extraction
- Handle template-specific configuration requirements

**Integration Points**:

- Called by WorkspaceInitializerService for new workspace creation
- Integrates with DockerService for archive copying operations
- Uses container tool server for archive extraction
- Reports progress through existing logging infrastructure

### WorkspaceInitializerService Updates

**Modified Behavior**: Update the service to use template archive creation and extraction instead of pre-built template images.

**File Location**: `packages/nest/src/modules/workspace/services/workspace-initializer.service.ts`

**Key Changes**:

- Replace calls to TemplateService with archive-based template processing
- Update initializeFromTemplate() method to use archive creation and extraction
- Maintain existing archive restoration functionality
- Ensure proper error handling for archive creation and extraction failures

**Process Flow**:

1. Check if workspace has saved archive
2. If archive exists: extract to `/app/` directory
3. If no archive: create template archive on host, copy to container, extract in container
4. Execute npm install and start development server
5. Save initial workspace state for future restoration

### SessionService Integration

**Container Creation Changes**: Update container creation to use core image instead of template-specific images.

**File Location**: `packages/nest/src/modules/workspace/services/session.service.ts`

**Specific Modifications**:

- Change image reference in initializeSessionAsync() method
- Update from `localhost:5100/baseline-landing-template:latest` to `localhost:5100/workspace-core:latest`
- Maintain existing port allocation and resource management
- Keep container configuration and security settings unchanged

**Template Selection**: Template ID is still passed through session creation but now used for archive creation and extraction rather than image selection.

## Template Type System Updates

### Shared Type Modifications

**File Location**: `packages/shared/src/workspace/template.types.ts`

**New Type Definitions**:

- TemplateMetadata interface for template.json structure
- TemplateInjectionRequest for runtime injection parameters
- TemplateInjectionResult for operation status reporting
- FileProcessingOptions for template file handling

**Modified Interfaces**:

- WorkspaceTemplate interface updated to reflect file-based structure
- TemplateConfiguration updated for runtime requirements
- Remove Docker-specific fields from template definitions

### Template Configuration Schema

**Template Metadata Structure**:
Templates must define their configuration in a standardized format that includes build requirements, development settings, and file processing instructions.

**Dependency Management**:
Template package.json files are merged with core container dependencies at runtime, allowing templates to specify their required packages without conflicts.

**Environment Configuration**:
Templates can specify environment variables, development server settings, and build configuration that gets applied during injection.

## Migration Process

### Phase 1: Template Structure Conversion

**For Each Existing Template**:

1. Remove Dockerfile from template directory
2. Create template.json with template metadata
3. Update package.json to remove Docker-specific scripts
4. Verify all template files are properly structured
5. Test template structure with new archive system

**Template Registry Updates**:

- Update TemplateService.builtInTemplates configuration
- Remove Docker image references from template definitions
- Add template.json parsing for metadata loading

### Phase 2: Service Implementation

**Update TemplateService**:

1. Implement archive creation from template directories on host
2. Add archive copying to containers via Docker API
3. Integrate with container tool server for archive extraction
4. Add development server startup and health checking after extraction
5. Implement proper error handling and logging

**Update WorkspaceInitializerService**:

1. Replace TemplateService calls with archive-based template processing
2. Update error handling for archive creation and extraction failures
3. Maintain existing archive restoration functionality
4. Test integration with existing workspace creation flow

### Phase 3: Testing and Validation

**Template Archive Testing**:

- Verify each template creates archives correctly on host
- Test archive copying into containers via Docker API
- Validate archive extraction by container tool server
- Confirm HMR functionality works after archive extraction

**Archive Compatibility Testing**:

- Test archive creation from extracted templates
- Verify archive restoration works correctly
- Confirm saved workspace state is maintained
- Test multiple save/restore cycles

## Template Development Workflow

### Adding New Templates

**Simplified Process**:

1. Create new directory under `workspace-templates/`
2. Add template files (no Dockerfile required)
3. Create template.json with metadata
4. Add template to TemplateService configuration
5. Template is immediately available for use

**No Build Process Required**:

- Templates don't need Docker builds
- Changes to template files are immediately available
- Development and testing cycle is much faster

### Template Modification Workflow

**File Changes**:

- Modify template files directly in template directory
- Changes are picked up on next workspace creation
- No need to rebuild or push Docker images

**Dependency Updates**:

- Update package.json in template directory
- Dependencies are installed after archive extraction in container
- Test with new workspace creation to verify changes

## Backwards Compatibility

**Important**: Backwards compatibility is NOT maintained in this migration. The new template architecture is fundamentally different from the Docker-based approach.

**Migration Requirements**:

- Existing workspace sessions using old template images will continue to function
- New workspace sessions will use the new injection system
- Saved workspace archives remain compatible due to file-based storage
- Template developers must update their templates to the new structure

**Breaking Changes**:

- Template Dockerfiles are no longer used and should be removed
- Template-specific Docker images are no longer built or maintained
- Template initialization process is completely replaced
- Template metadata format changes require updates to existing templates

## Success Criteria

### Functional Requirements

- All existing templates work with archive system
- Template archive creation and extraction completes within acceptable time limits
- Development servers start correctly after archive extraction
- HMR functionality works for all extracted templates
- Archive save/restore maintains compatibility

### Performance Requirements

- Template archive creation faster than Docker image builds
- Workspace creation time significantly improved
- Template archive copying and extraction completes quickly
- npm install execution time remains reasonable

### Developer Experience

- Adding new templates requires no Docker knowledge
- Template modifications don't require rebuild processes
- Template testing workflow is simplified
- Template debugging is more straightforward with direct file access
