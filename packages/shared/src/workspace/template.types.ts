/**
 * Template Database and Management Types
 *
 * Contains types for template management, database storage, and initialization
 * processes. Separated from template metadata to avoid confusion.
 */

import type { X21Id, X21Timestamp } from '../app';
import type {
  TemplateType,
  TemplateMetadata,
  TemplateBuildConfig,
  TemplateDevConfig,
  TemplateDependency,
  TemplateRegistry,
  TemplateManifestEntry,
} from './template-metadata.types';

export type TemplateStatus = 'draft' | 'published' | 'deprecated' | 'archived';

/**
 * Template definition for database storage and management
 * Note: Docker fields kept for backwards compatibility during migration
 */
export interface WorkspaceTemplate {
  id: X21Id;
  name: string;
  description: string;
  type: TemplateType;
  status: TemplateStatus;
  version: string;
  // Docker fields - deprecated in new architecture but kept for compatibility
  dockerImage?: string;
  dockerTag?: string;
  metadata: TemplateMetadata;
  configuration: TemplateConfiguration;
  files: TemplateFile[];
  dependencies: TemplateDependency[];
  createdAt: X21Timestamp;
  updatedAt: X21Timestamp;
}

/**
 * Template configuration - combines build and dev config for backwards compatibility
 */
export interface TemplateConfiguration extends TemplateBuildConfig {
  ports: {
    dev: number;
    preview?: number;
  };
  healthCheck: TemplateDevConfig['healthCheck'];
}

export interface TemplateFile {
  path: string;
  content: string;
  encoding: 'utf8' | 'base64';
  executable?: boolean;
  template?: boolean; // Whether this file contains template variables
}

/**
 * Template initialization process
 */
export interface TemplateInitializationRequest {
  templateId: X21Id;
  sessionId: X21Id;
  variables?: Record<string, string>;
  customizations?: TemplateCustomization[];
}

export interface TemplateCustomization {
  type: 'file-content' | 'dependency' | 'configuration';
  target: string;
  value: unknown;
}

export interface TemplateInitializationResult {
  success: boolean;
  containerId: string;
  filesCreated: string[];
  dependenciesInstalled: string[];
  buildLogs: string[];
  error?: string;
  duration: number; // milliseconds
}

/**
 * Template build and validation
 */
export interface TemplateBuildInfo {
  id: X21Id;
  templateId: X21Id;
  version: string;
  buildStatus: 'pending' | 'building' | 'success' | 'failed';
  dockerImage?: string;
  dockerTag?: string;
  buildLogs: string[];
  artifacts: TemplateBuildArtifact[];
  createdAt: X21Timestamp;
  completedAt?: X21Timestamp;
  error?: string;
}

export interface TemplateBuildArtifact {
  type: 'docker-image' | 'archive' | 'manifest';
  name: string;
  path: string;
  size: number;
  checksum: string;
  url?: string;
}

/**
 * Template registry and management (database-specific versions)
 */

// Database-specific manifest entry with X21Id
export interface DatabaseTemplateManifestEntry
  extends Omit<TemplateManifestEntry, 'id'> {
  id: X21Id;
}

// Database-specific manifest with X21Timestamp
export interface DatabaseTemplateManifest {
  version: string;
  templates: DatabaseTemplateManifestEntry[];
  registry: TemplateRegistry;
  lastUpdated: X21Timestamp;
}
