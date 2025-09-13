/**
 * Tool Server Interface Types
 *
 * Types for communicating with Docker container tool servers.
 * These types are specific to the NestJS interface layer and don't duplicate shared types.
 */

import type {
  ToolOperationResponse,
  ToolCommandResponse,
  CreateArchiveResponse,
  UploadArchiveResponse,
  RunNpmInstallResponse,
  StartDevServerResponse,
  ToolHealthResponse,
  GetAvailablePortResponse,
  ArchiveCreationParams,
  ArchiveUploadParams,
  DevServerParams,
  PortAllocationParams,
  ToolSearchRequest,
  ToolSearchResponse,
  ToolReadRequest,
  ToolReadResponse,
  ToolEditRequest,
  ToolEditResponse,
  ToolCommandRequest,
  NpmInstallParams,
} from '@sansa-dev/shared';
import type { ContainerConnection } from '../services/container-registry/container-registry.types';

/**
 * Tool server client interface
 */
export interface IToolServerClient {
  executeCommandTool(
    connection: ContainerConnection,
    request: ToolCommandRequest,
  ): Promise<ToolCommandResponse>;

  executeSearch(
    connection: ContainerConnection,
    request: ToolSearchRequest,
  ): Promise<ToolSearchResponse>;

  executeRead(
    connection: ContainerConnection,
    request: ToolReadRequest,
  ): Promise<ToolReadResponse>;

  executeEdit(
    connection: ContainerConnection,
    request: ToolEditRequest,
  ): Promise<ToolEditResponse>;

  getHealth(connection: ContainerConnection): Promise<ToolHealthResponse>;

  runNpmInstall(
    connection: ContainerConnection,
    params: NpmInstallParams,
  ): Promise<RunNpmInstallResponse>;

  startDevServer(
    connection: ContainerConnection,
    params: DevServerParams,
  ): Promise<StartDevServerResponse>;

  getAvailablePort(
    connection: ContainerConnection,
    params?: PortAllocationParams,
  ): Promise<GetAvailablePortResponse>;

  stopDevServer(
    connection: ContainerConnection,
  ): Promise<ToolOperationResponse>;

  createArchive(
    connection: ContainerConnection,
    params: ArchiveCreationParams,
  ): Promise<CreateArchiveResponse>;

  uploadAndExtractArchive(
    connection: ContainerConnection,
    params: ArchiveUploadParams,
  ): Promise<UploadArchiveResponse>;
}
