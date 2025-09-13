import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceController } from './controllers/workspace.controller';
import { SessionService } from './services/session/session.service';
import { WorkspaceService } from './services/workspace.service';
import { WorkspaceDeleteService } from './services/workspace-delete.service';
import { WorkspaceGateway } from './workspace.gateway';
import { SessionController } from './controllers/session.controller';
import { WorkspaceSessionEntity } from '../../shared/database/entities/session.entity';
import { Workspace } from '../../shared/database/entities/workspace.entity';
import { SessionActivityManager } from './services/session/session-activity-manager.service';
import { SessionCleanupService } from './services/session/session-cleanup.service';
import { ActivityBasedCleanupProcessor } from './processors/activity-based-cleanup.processor';
import { WorkspacePersistenceService } from './services/persistence/workspace-persistence.service';
import { WorkspaceArchiveService } from './services/archive/workspace-archive.service';
import { DockerService } from '../../shared/services/docker.service';
import { TemplateService } from './services/templates/template.service';
import { WorkspaceDatabaseService } from '../../shared/database/services/workspace.service';
import { WorkspaceSessionDatabaseService } from '../../shared/database/services/workspace-session.service';
import { WorkspaceInitializerService } from './services/startup/workspace-initializer.service';
import { ContainerRegistryService } from './services/container-registry/container-registry.service';
import { ToolServerTestService } from './services/startup/tool-server-test';
import { ToolServerModule } from './tool-server';
import { StorageService } from '../../shared/storage/storage.service';
import { QueueModule } from '../../shared/queue/queue.module';
import { AuthModule } from '../auth/auth.module';
import { ContextModule } from '../context/context.module';

/**
 * Workspace Module
 *
 * Handles all workspace and workspace session functionality including:
 * - Persistent workspace management (CRUD operations)
 * - Docker container orchestration for sessions
 * - Template initialization and workspace creation
 * - WebSocket gateway for HMR events
 * - Activity-based cleanup
 * - Workspace persistence and archiving
 *
 * Controllers:
 * - WorkspaceController: CRUD operations for persistent workspaces
 * - SessionController: Operations for workspace sessions (containers)
 *
 * Services:
 * - WorkspaceService: Persistent workspace operations and template initialization
 * - WorkspaceDeleteService: Comprehensive workspace deletion with full cleanup
 * - SessionService: Session/container lifecycle management
 * - WorkspaceDatabaseService: Database operations for workspace entities
 * - WorkspaceSessionDatabaseService: Database operations for workspace session entities
 * - SessionCleanupService: Cleanup operations for workspace sessions and containers
 * - WorkspacePersistenceService: Save/load workspace archives
 * - WorkspaceArchiveService: Create/extract workspace archives
 * - WorkspaceInitializerService: Initialize workspaces from templates or saved archives
 * - SessionActivityManager: Activity tracking and connection management
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceSessionEntity, Workspace]),
    AuthModule,
    QueueModule,
    ToolServerModule,
    ContextModule,
  ],
  controllers: [WorkspaceController, SessionController],
  providers: [
    WorkspaceService,
    WorkspaceDeleteService,
    {
      provide: SessionService,
      useClass: SessionService,
    },
    WorkspaceDatabaseService,
    WorkspaceSessionDatabaseService,
    SessionCleanupService,
    WorkspaceGateway,
    {
      provide: SessionActivityManager,
      useClass: SessionActivityManager,
    },
    {
      provide: ActivityBasedCleanupProcessor,
      useClass: ActivityBasedCleanupProcessor,
    },
    WorkspacePersistenceService,
    WorkspaceArchiveService,
    WorkspaceInitializerService,
    ContainerRegistryService,
    ToolServerTestService,
    StorageService,
    DockerService,
    TemplateService,
  ],
  exports: [
    WorkspaceService,
    SessionService,
    WorkspaceDeleteService,
    WorkspaceGateway,
  ],
})
export class WorkspaceModule {}
