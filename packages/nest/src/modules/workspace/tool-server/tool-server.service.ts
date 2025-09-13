/**
 * Tool Server Service
 *
 * Main service for interfacing with Docker container tool servers.
 * This service provides a clean API for executing operations on workspace containers.
 */

import { Injectable, Logger } from '@nestjs/common';
import { DockerService } from '../../../shared/services/docker.service';
import type {
  ToolOperationRequest,
  ToolOperationResponse,
  ToolSearchRequest,
  ToolSearchResponse,
  ToolReadRequest,
  ToolReadResponse,
  ToolCommandRequest,
  ToolCommandResponse,
  ToolEditRequest,
  ToolEditResponse,
  ToolHealthResponse,
  RunNpmInstallResponse,
  StartDevServerResponse,
  GetAvailablePortResponse,
  CreateArchiveResponse,
  UploadArchiveResponse,
  ArchiveUploadParams,
  NpmInstallParams,
  DevServerParams,
  PortAllocationParams,
  ArchiveCreationParams,
} from '@sansa-dev/shared';
import { ToolServerClient } from './tool-server-client';
import { ContainerConnection } from '../services/container-registry';

@Injectable()
export class ToolServerService {
  private readonly logger = new Logger(ToolServerService.name);

  constructor(
    private readonly dockerService: DockerService,
    private readonly toolServerClient: ToolServerClient,
  ) {}

  /**
   * Execute a tool server operation
   */
  async executeOperation(
    connection: ContainerConnection,
    request: ToolOperationRequest,
  ): Promise<ToolOperationResponse> {
    this.logger.debug(
      `Executing operation ${request.operation} on container ${connection.containerId}`,
    );

    try {
      // Route to appropriate method based on operation type
      switch (request.operation) {
        case 'upload-and-extract-archive':
          return await this.uploadAndExtractArchive(connection, {
            archiveData: request.parameters.archiveData as string,
            cleanTarget: request.parameters.cleanTarget as boolean,
          });

        case 'run-npm-install':
          return await this.runNpmInstall(connection, {
            workingDir: request.parameters.workingDir as string,
            timeout: request.parameters.timeout as number,
          } as NpmInstallParams);

        case 'start-dev-server':
          return await this.startDevServer(connection, {
            port: request.parameters.port as number,
            command: request.parameters.command as string,
            args: request.parameters.args as string[],
            environment: request.parameters.environment as Record<
              string,
              string
            >,
          } as DevServerParams);

        case 'stop-dev-server':
          return await this.stopDevServer(connection);

        case 'get-available-port':
          return await this.getAvailablePort(connection, {
            preferredPort: request.parameters.preferredPort as number,
            portRange: request.parameters.portRange as {
              min: number;
              max: number;
            },
          } as PortAllocationParams);

        case 'command':
          return await this.executeCommandTool(connection, {
            command: request.parameters.command as string,
            timeout: request.parameters.timeout as number,
          } as ToolCommandRequest);

        case 'create-archive':
          return await this.createArchive(connection, {
            excludePatterns: request.parameters.excludePatterns as string[],
          } as ArchiveCreationParams);

        case 'health':
          return await this.getHealth(connection);

        case 'search':
          return await this.executeSearch(connection, {
            pattern: request.parameters.pattern as string,
            type: request.parameters.type as string,
            path: request.parameters.path as string,
            caseInsensitive: request.parameters.caseInsensitive as boolean,
            multiline: request.parameters.multiline as boolean,
            beforeContext: request.parameters.beforeContext as number,
            afterContext: request.parameters.afterContext as number,
          } as ToolSearchRequest);

        case 'read':
          return await this.executeRead(connection, {
            path: request.parameters.path as string,
            offset: request.parameters.offset as number,
            limit: request.parameters.limit as number,
          } as ToolReadRequest);

        case 'edit':
          return await this.executeEdit(connection, {
            path: request.parameters.path as string,
            findText: request.parameters.findText as string,
            replaceText: request.parameters.replaceText as string,
            replaceAll: request.parameters.replaceAll as boolean,
          } as ToolEditRequest);
      }
    } catch (error) {
      this.logger.error(
        `Operation ${request.operation} failed for container ${connection.containerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get tool server health
   */
  async getHealth(
    connection: ContainerConnection,
  ): Promise<ToolHealthResponse> {
    return await this.toolServerClient.getHealth(connection);
  }

  /**
   * Upload and extract archive in container
   */
  async uploadAndExtractArchive(
    connection: ContainerConnection,
    params: ArchiveUploadParams,
  ): Promise<UploadArchiveResponse> {
    return await this.toolServerClient.uploadAndExtractArchive(
      connection,
      params,
    );
  }

  /**
   * Run npm install in container
   */
  async runNpmInstall(
    connection: ContainerConnection,
    params: NpmInstallParams,
  ): Promise<RunNpmInstallResponse> {
    return await this.toolServerClient.runNpmInstall(connection, params);
  }

  /**
   * Start development server in container
   */
  async startDevServer(
    connection: ContainerConnection,
    params: DevServerParams,
  ): Promise<StartDevServerResponse> {
    return await this.toolServerClient.startDevServer(connection, params);
  }

  /**
   * Stop development server in container
   */
  async stopDevServer(
    connection: ContainerConnection,
  ): Promise<ToolOperationResponse> {
    return await this.toolServerClient.stopDevServer(connection);
  }

  /**
   * Get available port in container
   */
  async getAvailablePort(
    connection: ContainerConnection,
    params?: PortAllocationParams,
  ): Promise<GetAvailablePortResponse> {
    return await this.toolServerClient.getAvailablePort(connection, params);
  }

  /**
   * Create archive from workspace files
   */
  async createArchive(
    connection: ContainerConnection,
    params: ArchiveCreationParams,
  ): Promise<CreateArchiveResponse> {
    return await this.toolServerClient.createArchive(connection, params);
  }

  /**
   * Execute search tool operation
   */
  async executeSearch(
    connection: ContainerConnection,
    request: ToolSearchRequest,
  ): Promise<ToolSearchResponse> {
    return await this.toolServerClient.executeSearch(connection, request);
  }

  /**
   * Execute read tool operation
   */
  async executeRead(
    connection: ContainerConnection,
    request: ToolReadRequest,
  ): Promise<ToolReadResponse> {
    return await this.toolServerClient.executeRead(connection, request);
  }

  /**
   * Execute command tool operation
   */
  async executeCommandTool(
    connection: ContainerConnection,
    request: ToolCommandRequest,
  ): Promise<ToolCommandResponse> {
    return await this.toolServerClient.executeCommandTool(connection, request);
  }

  /**
   * Execute edit tool operation
   */
  async executeEdit(
    connection: ContainerConnection,
    request: ToolEditRequest,
  ): Promise<ToolEditResponse> {
    return await this.toolServerClient.executeEdit(connection, request);
  }
}
