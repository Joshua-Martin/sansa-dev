# Backend Overview - AI Landing Page Studio

## Core Architecture Philosophy

The backend serves as the central orchestrator for the AI Landing Page Studio, implemented as a monolithic NestJS application that manages user projects, coordinates AI interactions, and orchestrates distributed preview containers. While the core backend follows a monolithic pattern for simplicity and consistency, the architecture embraces distributed computing through ephemeral preview containers that function as microservices for individual user workspaces.

The backend's primary responsibility is to provide a reliable, secure, and scalable foundation that bridges human creativity with AI assistance. It maintains authoritative state for all projects while delegating real-time preview functionality to isolated container environments, creating a hybrid architecture that balances centralized control with distributed execution.

## Request Flow and API Architecture

### HTTP API Design

The NestJS backend exposes a RESTful API that follows resource-based routing patterns, organized around core entities like projects, files, chat sessions, and exports. Each resource group is implemented as a dedicated module with its own controller, service layer, and data access patterns, ensuring clear separation of concerns and maintainable code organization.

Authentication flows through JWT-based middleware that validates user tokens and establishes request context for all subsequent operations. The authentication system integrates seamlessly with the existing user management infrastructure, providing tenant isolation and resource access control throughout the application.

Project operations form the foundation of the API, enabling users to create, update, and manage their landing page projects through standard CRUD operations. These endpoints handle project metadata, configuration settings, and lifecycle management while maintaining referential integrity with related entities like files and chat history.

### WebSocket Gateway Integration

Real-time communication happens through WebSocket gateways that manage persistent connections for chat interactions and preview updates. The WebSocket implementation uses NestJS gateway decorators to provide structured message handling, connection lifecycle management, and room-based broadcasting for project-specific updates.

Chat messages flow through WebSocket connections to enable real-time conversation experiences with AI assistance. The gateway coordinates between user input, AI processing, and response streaming to create smooth conversational interactions while maintaining message persistence and conversation context.

Preview session updates broadcast through dedicated WebSocket channels that notify frontend clients about container status changes, build completions, and hot module replacement events. This real-time coordination ensures users receive immediate feedback about their project changes without polling or manual refresh operations.

## AI Integration and Processing Pipeline

### UnifiedLlm Integration

The AI processing pipeline integrates with the existing UnifiedLlm module to provide consistent AI interactions across different language models and providers. This integration abstracts away model-specific implementation details while providing a unified interface for natural language processing and code generation capabilities.

AI requests are structured to provide comprehensive project context, including current file states, recent changes, conversation history, and user intent analysis. This context enables the AI to make informed decisions about code modifications while maintaining consistency with existing project patterns and user preferences.

The response parsing system handles the structured AI output format, extracting text responses for user communication and code changes for automated application. The `<response>` tags contain human-readable explanations of changes being made, while `<code>` tags contain the actual file modifications that need to be applied to the user's project.

### Conversation Context Management

Conversation context is maintained through a sophisticated system that tracks project state, user interactions, and AI operation history across chat sessions. This context includes recent file changes, active components, current styling themes, and conversation patterns that help the AI provide relevant and consistent assistance.

Context aggregation combines multiple data sources including project file snapshots, recent operation logs, user preference indicators, and conversation flow analysis. This comprehensive context ensures AI responses are relevant to the current project state and aligned with user expectations and communication patterns.

Memory management for conversation context implements intelligent truncation and summarization strategies to maintain performance while preserving essential information. Long conversation histories are condensed into key insights and recent interactions, ensuring AI responses remain contextually relevant without overwhelming system resources.

### Code Generation and Validation

Code generation processes transform AI outputs into concrete file system changes through a structured operation pipeline. Each AI-generated change undergoes validation, conflict resolution, and safety checking before being applied to the user's project workspace.

Validation systems verify that generated code follows project conventions, maintains syntactic correctness, and adheres to security guidelines. This includes checking for malicious code patterns, validating import statements, and ensuring generated components integrate properly with existing project structure.

Change application happens through atomic operations that can be rolled back if issues are detected. The system maintains snapshots of project state before applying AI changes, enabling quick recovery if generated code causes build failures or unexpected behavior.

## Project and File Management

### Project Lifecycle Orchestration

Project lifecycle management encompasses creation, active development, build processes, export operations, and archival workflows. Each lifecycle stage involves coordination between multiple system components including database updates, file system operations, container management, and background job scheduling.

Project creation establishes the foundational structure including database records, initial file system setup, object storage bucket creation, and preview session preparation. This process uses template-based initialization to provide users with functional starting points while maintaining flexibility for customization.

Active development phases coordinate between file system changes, AI operations, preview container updates, and real-time synchronization. The system maintains authoritative file state in object storage while providing working copies in preview containers, ensuring data consistency and enabling collaborative editing workflows.

### File System Abstraction

The file system abstraction layer provides a unified interface for managing project files across different storage backends including object storage, container volumes, and in-memory caches. This abstraction enables seamless file operations regardless of the underlying storage implementation.

