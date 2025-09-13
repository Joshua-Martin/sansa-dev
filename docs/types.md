## Component Library and Template Types

### Component Definition Structure

Component library types define the structure for pre-built landing page sections, individual components, and layout templates that the AI can insert into user projects. Each component includes metadata, usage guidelines, customization options, and dependency requirements.

```typescript
export type ComponentCategory =
  | 'hero'
  | 'navigation'
  | 'features'
  | 'testimonials'
  | 'pricing'
  | 'contact'
  | 'footer'
  | 'cta'
  | 'gallery'
  | 'team'
  | 'blog'
  | 'custom';

export type ComponentComplexity = 'simple' | 'medium' | 'complex';
export type ComponentStatus = 'draft' | 'published' | 'deprecated';

export interface ComponentDefinition {
  id: UUID;
  name: string;
  description: string;
  category: ComponentCategory;
  complexity: ComponentComplexity;
  status: ComponentStatus;
  version: string;
  tags: string[];
  metadata: ComponentMetadata;
  code: ComponentCode;
  customization: ComponentCustomization;
  dependencies: ComponentDependency[];
  preview: ComponentPreview;
  documentation: ComponentDocumentation;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ComponentMetadata {
  author: string;
  license: string;
  responsive: boolean;
  accessibility: AccessibilityLevel;
  browserSupport: BrowserSupport;
  performance: PerformanceMetrics;
  usageCount: number;
  rating: number; // 1-5
  keywords: string[];
}

export type AccessibilityLevel = 'basic' | 'aa' | 'aaa';

export interface BrowserSupport {
  chrome: string; // Minimum version
  firefox: string;
  safari: string;
  edge: string;
  mobile: boolean;
}

export interface PerformanceMetrics {
  renderTime: number; // ms
  bundleSize: number; // bytes
  interactiveTime: number; // ms
  cumulativeLayoutShift: number;
}

export interface ComponentCode {
  astro?: string; // Astro component code
  react?: string; // React component (if needed)
  html?: string; // Static HTML fallback
  css?: string; // Component-specific styles
  javascript?: string; // Component behavior
  dependencies: string[]; // NPM packages required
}

export interface ComponentCustomization {
  properties: CustomizableProperty[];
  slots: ComponentSlot[];
  variants: ComponentVariant[];
  themes: ThemeCompatibility[];
}

export interface CustomizableProperty {
  name: string;
  type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'color'
    | 'image'
    | 'array'
    | 'object';
  description: string;
  defaultValue: any;
  required: boolean;
  validation?: PropertyValidation;
  group?: string; // For organizing in UI
}

export interface PropertyValidation {
  min?: number;
  max?: number;
  pattern?: string; // Regex pattern
  options?: string[]; // Enum options
  format?: 'email' | 'url' | 'color' | 'date';
}

export interface ComponentSlot {
  name: string;
  description: string;
  required: boolean;
  acceptedTypes: ComponentCategory[];
  maxItems?: number;
  defaultContent?: string;
}

export interface ComponentVariant {
  name: string;
  description: string;
  properties: Record<string, any>;
  previewImage: string;
  code?: Partial<ComponentCode>;
}

export interface ThemeCompatibility {
  themeId: UUID;
  compatible: boolean;
  overrides?: Record<string, any>;
  notes?: string;
}

export interface ComponentDependency {
  package: string;
  version: string;
  type: 'dependency' | 'devDependency' | 'peerDependency';
  optional: boolean;
}

export interface ComponentPreview {
  thumbnail: string; // Image URL
  images: string[]; // Multiple preview images
  liveDemo?: string; // Demo URL
  codepen?: string; // CodePen URL
  figma?: string; // Figma design URL
}

export interface ComponentDocumentation {
  readme: string; // Markdown documentation
  examples: ComponentExample[];
  changelog: ChangelogEntry[];
  troubleshooting: TroubleshootingItem[];
}

export interface ComponentExample {
  name: string;
  description: string;
  code: string;
  preview?: string;
  properties: Record<string, any>;
}

export interface ChangelogEntry {
  version: string;
  date: Timestamp;
  changes: string[];
  breaking?: boolean;
}

export interface TroubleshootingItem {
  issue: string;
  solution: string;
  tags: string[];
}
```

### Template and Theme System

Template types define complete landing page structures that serve as starting points for new projects. Templates include page layouts, component arrangements, default styling, and configuration presets that provide users with professional starting points.

