/**
 * Template Metadata Types
 *
 * TypeScript interfaces for template.json metadata structure and related types
 * used in the new container architecture with runtime template injection.
 */

/**
 * Template metadata as defined in template.json
 */
export interface TemplateMetadata {
  /** Human-readable template name */
  name: string;

  /** Template description */
  description: string;

  /** Template version string */
  version: string;

  /** Template identifier */
  templateId: string;

  /** Template category (base, business-landing, portfolio, etc.) */
  type: TemplateType;

  /** Template category for organization */
  category: string;

  /** Difficulty level for users */
  difficulty: DifficultyLevel;

  /** Author information */
  author: string;

  /** Template license */
  license: string;

  /** Keywords for search and discovery */
  keywords: string[];

  /** Estimated setup time in seconds */
  estimatedSetupTime: number;

  /** Preview image URL */
  previewImage?: string;

  /** Documentation URL */
  documentation?: string;
}

/**
 * Build configuration for templates
 */
export interface TemplateBuildConfig {
  /** Node.js version requirement */
  nodeVersion: string;

  /** Package manager to use */
  packageManager: PackageManager;

  /** Command to build the project */
  buildCommand: string;

  /** Command to start development server */
  devCommand: string;

  /** Output directory for built files */
  outputDirectory: string;

  /** Public/static files directory */
  publicDirectory: string;

  /** Environment variables for the template */
  environmentVariables: Record<string, string>;
}

/**
 * Development server configuration
 */
export interface TemplateDevConfig {
  /** Default port for development server */
  defaultPort: number;

  /** Whether HMR is enabled */
  hmrEnabled: boolean;

  /** Health check configuration */
  healthCheck: {
    /** Health check endpoint path */
    path: string;
    /** Health check timeout in milliseconds */
    timeout: number;
    /** Health check interval in milliseconds */
    interval: number;
    /** Number of retries before considering unhealthy */
    retries: number;
  };
}

/**
 * File handling configuration for templates
 */
export interface TemplateFileConfig {
  /** Patterns to exclude from archives and injection */
  excludeFromArchive: string[];

  /** Required files that must be present in template */
  required: string[];
}

/**
 * Dependency specification for templates
 */
export interface TemplateDependency {
  /** Package name */
  name: string;

  /** Version requirement */
  version: string;

  /** Type of dependency */
  type: DependencyType;

  /** Whether the dependency is optional */
  optional?: boolean;
}

/**
 * Complete template configuration
 */
export interface TemplateConfig {
  /** Template metadata */
  metadata: TemplateMetadata;

  /** Build configuration */
  build: TemplateBuildConfig;

  /** Development configuration */
  development: TemplateDevConfig;

  /** File handling configuration */
  files: TemplateFileConfig;

  /** Template dependencies */
  dependencies: TemplateDependency[];
}

/**
 * Template type enumeration
 */
export type TemplateType =
  | 'base'
  | 'business-landing'
  | 'portfolio'
  | 'blog'
  | 'ecommerce'
  | 'custom';

/**
 * Difficulty level enumeration
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Package manager enumeration
 */
export type PackageManager = 'npm' | 'pnpm' | 'yarn';

/**
 * Dependency type enumeration
 */
export type DependencyType = 'dependency' | 'devDependency' | 'peerDependency';

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  /** Whether the template is valid */
  isValid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];

  /** Template configuration if valid */
  config?: TemplateConfig;
}

/**
 * Template injection result
 */
export interface TemplateInjectionResult {
  /** Whether injection was successful */
  success: boolean;

  /** Template ID that was injected */
  templateId: string;

  /** Number of files injected */
  filesInjected: number;

  /** Injection duration in milliseconds */
  duration: number;

  /** Error message if injection failed */
  error?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Template discovery result
 */
export interface TemplateDiscoveryResult {
  /** Template ID */
  id: string;

  /** Template configuration */
  config: TemplateConfig;

  /** File system path to template */
  path: string;

  /** Last modified timestamp */
  lastModified: string;

  /** Whether template is valid and usable */
  isValid: boolean;
}

/**
 * Template registry interface (metadata-only, no database dependencies)
 */
export interface TemplateRegistry {
  /** Registry endpoint URL */
  endpoint: string;

  /** Authentication configuration */
  authentication?: {
    /** Authentication type */
    type: 'basic' | 'token' | 'oauth';

    /** Authentication credentials */
    credentials: Record<string, string>;
  };

  /** Registry namespace */
  namespace?: string;
}

/**
 * Template manifest for registry (metadata-only)
 */
export interface TemplateManifest {
  /** Manifest version */
  version: string;

  /** Available templates */
  templates: TemplateManifestEntry[];

  /** Registry configuration */
  registry: TemplateRegistry;

  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Template manifest entry (metadata-only, uses plain string ID)
 */
export interface TemplateManifestEntry {
  /** Template ID */
  id: string;

  /** Template name */
  name: string;

  /** Template version */
  version: string;

  /** Docker image (for backwards compatibility) */
  dockerImage?: string;

  /** Docker tag (for backwards compatibility) */
  dockerTag?: string;

  /** Checksum for integrity */
  checksum: string;

  /** Archive size in bytes */
  size: number;

  /** Required dependencies */
  dependencies: string[];
}