File operations are implemented as atomic transactions that maintain consistency across distributed storage systems. When files are modified through AI operations or user uploads, changes are propagated to both the authoritative object storage and any active preview containers to ensure immediate visibility.

Version management tracks file changes through a combination of timestamps, content hashes, and operation logs that enable conflict resolution and change history analysis. This versioning system supports both automatic saves and explicit checkpoint creation for important project milestones.

### Template and Component Integration

The backend provides seamless integration with the component library system, enabling AI operations to query available components, insert pre-built sections, and customize component properties based on user requests. This integration includes component metadata caching, dependency resolution, and customization parameter validation.

Template application processes handle the initialization of new projects with professional starting points including complete page layouts, component arrangements, styling themes, and configuration presets. These processes ensure template integrity while allowing for immediate customization and modification.

Component insertion operations coordinate between AI decision-making, component library queries, dependency resolution, and file system updates to seamlessly add new functionality to user projects. This includes handling component customization, styling integration, and ensuring proper integration with existing project structure.

## Container Orchestration and Preview Management

### Docker Integration Architecture

The container orchestration system integrates directly with Docker APIs to provide programmatic control over preview container lifecycle management. This integration uses official Docker SDK libraries to ensure reliable container operations while maintaining proper error handling and resource management.

Container specifications are generated dynamically based on project requirements, user preferences, and resource allocation policies. Each container receives a custom configuration including volume mounts for project files, network connectivity for preview access, and resource constraints to ensure fair usage across multiple concurrent sessions.

Container lifecycle management handles creation, startup, health monitoring, and cleanup operations through automated workflows. The system implements intelligent scheduling to optimize resource utilization while ensuring responsive preview session availability for active users.

### Preview Session Coordination

Preview sessions represent the bridge between stored project data and live development environments where users can see real-time updates to their landing pages. Each session maintains isolation from other users while providing full access to project files and development tooling.

Session initialization involves container creation, file system mounting, dependency installation, and development server startup. This process is optimized for speed through container image caching, pre-built development environments, and parallel execution of initialization tasks.

Session monitoring tracks container health, resource usage, and user activity to implement appropriate lifecycle management policies. Inactive sessions are automatically cleaned up to free resources, while active sessions receive priority for resource allocation and performance optimization.

### Hot Module Replacement Integration

The HMR system creates real-time communication channels between preview containers and frontend interfaces through WebSocket connections that enable immediate visual feedback for project changes. This integration provides seamless development experiences similar to modern development environments.

File change detection within preview containers triggers automatic rebuilds and browser updates through established WebSocket connections. The system coordinates between file system events, build processes, and frontend notifications to provide smooth real-time editing experiences.

Build coordination manages the complex interaction between file changes, development server rebuilds, and browser refresh cycles. This includes handling build failures gracefully, providing error feedback through the chat system, and maintaining session state during build processes.

## Background Job Processing

### BullMQ Queue Management

The background job system uses BullMQ and Redis to provide reliable asynchronous processing for resource-intensive operations including AI processing, container management, build operations, and export generation. This queue system ensures responsive user interactions while handling complex operations in the background.

Job categorization organizes different types of background work including AI chat processing, container lifecycle operations, project builds, export generation, and maintenance tasks. Each category receives appropriate priority levels and resource allocation to ensure system responsiveness and fair resource usage.

Job persistence and retry logic provide reliability for critical operations that may fail due to temporary issues including network connectivity, resource constraints, or external service availability. The system implements intelligent retry strategies with exponential backoff and dead letter handling for persistent failures.

### AI Processing Workflows

AI processing jobs handle the complex pipeline of conversation analysis, context preparation, AI API calls, response parsing, and change application. These workflows are designed for reliability and scalability while maintaining real-time user experience through WebSocket updates.

Context preparation involves aggregating project state, conversation history, user preferences, and intent analysis into structured prompts that enable effective AI assistance. This preparation happens asynchronously to minimize response latency while ensuring comprehensive context availability.

Response processing coordinates between AI output parsing, code validation, file system updates, container synchronization, and user notification. This multi-step workflow ensures changes are applied safely while providing immediate feedback about operation status and completion.

### Build and Export Operations

Build operations transform user projects into optimized static websites through automated pipelines that handle dependency resolution, asset optimization, code compilation, and output generation. These operations run in isolated environments to ensure consistency and security.

Export workflows coordinate between build completion, artifact packaging, deployment preparation, and delivery mechanisms. This includes generating downloadable archives, preparing deployment packages, and coordinating with external hosting platforms when requested.

Operation monitoring provides real-time status updates for long-running build and export processes through WebSocket notifications and job status tracking. Users receive immediate feedback about operation progress, completion status, and any issues that require attention.

## Data Persistence and Storage

### Database Schema Organization

The database schema follows domain-driven design principles with clear entity boundaries and relationships that support the application's core workflows. Primary entities include users, projects, files, chat messages, preview sessions, and operations, each with appropriate foreign key relationships and indexing strategies.

Multi-tenant data isolation is implemented through tenant-aware queries and row-level security policies that ensure users can only access their own data. This isolation extends through all database operations including queries, updates, and background maintenance tasks.