````typescript
export type TemplateType = 'landing-page' | 'multi-page' | # Types Overview - AI Landing Page Studio

## Core Philosophy and Data Flow

The type system for the AI Landing Page Studio follows a contract-first approach, ensuring type safety and consistency across the entire application stack. All types are centrally defined in the shared package and exported for use by both frontend and backend components. This approach eliminates type mismatches and provides compile-time safety for all inter-service communication.

The data structures are designed around the core user workflow: creating projects, having conversational interactions with AI, applying changes through patches, managing preview sessions, and exporting final builds. Each major functional area has dedicated type definitions that work together to support seamless data flow throughout the application.

## Base Utility Types

```typescript
// Common utility types used throughout the application
export type UUID = string;
export type Timestamp = string; // ISO 8601 format
export type FileSize = number; // bytes
export type Port = number;
export type ContainerStatus = 'creating' | 'running' | 'stopping' | 'stopped' | 'error';
export type ResourceQuota = {
  cpu: number; // CPU cores
  memory: number; // MB
  storage: number; // MB
  containers: number;
};

// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Timestamp;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
````

## Project Management Types

### Project Structure and Metadata

Projects represent the fundamental unit of work within the application. Each project contains all the information needed to generate a complete landing page, including file contents, configuration settings, AI conversation history, and build artifacts.

```typescript
export type ProjectStatus =
  | 'draft'
  | 'active'
  | 'building'
  | 'published'
  | 'error'
  | 'archived';
export type ProjectVisibility = 'private' | 'public' | 'shared';

export interface Project {
  id: UUID;
  name: string;
  description?: string;
  ownerId: UUID;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  templateId?: UUID;
  themeId?: UUID;
  configuration: ProjectConfiguration;
  metadata: ProjectMetadata;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastBuildAt?: Timestamp;
  publishedAt?: Timestamp;
}

export interface ProjectConfiguration {
  // SEO and metadata settings
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    favicon?: string;
  };
  // Build and export settings
  build: {
    outputFormat: 'static' | 'spa';
    optimization: 'none' | 'standard' | 'aggressive';
    minify: boolean;
    compress: boolean;
  };
  // Domain and hosting
  domain?: {
    custom?: string;
    subdomain?: string;
    ssl: boolean;
  };
  // Analytics integration
  analytics?: {
    googleAnalytics?: string;
    plausible?: string;
    customScript?: string;
  };
}

export interface ProjectMetadata {
  fileCount: number;
  totalSize: FileSize;
  lastModifiedBy: UUID;
  version: number;
  buildCount: number;
  exportCount: number;
  previewUrl?: string;
  liveUrl?: string;
}

// Project creation and updates
export interface CreateProjectRequest {
  name: string;
  description?: string;
  templateId?: UUID;
  themeId?: UUID;
  visibility?: ProjectVisibility;
  configuration?: Partial<ProjectConfiguration>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  visibility?: ProjectVisibility;
  configuration?: Partial<ProjectConfiguration>;
}

export interface ProjectListItem {
  id: UUID;
  name: string;
  description?: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  updatedAt: Timestamp;
  previewImage?: string;
  metadata: Pick<ProjectMetadata, 'fileCount' | 'totalSize' | 'version'>;
}
```

### File System Representation

The virtual file system within each project uses a hierarchical structure that mirrors traditional web development patterns. File entities contain the complete information needed to reconstruct the project workspace, including file paths, content, MIME types, modification timestamps, and dependency relationships.

```typescript
export type FileType = 'file' | 'directory';
export type MimeType = string;

