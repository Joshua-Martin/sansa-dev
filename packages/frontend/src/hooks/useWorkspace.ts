import { useState, useEffect, useCallback } from 'react';
import { workspaceApi } from '../lib/workspace/workspace.api';
import { useAuth } from './useAuth';
import { useBuilderWorkspace } from '../lib/stores/builder-store';
import type {
  Workspace,
  CreateWorkspaceRequest,
  WorkspaceResponse,
  ListWorkspacesRequest,
  UpdateWorkspaceRequest,
  SaveWorkspaceResponse,
} from '@sansa-dev/shared';

/**
 * Workspace Hook State
 */
interface WorkspaceState {
  workspaces: Workspace[] | null;
  selectedWorkspace: Workspace | null;
  isLoadingWorkspaces: boolean;
  isCreatingWorkspace: boolean;
  workspaceError: string | null;
}

/**
 * useWorkspace Hook Return Type
 */
interface UseWorkspaceReturn extends WorkspaceState {
  loadWorkspaces: () => Promise<void>;
  selectWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (request: CreateWorkspaceRequest) => Promise<Workspace>;
  updateWorkspace: (
    workspaceId: string,
    updates: UpdateWorkspaceRequest
  ) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  saveWorkspace: (sessionId: string) => Promise<SaveWorkspaceResponse>;
  clearSelection: () => void;
}

/**
 * useWorkspace Hook
 *
 * React hook for managing workspace entities including:
 * - Loading and listing user's workspaces
 * - Workspace selection and state management
 * - Creating, updating, and deleting workspaces
 * - Saving workspace data from active sessions
 * - Integration with builder store for workspace ID management
 */
export function useWorkspace(): UseWorkspaceReturn {
  const { user } = useAuth();
  const { setWorkspaceId } = useBuilderWorkspace();

  const [state, setState] = useState<WorkspaceState>({
    workspaces: null,
    selectedWorkspace: null,
    isLoadingWorkspaces: false,
    isCreatingWorkspace: false,
    workspaceError: null,
  });

  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<WorkspaceState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Load user's workspaces with optional filtering
   */
  const loadWorkspaces = useCallback(
    async (params?: ListWorkspacesRequest) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      updateState({ isLoadingWorkspaces: true, workspaceError: null });

      try {
        const response = await workspaceApi.listWorkspaces(params);
        updateState({
          workspaces: response.workspaces,
          isLoadingWorkspaces: false,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load workspaces';
        updateState({
          isLoadingWorkspaces: false,
          workspaceError: errorMessage,
        });
        throw error;
      }
    },
    [user, updateState]
  );

  /**
   * Select a workspace by ID
   */
  const selectWorkspace = useCallback(
    async (workspaceId: string) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      updateState({ workspaceError: null });

      try {
        // If we don't have workspaces loaded, load them first
        if (!state.workspaces) {
          await loadWorkspaces();
        }

        // Find the workspace in the loaded list
        const workspace = state.workspaces?.find((w) => w.id === workspaceId);

        if (!workspace) {
          // If not found in cache, fetch individually
          const fetchedWorkspace = await workspaceApi.getWorkspace(workspaceId);
          updateState({
            selectedWorkspace: fetchedWorkspace,
          });
          setWorkspaceId(workspaceId);
          return;
        }

        updateState({
          selectedWorkspace: workspace,
        });
        setWorkspaceId(workspaceId);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to select workspace';
        updateState({ workspaceError: errorMessage });
        throw error;
      }
    },
    [user, state.workspaces, loadWorkspaces, updateState, setWorkspaceId]
  );

  /**
   * Create a new workspace
   */
  const createWorkspace = useCallback(
    async (request: CreateWorkspaceRequest): Promise<Workspace> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      updateState({ isCreatingWorkspace: true, workspaceError: null });

      try {
        const response: WorkspaceResponse =
          await workspaceApi.createWorkspace(request);
        const workspace = response.workspace;

        // Add to workspaces list if loaded
        if (state.workspaces) {
          updateState({
            workspaces: [...state.workspaces, workspace],
            isCreatingWorkspace: false,
          });
        } else {
          updateState({ isCreatingWorkspace: false });
        }

        return workspace;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create workspace';
        updateState({
          isCreatingWorkspace: false,
          workspaceError: errorMessage,
        });
        throw error;
      }
    },
    [user, state.workspaces, updateState]
  );

  /**
   * Update workspace metadata
   */
  const updateWorkspace = useCallback(
    async (workspaceId: string, updates: UpdateWorkspaceRequest) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      updateState({ workspaceError: null });

      try {
        const response = await workspaceApi.updateWorkspace(
          workspaceId,
          updates
        );
        const updatedWorkspace = response.workspace;

        // Update in workspaces list if loaded
        if (state.workspaces) {
          const updatedWorkspaces = state.workspaces.map((workspace) =>
            workspace.id === workspaceId ? updatedWorkspace : workspace
          );
          updateState({
            workspaces: updatedWorkspaces,
          });
        }

        // Update selected workspace if it's the one being updated
        if (state.selectedWorkspace?.id === workspaceId) {
          updateState({
            selectedWorkspace: updatedWorkspace,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update workspace';
        updateState({ workspaceError: errorMessage });
        throw error;
      }
    },
    [user, state.workspaces, state.selectedWorkspace?.id, updateState]
  );

  /**
   * Delete a workspace
   */
  const deleteWorkspace = useCallback(
    async (workspaceId: string) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      updateState({ workspaceError: null });

      try {
        await workspaceApi.deleteWorkspace(workspaceId);

        // Remove from workspaces list if loaded
        if (state.workspaces) {
          const filteredWorkspaces = state.workspaces.filter(
            (workspace) => workspace.id !== workspaceId
          );
          updateState({
            workspaces: filteredWorkspaces,
          });
        }

        // Clear selection if this workspace was selected
        if (state.selectedWorkspace?.id === workspaceId) {
          updateState({
            selectedWorkspace: null,
          });
          setWorkspaceId(null);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete workspace';
        updateState({ workspaceError: errorMessage });
        throw error;
      }
    },
    [
      user,
      state.workspaces,
      state.selectedWorkspace?.id,
      updateState,
      setWorkspaceId,
    ]
  );

  /**
   * Save workspace data from an active session
   */
  const saveWorkspace = useCallback(
    async (sessionId: string): Promise<SaveWorkspaceResponse> => {
      if (!state.selectedWorkspace) {
        throw new Error('No workspace selected');
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        const result = await workspaceApi.saveWorkspace(
          state.selectedWorkspace.id,
          sessionId
        );
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to save workspace';
        updateState({ workspaceError: errorMessage });
        throw error;
      }
    },
    [state.selectedWorkspace, user, updateState]
  );

  /**
   * Clear workspace selection
   */
  const clearSelection = useCallback(() => {
    updateState({
      selectedWorkspace: null,
    });
    setWorkspaceId(null);
  }, [updateState, setWorkspaceId]);

  /**
   * Load workspaces on mount when user is available
   */
  useEffect(() => {
    if (user && !state.workspaces && !state.isLoadingWorkspaces) {
      loadWorkspaces().catch((error) => {
        console.error('Failed to load workspaces on mount:', error);
        // Don't throw here as this is a side effect
      });
    }
  }, [user, state.workspaces, state.isLoadingWorkspaces, loadWorkspaces]);

  return {
    ...state,
    loadWorkspaces,
    selectWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    saveWorkspace,
    clearSelection,
  };
}