Data consistency is maintained through transaction management, foreign key constraints, and application-level validation that ensures referential integrity across related entities. Critical operations use database transactions to ensure atomic updates across multiple tables.

### Object Storage Integration

Object storage provides scalable and reliable persistence for project files, build artifacts, and user-generated content through S3-compatible APIs that work consistently across development and production environments. This storage system handles file versioning, access control, and content delivery optimization.

File organization uses hierarchical key structures that enable efficient querying and management of project-related assets. This includes project-specific namespacing, version-based file naming, and metadata tagging that supports automated lifecycle management.

Storage lifecycle management implements automated policies for archiving inactive projects, cleaning up temporary build artifacts, and optimizing storage costs through intelligent tiering and compression strategies.

### Caching and Performance Optimization

Caching strategies improve system performance through Redis-based caching of frequently accessed data including user sessions, project metadata, component library information, and AI context data. This caching reduces database load while improving response times for common operations.

Cache invalidation policies ensure data consistency by automatically updating cached information when underlying data changes. This includes project-specific cache keys, user-specific session data, and global cache entries for shared resources like component libraries.

Performance monitoring tracks cache hit rates, response times, and resource utilization to identify optimization opportunities and ensure system scalability. This monitoring informs caching strategy adjustments and resource allocation decisions.

## Security and Access Control

### Authentication and Authorization

The security model builds upon JWT-based authentication with comprehensive authorization policies that control access to projects, files, preview sessions, and system resources. These policies are enforced consistently across all API endpoints and WebSocket connections.

Resource-level permissions ensure users can only access their own projects and associated resources including files, chat history, and preview sessions. This includes preventing unauthorized access to container endpoints and object storage resources.

API security implements comprehensive input validation, SQL injection prevention, and cross-site scripting protection through framework-level middleware and custom validation decorators. All user inputs undergo sanitization and validation before processing.

### Container Security

Container isolation provides security boundaries between user workspaces through Docker's built-in isolation features combined with custom network policies and resource constraints. Each preview container operates in a restricted environment that prevents interference with other users or system resources.

Resource quotas limit container resource consumption including CPU, memory, storage, and network bandwidth to prevent resource exhaustion attacks and ensure fair usage across multiple concurrent users. These limits are enforced at the container runtime level.

Network security restricts container network access to only necessary services and prevents containers from accessing internal system resources or other user containers. This includes custom network policies and firewall rules that maintain strict isolation.

### Data Protection

Data encryption protects sensitive information including user credentials, project data, and communication channels through industry-standard encryption protocols. This includes database encryption, object storage encryption, and WebSocket connection security.

Audit logging tracks all significant system operations including user authentication, project modifications, AI operations, and administrative actions. These logs support security monitoring, compliance requirements, and incident investigation workflows.

Privacy protection ensures user data is handled appropriately through data minimization policies, retention limits, and secure deletion procedures. This includes proper handling of chat history, project data, and user-generated content throughout the system lifecycle.

## Monitoring and Observability

### Application Performance Monitoring

Performance monitoring provides comprehensive visibility into system behavior including API response times, database query performance, container operation metrics, and user interaction patterns. This monitoring supports proactive issue identification and system optimization.

Error tracking captures and analyzes system errors including application exceptions, container failures, AI processing errors, and user-reported issues. This tracking enables rapid issue resolution and system reliability improvements.

Resource monitoring tracks system resource utilization including CPU, memory, storage, and network usage across all system components. This monitoring supports capacity planning and resource allocation optimization.

### Business Intelligence

Usage analytics provide insights into user behavior, feature adoption, system performance, and business metrics that support product development and operational decisions. This includes tracking user engagement, project creation patterns, and feature utilization.

AI operation analysis tracks the effectiveness of AI assistance including response quality, user satisfaction indicators, and operation success rates. This analysis supports AI model optimization and user experience improvements.

System health dashboards provide real-time visibility into system status, performance metrics, and operational indicators for both technical teams and business stakeholders. These dashboards support proactive system management and informed decision-making.

## Integration and Extensibility

### External Service Integration

The backend architecture supports integration with external services including hosting platforms, analytics providers, and third-party APIs through extensible adapter patterns. These integrations maintain loose coupling while providing powerful functionality for users.

Webhook support enables integration with external systems that need to receive notifications about project changes, build completions, or export operations. This includes secure webhook delivery, retry mechanisms, and authentication handling.

API extensibility provides mechanisms for adding new functionality, integrating additional AI providers, and supporting new export targets without requiring core system modifications. This extensibility ensures long-term system evolution and customization capabilities.

### Development and Testing Support

The backend provides comprehensive support for development and testing workflows including database seeding, test data generation, and isolated testing environments. This support ensures reliable development practices and consistent testing outcomes.

Environment configuration management enables consistent deployment across development, staging, and production environments while maintaining appropriate security boundaries and resource allocations for each environment.

Documentation and API specification generation provide automatically updated documentation for all API endpoints, data schemas, and integration patterns. This documentation supports both internal development and potential future API consumers.