export interface ProjectFile {
  id: UUID;
  workspaceId: UUID;
  path: string; // Full path within project (e.g., '/src/components/Header.astro')
  name: string; // File name only
  type: FileType;
  mimeType?: MimeType;
  content?: string; // Text content for text files
  size: FileSize;
  encoding?: 'utf8' | 'base64';
  isGenerated: boolean; // Whether this file was AI-generated
  parentId?: UUID; // Parent directory ID
  dependencies?: string[]; // Paths of files this file depends on
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

export interface FileTree {
  files: ProjectFile[];
  directories: ProjectDirectory[];
  root: UUID;
}

export interface ProjectDirectory {
  id: UUID;
  workspaceId: UUID;
  path: string;
  name: string;
  parentId?: UUID;
  childIds: UUID[];
  createdAt: Timestamp;
}

// File operations
export interface CreateFileRequest {
  path: string;
  content?: string;
  mimeType?: MimeType;
  encoding?: 'utf8' | 'base64';
}

export interface UpdateFileRequest {
  content?: string;
  path?: string; // For moving files
}

export interface FileOperationResult {
  success: boolean;
  file?: ProjectFile;
  error?: string;
  conflictResolution?: 'overwrite' | 'rename' | 'skip';
}
```

### Project Status and Lifecycle

Project lifecycle management requires comprehensive status tracking that reflects the current state of various project components. Status types cover project creation, active editing, preview generation, build processes, export operations, and error states.

```typescript
export type BuildStatus =
  | 'idle'
  | 'queued'
  | 'building'
  | 'success'
  | 'failed'
  | 'cancelled';
export type ExportStatus =
  | 'idle'
  | 'preparing'
  | 'building'
  | 'uploading'
  | 'success'
  | 'failed';

export interface ProjectBuild {
  id: UUID;
  workspaceId: UUID;
  status: BuildStatus;
  triggeredBy: 'user' | 'auto-save' | 'ai-change' | 'export';
  startedAt: Timestamp;
  completedAt?: Timestamp;
  duration?: number; // milliseconds
  logs: BuildLog[];
  artifacts?: BuildArtifact[];
  error?: BuildError;
}

export interface BuildLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Timestamp;
  source?: string; // Which build tool generated the log
}

export interface BuildArtifact {
  path: string;
  size: FileSize;
  mimeType: MimeType;
  url: string; // Object storage URL
  checksum: string;
}

export interface BuildError {
  code: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
}

export interface ProjectExport {
  id: UUID;
  workspaceId: UUID;
  buildId: UUID;
  status: ExportStatus;
  exportType: 'download' | 'deploy' | 'cdn';
  destination?: {
    platform?: 'vercel' | 'netlify' | 'aws-s3' | 'custom';
    url?: string;
    domain?: string;
  };
  downloadUrl?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  error?: string;
}
```

## Chat and AI Interaction Types

### Message Structure and Conversation Flow

Chat message types support rich conversational interactions between users and the AI system. Each message contains identification information, content data, timestamp information, and relationship metadata that enables proper conversation threading and context maintenance.

```typescript
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'processing'
  | 'completed'
  | 'failed';

