/**
 * Core workspace types for persistent workspace management
 */

import type { ResourceAllocation, PreviewEnvironment } from './session.types';
import type { X21Id, X21Timestamp } from '../app';
/**
 * Core workspace entity - represents a persistent user workspace
 */
export interface WorkspaceEntity {
  id: X21Id;
  userId: X21Id;
  name?: string; // Optional user-friendly name
  templateId: X21Id;
  storageKey: string; // Path where workspace files are stored
  resources: ResourceAllocation; // Default resource allocation for sessions
  environment: PreviewEnvironment; // Default environment configuration
  createdAt: X21Timestamp;
  lastAccessedAt: X21Timestamp;
  lastSavedAt?: X21Timestamp;
  metadata?: Record<string, unknown>; // Template-specific configuration
}

/**
 * Workspace with enviroment and resorces ommited
 */
export interface Workspace {
  id: X21Id;
  userId: X21Id;
  name?: string; // Optional user-friendly name
  templateId: X21Id;
  storageKey: string; // Path where workspace files are stored
  createdAt: X21Timestamp;
  lastAccessedAt: X21Timestamp;
  lastSavedAt?: X21Timestamp;
  metadata?: Record<string, unknown>; // Template-specific configuration
}

/**
 * Workspace creation request
 * Used for creating new persistent workspaces (which also creates an initial session)
 */
export interface CreateWorkspaceRequest {
  name?: string;
  templateId?: X21Id;
}

/**
 * Workspace update request
 */
export interface UpdateWorkspaceRequest {
  name?: string;
}

/**
 * Workspace response for API operations
 */
export interface WorkspaceResponse {
  workspace: Workspace;
}

/**
 * Workspace list response
 */
export interface WorkspaceListResponse {
  workspaces: Workspace[];
  total: number;
}

/**
 * Workspace with session information
 */
export interface WorkspaceWithSession extends Workspace {
  activeSessionId?: X21Id;
  hasActiveSession: boolean;
  sessionStatus?: string;
}

/**
 * Response from workspace operations
 */
export interface WorkspaceOperationResponse {
  success: boolean;
  workspace?: Workspace;
  message?: string;
}

/**
 * Save Workspace Request
 */
export interface SaveWorkspaceRequest {
  workspaceId: X21Id;
  sessionId: X21Id;
}

/**
 * Save Workspace Response
 */
export interface SaveWorkspaceResponse {
  success: boolean;
  savedAt: X21Timestamp;
}

/**
 * List Workspaces Request
 */
export interface ListWorkspacesRequest {
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'lastAccessedAt' | 'name';
  orderDirection?: 'ASC' | 'DESC';
  templateId?: X21Id;
  search?: string;
}

/**
 * List Workspaces Response
 */
export interface ListWorkspacesResponse {
  workspaces: Workspace[];
  total: number;
}
