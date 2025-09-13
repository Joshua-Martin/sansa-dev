# Frontend Projects System Implementation Plan

## Overview

The Frontend Projects System provides a comprehensive user interface for managing projects within the AI-powered landing page studio. This system integrates seamlessly with the existing authentication, API client, and workspace management systems to deliver a cohesive project management experience.

The frontend implementation focuses on:

- Project creation, listing, and management through an intuitive UI
- Seamless integration with the existing workspace and chat systems
- State management for active project context across the application
- Responsive design following established UI patterns
- Error handling and loading states for robust user experience

## Enhanced Project Types

### Frontend Project Type Extensions

**Location:** `packages/shared/src/project/project.types.ts`

Building upon the base Project type, the frontend requires additional computed and UI-specific fields:

```typescript
export interface ProjectWithContext extends Project {
  // Enhanced metadata fields
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'archived' | 'deleted';
  templateId?: string;
  lastAccessedAt: string;

  // Context integration fields
  hasContext: boolean;
  contextLastUpdatedAt?: string;

  // Workspace integration fields
  activeWorkspaceId?: string;
  workspaceLastCreatedAt?: string;

  // Chat integration fields
  activeThreadId?: string;
  threadCount: number;
  lastMessageAt?: string;

  // Computed UI fields
  isActive: boolean;
  isArchived: boolean;
  displayName: string;
  activitySummary: string;
  contextSummary: {
    brandAssets: number;
    images: number;
    colorPalettes: number;
    productOverviews: number;
  };
}
```

### API Request/Response Types

**Location:** `packages/shared/src/project/project-api.types.ts`

```typescript
export interface CreateProjectRequest {
  name: string;
  description?: string;
  templateId?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'archived';
}

export interface ProjectListResponse {
  projects: ProjectWithContext[];
  total: number;
  hasMore: boolean;
}

export interface ProjectFilters {
  status?: ProjectStatus[];
  search?: string;
  sortBy?: 'lastAccessedAt' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}
```

## State Management Architecture

### Global Project Store

**Location:** `packages/frontend/src/lib/stores/project.store.ts`

Implement a Zustand store for project state management with persistence:

```typescript
interface ProjectStore {
  // Active project state
  activeProject: ProjectWithContext | null;
  activeworkspaceId: string | null;

  // Project collection state
  projects: ProjectWithContext[];
  projectsLoading: boolean;
  projectsError: string | null;

  // UI state
  selectedworkspaceIds: Set<string>;
  filters: ProjectFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };

  // Actions
  setActiveProject: (project: ProjectWithContext | null) => void;
  loadProjects: (filters?: ProjectFilters) => Promise<void>;
  createProject: (data: CreateProjectRequest) => Promise<ProjectWithContext>;
  updateProject: (
    id: string,
    data: UpdateProjectRequest
  ) => Promise<ProjectWithContext>;
  deleteProject: (id: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  activateProject: (id: string) => Promise<void>;
  clearError: () => void;
  setFilters: (filters: ProjectFilters) => void;
  resetSelection: () => void;
}
```

## API Integration Layer

### Project API Service

**Location:** `packages/frontend/src/lib/services/project.service.ts`

Leverage the existing API client architecture for project operations:

```typescript
import { api } from '../api';

export class ProjectService {
  static async getProjects(params?: {
    page?: number;
    limit?: number;
    status?: string[];
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ProjectListResponse> {
    const response = await api.get<ProjectListResponse>(
      '/api/projects',
      params
    );
    return response;
  }

  static async getProject(
    workspaceId: string,
    include?: string[]
  ): Promise<ProjectWithContext> {
    const params = include ? { include: include.join(',') } : {};
    return api.get<ProjectWithContext>(`/api/projects/${workspaceId}`, params);
  }

  static async createProject(
    data: CreateProjectRequest
  ): Promise<ProjectWithContext> {
    return api.post<ProjectWithContext>('/api/projects', data);
  }

  static async updateProject(
    workspaceId: string,
    data: UpdateProjectRequest
  ): Promise<ProjectWithContext> {
    return api.put<ProjectWithContext>(`/api/projects/${workspaceId}`, data);
  }

  static async deleteProject(workspaceId: string): Promise<void> {
    return api.delete<void>(`/api/projects/${workspaceId}`);
  }

  static async activateProject(
    workspaceId: string
  ): Promise<{ workspaceId: string }> {
    return api.post<{ workspaceId: string }>(
      `/api/projects/${workspaceId}/activate`
    );
  }

  static async archiveProject(workspaceId: string): Promise<void> {
    return api.post<void>(`/api/projects/${workspaceId}/archive`);
  }

  static async getProjectContext(workspaceId: string): Promise<ProjectContext> {
    return api.get<ProjectContext>(`/api/projects/${workspaceId}/context`);
  }
}
```

## React Hooks for Project Management

### useProjects Hook

**Location:** `packages/frontend/src/lib/hooks/use-projects.ts`

```typescript
export const useProjects = (filters?: ProjectFilters) => {
  const store = useProjectStore();

  useEffect(() => {
    if (filters) {
      store.setFilters(filters);
    }
    store.loadProjects();
  }, [filters, store]);

  return {
    projects: store.projects,
    loading: store.projectsLoading,
    error: store.projectsError,
    pagination: store.pagination,
    createProject: store.createProject,
    updateProject: store.updateProject,
    deleteProject: store.deleteProject,
    refresh: () => store.loadProjects(),
    clearError: store.clearError,
  };
};
```