export interface ChatMessage {
  id: UUID;
  workspaceId: UUID;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  metadata?: MessageMetadata;
  attachments?: MessageAttachment[];
  operations?: AIOperation[];
  parentId?: UUID; // For threading
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface MessageMetadata {
  userAgent?: string;
  ipAddress?: string;
  processingTime?: number; // ms for AI responses
  tokenCount?: number;
  confidence?: number; // 0-1 for AI responses
  intent?: string; // Detected user intent
  entities?: ExtractedEntity[];
}

export interface MessageAttachment {
  id: UUID;
  name: string;
  mimeType: MimeType;
  size: FileSize;
  url: string;
  type: 'image' | 'file' | 'link' | 'code-snippet';
}

export interface ExtractedEntity {
  type: 'component' | 'color' | 'font' | 'layout' | 'content';
  value: string;
  confidence: number;
  context?: string;
}

// Real-time streaming types
export interface MessageChunk {
  messageId: UUID;
  content: string;
  isComplete: boolean;
  chunkIndex: number;
}

export interface ConversationContext {
  workspaceId: UUID;
  recentMessages: ChatMessage[];
  currentFocus?: string; // Current file or component being discussed
  userPreferences?: UserPreferences;
  projectState: ProjectStateSnapshot;
}

export interface UserPreferences {
  communicationStyle: 'concise' | 'detailed' | 'technical';
  confirmChanges: boolean;
  explainChanges: boolean;
  suggestImprovements: boolean;
}
```

### AI Operation Types

AI operations represent the bridge between natural language requests and concrete system actions. Operation types include content generation, styling modifications, component insertion, layout adjustments, and configuration updates.

```typescript
export type AIOperationType =
  | 'file-create'
  | 'file-update'
  | 'file-delete'
  | 'component-insert'
  | 'style-update'
  | 'content-update'
  | 'layout-change'
  | 'config-update';

export type OperationStatus =
  | 'pending'
  | 'applying'
  | 'completed'
  | 'failed'
  | 'rolled-back';

export interface AIOperation {
  id: UUID;
  messageId: UUID;
  type: AIOperationType;
  description: string; // Human-readable description
  status: OperationStatus;
  parameters: OperationParameters;
  preview?: OperationPreview;
  result?: OperationResult;
  rollbackInfo?: RollbackInfo;
  createdAt: Timestamp;
  appliedAt?: Timestamp;
}

export interface OperationParameters {
  targetPath?: string;
  componentType?: string;
  changes?: Record<string, any>;
  position?: InsertPosition;
  validation?: ValidationRules;
}

export interface InsertPosition {
  type: 'append' | 'prepend' | 'after' | 'before' | 'replace';
  reference?: string; // CSS selector or component ID
}

export interface ValidationRules {
  required?: string[];
  maxSize?: FileSize;
  allowedTypes?: MimeType[];
  schema?: object; // JSON schema
}

export interface OperationPreview {
  affectedFiles: string[];
  estimatedChanges: number;
  potentialIssues?: string[];
  dependencies?: string[];
}

export interface OperationResult {
  success: boolean;
  filesChanged: string[];
  linesAdded: number;
  linesRemoved: number;
  error?: string;
  warnings?: string[];
}

export interface RollbackInfo {
  originalContent?: Record<string, string>;
  createdFiles?: string[];
  modifiedFiles?: string[];
  canRollback: boolean;
}
```

### Context and State Management

Conversation context types maintain the information needed for the AI to understand ongoing discussions and make appropriate decisions. Context includes project state snapshots, recent change history, user preference indicators, and conversation flow tracking.

```typescript
export interface ProjectStateSnapshot {
  workspaceId: UUID;
  timestamp: Timestamp;
  fileCount: number;
  componentCount: number;
  recentChanges: RecentChange[];
  currentTheme?: UUID;
  activeSections?: string[];
  buildStatus: BuildStatus;
}

export interface RecentChange {
  type: 'file' | 'component' | 'style' | 'config';
  path: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: Timestamp;
  description: string;
}

export interface ChatSession {
  id: UUID;
  workspaceId: UUID;
  userId: UUID;
  messages: ChatMessage[];
  context: ConversationContext;
  isActive: boolean;
  startedAt: Timestamp;
  lastActivityAt: Timestamp;
  endedAt?: Timestamp;
}

// AI model configuration
export interface AIModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  contextWindow: number;
  capabilities: AICapability[];
}

export interface AICapability {
  name: string;
  description: string;
  enabled: boolean;
  parameters?: Record<string, any>;
}
```

## Preview and Workspace Types

### Preview Session Management

Preview sessions represent isolated workspace environments where users can see live updates to their landing pages. Session types include unique identifiers, container information, port mappings, resource allocations, and lifecycle status indicators.

```typescript
export interface PreviewSession {
  id: UUID;
  workspaceId: UUID;
  userId: UUID;
  containerId?: string; // Docker container ID
  containerName: string;
  status: ContainerStatus;
  url: string; // Preview URL
  port: Port;
  resources: ResourceAllocation;
  environment: PreviewEnvironment;
  createdAt: Timestamp;
  lastAccessedAt: Timestamp;
  expiresAt: Timestamp;
  isReady: boolean;
}

export interface ResourceAllocation {
  cpu: number; // CPU cores allocated
  memory: number; // MB allocated
  storage: number; // MB allocated
  networkBandwidth: number; // MB/s limit
}

export interface PreviewEnvironment {
  nodeVersion: string;
  buildTool: 'vite' | 'webpack' | 'astro';
  environmentVariables: Record<string, string>;
  workspaceMount: string; // Container path
  outputPath: string; // Build output path
  hmrEnabled: boolean;
  devServerPort: Port;
}

// Preview session operations
export interface CreatePreviewSessionRequest {
  workspaceId: UUID;
  templateId?: UUID;
  resources?: Partial<ResourceAllocation>;
  environment?: Partial<PreviewEnvironment>;
}

export interface PreviewSessionResponse {
  session: PreviewSession;
  buildLogs?: string[];
  estimatedReadyTime?: number; // seconds
}

export interface PreviewSessionStatus {
  sessionId: UUID;
  status: ContainerStatus;
  isReady: boolean;
  url?: string;
  error?: string;
  metrics: ContainerMetrics;
}

