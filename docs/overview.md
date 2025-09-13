# Project Overview: AI-Powered Landing Page Studio

## Project Goals and Vision

This project is a multi-tenant web application that empowers non-technical users to create beautiful, SEO-optimized landing pages through natural language interactions with AI. The core philosophy is design-first development with a focus on high-quality output that requires minimal JavaScript and maximizes performance and search engine visibility.

The primary objectives are:

- Enable users to describe desired changes in plain English and receive immediate visual feedback
- Generate static HTML with minimal JavaScript for optimal performance and SEO
- Provide a comprehensive library of pre-built, high-quality sections and components
- Deliver a seamless authoring experience with real-time preview capabilities
- Ensure all generated sites follow modern web standards and accessibility guidelines

## Architecture Overview

The application follows a modern full-stack architecture built entirely in TypeScript, leveraging a pnpm monorepo structure for code organization and dependency management. The system is designed around three core principles: real-time collaboration, stateless scalability, and security through isolation.

### Core Components

**Frontend Application**: A Next.js application using the App Router pattern that serves as the primary user interface. This handles user authentication, project management, chat interactions with AI, file tree navigation, and live preview orchestration through embedded iframes.

**Backend API**: A NestJS application that manages all server-side logic including project persistence, file operations, AI patch validation, preview session management, build processes, and export functionality. The backend is designed to be stateless and horizontally scalable.

**Shared Package**: Contains all TypeScript interfaces, types, schemas, and utilities that are used across both frontend and backend applications, ensuring type safety and consistency throughout the system.

**Preview Infrastructure**: An isolated preview environment that spins up ephemeral workspaces containing Vite development servers running Astro builds. Each user session gets its own sandboxed preview environment with hot module replacement capabilities.

## Technology Stack

### Core Framework Stack

- **Frontend**: Next.js with App Router for server-side rendering and client-side interactivity
- **Backend**: NestJS with modular architecture for API endpoints and WebSocket gateways
- **Output Generator**: Astro for generating static HTML with minimal JavaScript
- **Database**: PostgreSQL for metadata storage with Prisma as the ORM
- **Storage**: Object storage (S3/R2/GCS) for file persistence and asset management

### Development and Deployment

- **Package Management**: pnpm with workspace support for monorepo management
- **Containerization**: Docker with dev containers for consistent development environments
- **Styling**: TailwindCSS with design tokens and optional shadcn/ui components
- **Real-time Communication**: WebSockets for live preview updates and build status
- **Job Processing**: BullMQ for background tasks like builds and exports

### Quality and Performance

- **Code Quality**: ESLint and Prettier for consistent code formatting
- **Testing**: Automated Lighthouse and Axe accessibility testing on exports
- **Security**: Content Security Policy, sandboxed iframes, and resource quotas
- **Monitoring**: Structured logging and performance metrics

## Project Structure

```
/
├── packages/
│   ├── frontend/                    # Next.js application
│   │   ├── src/
│   │   │   ├── app/                 # App Router pages and layouts
│   │   │   ├── components/          # React components
│   │   │   │   ├── ui/              # Base UI components
│   │   │   │   ├── chat/            # Chat interface components
│   │   │   │   ├── editor/          # File tree and editor components
│   │   │   │   └── preview/         # Preview iframe management
│   │   │   ├── lib/                 # Client utilities and configurations
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   └── store/               # Client-side state management
│   │   ├── public/                  # Static assets
│   │   └── package.json
│   │
│   ├── backend/                     # NestJS application
│   │   ├── src/
│   │   │   ├── modules/             # Feature modules
│   │   │   │   ├── auth/            # Authentication and authorization
│   │   │   │   ├── projects/        # Project management
│   │   │   │   ├── files/           # File operations
│   │   │   │   ├── preview/         # Preview session management
│   │   │   │   ├── export/          # Build and export functionality
│   │   │   │   └── tenants/         # Multi-tenant support
│   │   │   ├── common/              # Shared utilities and guards
│   │   │   ├── database/            # Database configuration and migrations
│   │   │   └── storage/             # Object storage integration
│   │   └── package.json
│   │
│   ├── shared/                      # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/               # TypeScript interfaces
│   │   │   │   ├── project.ts       # Project-related types
│   │   │   │   ├── file.ts          # File operation types
│   │   │   │   ├── preview.ts       # Preview session types
│   │   │   │   └── patch.ts         # AI patch operation types
│   │   │   ├── schemas/             # Validation schemas
│   │   │   ├── constants/           # Shared constants
│   │   │   └── utils/               # Shared utility functions
│   │   └── package.json
│   │
│   └── component-lib/               # Pre-built component library
│       ├── src/
│       │   ├── sections/            # Landing page sections
│       │   ├── components/          # Reusable components
│       │   ├── layouts/             # Page layouts
│       │   └── themes/              # Design system themes
│       └── package.json
│
├── docker-compose.yml               # Multi-service Docker configuration
├── .devcontainer/                   # Dev container configuration
│   ├── devcontainer.json           # VS Code dev container settings
│   ├── Dockerfile                   # Development environment image
│   └── setup.sh                    # Post-creation setup script
├── pnpm-workspace.yaml             # Monorepo workspace configuration
└── package.json                    # Root package configuration
```

## Data Flow and User Experience

The application follows a streamlined workflow designed to minimize complexity while maximizing creative freedom. Users begin by creating or opening a project, which triggers the backend to establish a preview session with an isolated workspace and development server.

When users interact with the AI chat interface, their natural language requests are processed and converted into structured patch operations. These operations are validated by the backend and applied to the workspace, triggering immediate hot module replacement updates in the preview iframe.

The system maintains an authoritative file store in object storage, with workspace sessions serving as ephemeral working copies. Autosave functionality ensures changes are persisted without user intervention, while explicit save actions provide control over persistence timing.

Export functionality processes the current project state through a build pipeline, generating optimized static assets that can be downloaded or deployed directly to hosting platforms.

## Security and Isolation Model

Security is implemented through multiple layers of isolation and validation. Preview sessions run in sandboxed environments with strict resource quotas and network access controls. All file operations are validated against path whitelists and content policies.

The frontend iframe preview is served from isolated subdomains with Content Security Policy headers and sandbox attributes to prevent malicious code execution. API endpoints implement comprehensive authentication and authorization checks, ensuring tenant data isolation.

User-generated content undergoes validation and sanitization before being processed, with AI patch operations constrained to safe file modifications within approved project structures.

## Scalability and Performance Considerations

The architecture is designed for horizontal scalability, with stateless backend services and externalized storage. Preview infrastructure utilizes resource pooling and LRU caching to optimize workspace allocation and cleanup.

Database operations are optimized for the expected read-heavy workload, with appropriate indexing strategies for tenant-scoped queries. Object storage integration provides automatic scaling for file assets and build artifacts.

The generated output prioritizes performance through static HTML generation, minimal JavaScript payloads, and modern web optimization techniques including responsive images, font loading optimization, and critical CSS inlining.