## UI Component Architecture

### ProjectSelector Component

**Location:** `packages/frontend/src/components/projects/project-selector.tsx`

Main project selection interface with search and filtering capabilities for managing and switching between projects:

```typescript
export const ProjectSelector: React.FC<{
  onProjectSelect?: (project: ProjectWithContext) => void;
  className?: string;
}> = ({ onProjectSelect, className }) => {
  const { projects, loading, error } = useProjects();
  const { activeProject, switchProject } = useActiveProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Filtered projects based on search
  const filteredProjects = useMemo(() => {
    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  return (
    <div className={className}>
      {/* Search and Create Project Bar */}
      <div className="flex items-center gap-2 mb-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search projects..."
        />
        <Button
          onClick={() => setShowCreateDialog(true)}
          size="sm"
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Projects List */}
      <div className="space-y-2">
        {loading ? (
          <ProjectSkeletonList count={5} />
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => window.location.reload()} />
        ) : (
          filteredProjects.map(project => (
            <ProjectListItem
              key={project.id}
              project={project}
              isActive={activeProject?.id === project.id}
              onClick={() => {
                switchProject(project.id);
                onProjectSelect?.(project);
              }}
            />
          ))
        )}
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={(project) => {
          switchProject(project.id);
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
};
```

## Integration with Existing Systems

### Builder Integration

**Location:** `packages/frontend/src/pages/builder/index.tsx`

Ensure builder automatically creates/selects a project:

```typescript
export const BuilderPage: React.FC = () => {
  const { activeProject, switchProject } = useActiveProject();
  const navigate = useNavigate();

  useEffect(() => {
    const ensureProjectExists = async () => {
      if (!activeProject) {
        // Create a default project if none exists
        const defaultProjectName = `Project ${new Date().toLocaleDateString()}`;
        try {
          const project = await ProjectService.createProject({
            name: defaultProjectName,
            description: 'Auto-created project for builder session',
          });
          await switchProject(project.id);
        } catch (error) {
          console.error('Failed to create default project:', error);
          navigate('/projects');
          return;
        }
      }

      // Ensure project has an active workspace
      if (!activeProject.activeWorkspaceId) {
        try {
          await ProjectService.activateProject(activeProject.id);
        } catch (error) {
          console.error('Failed to activate project workspace:', error);
          // Handle workspace creation failure
        }
      }
    };

    ensureProjectExists();
  }, [activeProject, switchProject, navigate]);

  // Rest of builder implementation...
};
```

## Navigation and Routing Integration

### Protected Route Wrapper

**Location:** `packages/frontend/src/components/auth/project-route-guard.tsx`

```typescript
export const ProjectRouteGuard: React.FC<{
  children: React.ReactNode;
  requireProject?: boolean;
}> = ({ children, requireProject = false }) => {
  const { activeProject, isLoading } = useActiveProject();
  const { user } = useAuth();

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requireProject && !activeProject) {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
};
```

## Testing Strategy

### Unit Tests

**Location:** `packages/frontend/src/components/projects/__tests__/`

- ProjectSelector.test.tsx - Component rendering and interactions
- useProjects.test.ts - Hook functionality and API integration
- ProjectService.test.ts - API service methods
- project.store.test.ts - State management logic

### Integration Tests

**Location:** `packages/frontend/src/__tests__/`

- ProjectWorkflow.test.tsx - Complete project creation to builder flow
- ProjectSwitching.test.tsx - Active project switching and persistence
- ErrorHandling.test.tsx - Error states and recovery

## Performance Optimization

### Code Splitting

**Location:** `packages/frontend/src/pages/projects/index.tsx`

```typescript
const ProjectsPage = lazy(() => import('./projects-page'));
const BuilderPage = lazy(() => import('../builder/builder-page'));

// In router configuration
{
  path: 'projects',
  element: (
    <Suspense fallback={<PageSkeleton />}>
      <ProjectsPage />
    </Suspense>
  ),
}
```

## Deployment and Migration

### Feature Flags

**Location:** `packages/frontend/src/lib/config/feature-flags.ts`

```typescript
export const FEATURE_FLAGS = {
  PROJECTS_SYSTEM: process.env.NEXT_PUBLIC_ENABLE_PROJECTS === 'true',
  PROJECT_CONTEXT_INTEGRATION:
    process.env.NEXT_PUBLIC_ENABLE_PROJECT_CONTEXT === 'true',
  ADVANCED_PROJECT_FILTERING:
    process.env.NEXT_PUBLIC_ENABLE_ADVANCED_FILTERS === 'true',
} as const;
```

### Gradual Rollout Strategy

1. **Phase 1:** Basic project creation and selection (minimal disruption)
2. **Phase 2:** Workspace integration and context association
3. **Phase 3:** Chat thread project linking and advanced features
4. **Phase 4:** Full feature set with optimizations

### Backward Compatibility

- Graceful degradation when projects system is disabled
- Fallback to existing workspace-only behavior
- Migration helpers for existing users

This frontend implementation plan provides a comprehensive foundation for the Projects System while maintaining integration with existing systems and ensuring a smooth user experience. The modular architecture allows for incremental development and testing while preserving backward compatibility during the transition period.