export interface ContainerMetrics {
  cpuUsage: number; // percentage
  memoryUsage: number; // MB
  networkIn: number; // bytes
  networkOut: number; // bytes
  uptime: number; // seconds
  buildTime?: number; // seconds
}
```

### Container Orchestration Types

Container management types define the specifications for preview workspace containers, including base image references, volume mounts, network configurations, and resource constraints. These types ensure consistent environment setup across all user sessions.

```typescript
export interface ContainerSpec {
  image: string; // Docker image name
  tag: string; // Image tag/version
  command?: string[];
  args?: string[];
  workingDir: string;
  user?: string;
  environment: Record<string, string>;
  volumes: VolumeMount[];
  ports: PortMapping[];
  resources: ResourceConstraints;
  labels: Record<string, string>;
  network?: NetworkConfig;
}

export interface VolumeMount {
  source: string; // Host path or volume name
  target: string; // Container path
  readOnly?: boolean;
  type: 'bind' | 'volume' | 'tmpfs';
}

export interface PortMapping {
  containerPort: Port;
  hostPort?: Port;
  protocol: 'tcp' | 'udp';
  expose?: boolean;
}

export interface ResourceConstraints {
  cpuLimit: number; // CPU cores
  memoryLimit: number; // MB
  storageLimit: number; // MB
  pidsLimit?: number;
  ulimits?: Record<string, number>;
}

export interface NetworkConfig {
  name: string;
  aliases?: string[];
  ipv4Address?: string;
  driveropts?: Record<string, string>;
}

export interface ContainerOperation {
  type: 'create' | 'start' | 'stop' | 'restart' | 'remove' | 'update';
  containerId: string;
  parameters?: Record<string, any>;
  timestamp: Timestamp;
  result?: ContainerOperationResult;
}

export interface ContainerOperationResult {
  success: boolean;
  containerId?: string;
  error?: string;
  logs?: string[];
  duration: number; // milliseconds
}
```

### Hot Module Replacement Integration

HMR types define the WebSocket communication protocols between preview containers and the frontend interface. These types support real-time file change notifications, build status updates, and error reporting that enables seamless live preview functionality.

```typescript
export type HMREventType =
  | 'file-changed'
  | 'build-start'
  | 'build-complete'
  | 'build-error'
  | 'hot-reload'
  | 'full-reload'
  | 'connection-status';

export interface HMREvent {
  type: HMREventType;
  sessionId: UUID;
  timestamp: Timestamp;
  data: HMREventData;
}

export interface HMREventData {
  files?: string[]; // Changed file paths
  buildId?: UUID;
  error?: BuildError;
  duration?: number; // milliseconds
  modules?: ModuleUpdate[];
  reload?: ReloadInfo;
}

export interface ModuleUpdate {
  path: string;
  type: 'added' | 'changed' | 'removed';
  acceptedBy?: string[]; // Modules that can handle this update
  timestamp: Timestamp;
}

export interface ReloadInfo {
  type: 'hot' | 'full';
  reason: string;
  affectedModules?: string[];
  preserveState?: boolean;
}

// WebSocket message types for HMR
export interface HMRWebSocketMessage {
  id: UUID;
  type: 'event' | 'command' | 'response';
  sessionId: UUID;
  timestamp: Timestamp;
  payload: HMREvent | HMRCommand | HMRResponse;
}

export interface HMRCommand {
  action: 'subscribe' | 'unsubscribe' | 'ping' | 'reload' | 'build';
  parameters?: Record<string, any>;
}

export interface HMRResponse {
  commandId: UUID;
  success: boolean;
  data?: any;
  error?: string;
}

export interface FileWatchConfig {
  patterns: string[]; // Glob patterns to watch
  ignorePatterns: string[]; // Patterns to ignore
  debounceMs: number; // Debounce delay
  aggregateChanges: boolean; // Combine rapid changes
  includeContent: boolean; // Send file content with changes
}

export interface PreviewConnection {
  sessionId: UUID;
  userId: UUID;
  websocketId: string;
  connectedAt: Timestamp;
  lastPingAt: Timestamp;
  isActive: boolean;
  subscriptions: HMRSubscription[];
}

export interface HMRSubscription {
  eventType: HMREventType;
  filters?: Record<string, any>;
  createdAt: Timestamp;
}
```

## Component Library and Template Types

### Component Definition Structure

Component library types define the structure for pre-built landing page sections, individual components, and layout templates that the AI can insert into user projects. Each component includes metadata, usage guidelines, customization options, and dependency requirements.

Component metadata encompasses display names, descriptions, category classifications, usage examples, and compatibility information that helps the AI make appropriate selection and customization decisions.

Customization schemas define the parameters that can be modified for each component, including styling options, content placeholders, behavioral configurations, and responsive behavior adjustments.

### Template and Theme System

Template types define complete landing page structures that serve as starting points for new projects. Templates include page layouts, component arrangements, default styling, and configuration presets that provide users with professional starting points.

Theme types define consistent visual styling that can be applied across components and templates. Themes include color palettes, typography settings, spacing systems, animation preferences, and responsive breakpoint configurations.

Template customization types define how templates can be modified while maintaining design coherence, including approved component substitutions, layout variations, and styling overrides.

### Asset and Media Management

Asset types define how images, videos, fonts, and other media files are referenced, stored, and optimized within the component library and user projects. Asset metadata includes optimization settings, responsive variants, accessibility information, and usage licensing.

Media processing types define the transformations, optimizations, and format conversions that are automatically applied to uploaded assets to ensure optimal performance and compatibility.

## Build and Export Types

### Build Pipeline Configuration

Build types define the complete process for converting user projects into optimized static websites. Build configuration includes compilation settings, optimization levels, output formats, and deployment targets.

Build artifacts encompass the generated files, optimization reports, performance metrics, and deployment packages that result from successful build operations. This information supports quality assurance and deployment planning.

Error reporting types provide structured information about build failures, including error codes, affected files, suggested fixes, and recovery options that help users understand and resolve issues.

### Export and Deployment Types

Export types define the various output formats and deployment targets supported by the system. Export configurations include hosting platform specifics, custom domain settings, SSL certificate management, and CDN integration options.

Deployment status types track the progress of export operations, including artifact generation, platform uploads, DNS configuration, and verification testing that ensures successful deployment.

Archive types define how completed projects are packaged for download, including file compression, directory structures, documentation inclusion, and compatibility considerations.

## Authentication and Authorization Integration

### User Context and Permissions

While authentication types are already established, project-specific authorization types extend the base authentication system to support resource-specific permissions. These types define user access levels for individual projects, sharing permissions, and collaborative editing rights.

Project ownership types establish the relationship between users and their projects, including transfer capabilities, access delegation, and inheritance rules for shared projects.

Session authorization types define how authenticated users are validated for specific operations like preview access, export privileges, and component library usage.

### Multi-tenant Data Isolation

Tenant context types ensure proper data isolation between different user accounts and organizations. These types define tenant boundaries, resource quotas, feature access levels, and security policies.

Resource allocation types define the limits and quotas that apply to each tenant, including storage usage, container resources, build frequency, and export operations.

## Real-time Communication Types

### WebSocket Message Protocols

Real-time communication types define the structured message formats used for WebSocket communication between frontend, backend, and preview containers. Message types include identification headers, payload structures, acknowledgment mechanisms, and error handling protocols.

Event types define the various system events that trigger real-time notifications, including file changes, build completions, error conditions, and status updates that need immediate user attention.

Subscription types define how clients register for specific types of real-time updates, including filtering criteria, delivery preferences, and connection management settings.

### Status Broadcasting

Status broadcast types define how system-wide information is communicated to connected clients, including maintenance notifications, feature updates, performance alerts, and service availability changes.

Notification types encompass both real-time alerts and persistent notifications that inform users about important events, completed operations, and system status changes.

## Error Handling and Validation Types

### Comprehensive Error Classification

Error types provide structured classification of all potential system errors, including user input errors, system failures, external service issues, and resource constraints. Each error type includes severity levels, user-facing messages, technical details, and suggested resolution steps.

Validation error types specifically address input validation failures, schema violations, constraint breaches, and data consistency issues that can occur during user interactions and system operations.

### Recovery and Retry Logic

Recovery types define the automatic and manual recovery options available for different error conditions, including retry mechanisms, rollback procedures, and alternative execution paths.

Diagnostic types provide the information needed for troubleshooting and system monitoring, including error context, system state snapshots, and performance indicators that help identify root causes.

## Performance and Monitoring Types

### Metrics and Analytics

Performance metric types define the measurements collected throughout the system, including response times, resource utilization, error rates, and user interaction patterns that inform system optimization decisions.

Analytics types encompass user behavior tracking, feature usage statistics, system performance trends, and business metrics that support product development and operational decisions.

### Resource Management

Resource quota types define the limits and constraints that apply to different system components, including user allocations, container resources, storage limits, and processing quotas.

Capacity planning types provide the information needed for system scaling decisions, including usage projections, resource trends, and growth planning data.
