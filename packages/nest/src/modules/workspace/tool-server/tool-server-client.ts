/**
 * Tool Server HTTP Client
 *
 * HTTP client for communicating with Docker container tool servers
 */

import { Injectable, Logger } from '@nestjs/common';
import { DockerService } from '../../../shared/services/docker.service';
import type {
  NpmInstallParams,
  ToolOperationResponse,
  ArchiveCreationParams,
  ArchiveUploadParams,
  DevServerParams,
  PortAllocationParams,
  ToolHealthResponse,
  RunNpmInstallResponse,
  StartDevServerResponse,
  GetAvailablePortResponse,
  CreateArchiveResponse,
  UploadArchiveResponse,
  ExtractArchiveResponse,
} from '@sansa-dev/shared';
import type {
  ToolSearchRequest,
  ToolSearchResponse,
  ToolReadRequest,
  ToolReadResponse,
  ToolCommandRequest,
  ToolCommandResponse,
  ToolEditRequest,
  ToolEditResponse,
} from '@sansa-dev/shared';
import { ContainerConnection } from '../services/container-registry';

/**
 * Simple container info for basic HTTP requests without full ContainerConnection
 */
export interface SimpleContainerInfo {
  containerName: string;
  toolServerPort: number;
  containerId?: string;
}

@Injectable()
export class ToolServerClient {
  private readonly logger = new Logger(ToolServerClient.name);

  constructor(private readonly dockerService: DockerService) {}

  /**
   * Build the correct URL for container communication
   * Uses container name for direct Docker network communication
   */
  private buildContainerUrl(
    connection: ContainerConnection,
    endpoint: string,
  ): string {
    // Use container name for direct network communication within Docker network
    // The tool server inside the container runs on port 4321
    return `http://${connection.containerName}:4321${endpoint}`;
  }

  /**
   * Execute search tool operation
   */
  async executeSearch(
    connection: ContainerConnection,
    request: ToolSearchRequest,
  ): Promise<ToolSearchResponse> {
    const url = this.buildContainerUrl(connection, '/tools/search');

    try {
      // Tool server returns already-wrapped response
      const response = await this.makeHttpRequest<ToolSearchResponse>(
        connection,
        url,
        request,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Search operation failed for container ${connection.containerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Execute read tool operation
   */
  async executeRead(
    connection: ContainerConnection,
    request: ToolReadRequest,
  ): Promise<ToolReadResponse> {
    const url = this.buildContainerUrl(connection, '/tools/read');

    try {
      // Tool server returns already-wrapped response
      const response = await this.makeHttpRequest<ToolReadResponse>(
        connection,
        url,
        request,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Read operation failed for container ${connection.containerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Execute command tool operation
   */
  async executeCommandTool(
    connection: ContainerConnection,
    request: ToolCommandRequest,
  ): Promise<ToolCommandResponse> {
    const url = this.buildContainerUrl(connection, '/tools/command');

    try {
      // Tool server returns already-wrapped response
      const response = await this.makeHttpRequest<ToolCommandResponse>(
        connection,
        url,
        request,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Command tool operation failed for container ${connection.containerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Execute edit tool operation
   */
  async executeEdit(
    connection: ContainerConnection,
    request: ToolEditRequest,
  ): Promise<ToolEditResponse> {
    const url = this.buildContainerUrl(connection, '/tools/edit');

    try {
      // Tool server returns already-wrapped response
      const response = await this.makeHttpRequest<ToolEditResponse>(
        connection,
        url,
        request,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Edit operation failed for container ${connection.containerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get tool server health status
   */
  async getHealth(
    connection: ContainerConnection,
  ): Promise<ToolHealthResponse> {
    const url = this.buildContainerUrl(connection, '/health');

    try {
      // Tool server returns already-wrapped response
      const response = await this.makeHttpRequest<ToolHealthResponse>(
        connection,
        url,
        {},
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Health check failed for container ${connection.containerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Extract archive using dedicated API endpoint
   */
  async extractArchive(
    connection: ContainerConnection,
    params: { archivePath: string; targetPath?: string },
  ): Promise<ExtractArchiveResponse> {
    const url = this.buildContainerUrl(connection, '/api/archive/extract');

    try {
      const requestBody = {
        archivePath: params.archivePath,
        targetPath: params.targetPath || '/app',
      };

      // Tool server returns already-wrapped response
      const response = await this.makeHttpRequest<ExtractArchiveResponse>(
        connection,
        url,
        requestBody,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Archive extraction failed for container ${connection.containerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Create archive from workspace files
   */
  async createArchive(
    connection: ContainerConnection,
    params: ArchiveCreationParams,
  ): Promise<CreateArchiveResponse> {
    const url = this.buildContainerUrl(connection, '/api/archive/create');

    try {
      // Tool server returns already-wrapped response
      const response = await this.makeHttpRequest<CreateArchiveResponse>(
        connection,
        url,
        params,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Archive creation failed for container ${connection.containerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Upload and extract archive
   */
  async uploadAndExtractArchive(
    connection: ContainerConnection,
    params: ArchiveUploadParams,
  ): Promise<UploadArchiveResponse> {
    const url = this.buildContainerUrl(connection, '/api/archive/upload');

    try {
      // Tool server returns already-wrapped response
      const response = await this.makeHttpRequest<UploadArchiveResponse>(
        connection,
        url,
        params,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Archive upload failed for container ${connection.containerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Run npm install using dedicated API endpoint
   */
  async runNpmInstall(
    connection: ContainerConnection,
    params: NpmInstallParams,
  ): Promise<RunNpmInstallResponse> {
    const url = this.buildContainerUrl(connection, '/api/npm/install');

    try {
      // Tool server returns already-wrapped response
      const response = await this.makeHttpRequest<RunNpmInstallResponse>(
        connection,
        url,
        params,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `npm install failed for container ${connection.containerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Start development server using dedicated API endpoint
   */
  async startDevServer(
    connection: ContainerConnection,
    params: DevServerParams,
  ): Promise<StartDevServerResponse> {
    const url = this.buildContainerUrl(connection, '/api/dev-server/start');

    try {
      // Tool server returns already-wrapped response
      const response = await this.makeHttpRequest<StartDevServerResponse>(
        connection,
        url,
        params,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Dev server start failed for container ${connection.containerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get available port using dedicated API endpoint
   */
  async getAvailablePort(
    connection: ContainerConnection,
    params?: PortAllocationParams,
  ): Promise<GetAvailablePortResponse> {
    const url = this.buildContainerUrl(connection, '/api/ports/allocate');

    try {
      const requestBody: PortAllocationParams = {
        preferredPort: params?.preferredPort,
        portRange: params?.portRange || { min: 8000, max: 8100 },
      };

      // Tool server returns already-wrapped response
      const response = await this.makeHttpRequest<GetAvailablePortResponse>(
        connection,
        url,
        requestBody,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Port allocation failed for container ${connection.containerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Stop development server using dedicated API endpoint
   */
  async stopDevServer(
    connection: ContainerConnection,
  ): Promise<ToolOperationResponse> {
    const url = this.buildContainerUrl(connection, '/api/dev-server/stop');

    try {
      // Tool server returns already-wrapped response
      const response = await this.makeHttpRequest<ToolOperationResponse>(
        connection,
        url,
        {},
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Dev server stop failed for container ${connection.containerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Make HTTP request to tool server via direct HTTP connection
   * Uses the mapped tool server port for secure communication without docker exec
   */
  private async makeHttpRequest<TData = any>(
    connection: ContainerConnection,
    url: string,
    data: any,
  ): Promise<TData> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const method = Object.keys(data || {}).length > 0 ? 'POST' : 'GET';

    let response: Response | null = null;
    let responseText: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const headers: Record<string, string> = {
        Accept: 'application/json',
        'User-Agent': 'workspace-backend/1.0',
      };

      if (method === 'POST') {
        headers['Content-Type'] = 'application/json';
      }

      const requestOptions = {
        method,
        headers,
        body: method === 'POST' ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      };

      response = await fetch(url, requestOptions);
      const duration = Date.now() - startTime;
      const contentLength = response.headers.get('content-length') || 'unknown';

      clearTimeout(timeoutId);

      this.logger.debug(
        `[${requestId}] HTTP ${response.status} ${response.statusText} in ${duration}ms (${contentLength} bytes)`,
      );

      if (!response.ok) {
        responseText = await response.text();
        this.logger.error(
          `[${requestId}] HTTP ${response.status} ${response.statusText} for ${connection.containerId}: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`,
        );
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        const jsonResponse = await response.json();
        return jsonResponse as TData;
      } else {
        responseText = await response.text();
        if (!responseText) {
          this.logger.error(
            `[${requestId}] Empty response from tool server for ${connection.containerId}`,
          );
          throw new Error('Empty response from tool server');
        }

        // Try to parse as JSON in case content-type header is missing
        try {
          const parsedJson = JSON.parse(responseText);
          return parsedJson as TData;
        } catch {
          // Return as text if not JSON
          return responseText as unknown as TData;
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          this.logger.error(
            `[${requestId}] Request to ${connection.containerId} timed out after 30 seconds`,
          );
          throw new Error(`Request to ${url} timed out after 30 seconds`);
        } else if (error.message.includes('ECONNREFUSED')) {
          this.logger.error(
            `[${requestId}] Connection refused to ${connection.containerId}:${connection.toolServerPort}`,
          );
          throw new Error(
            `Connection refused to ${url} - container not accessible on port ${connection.toolServerPort}`,
          );
        } else if (error.message.includes('ENOTFOUND')) {
          this.logger.error(
            `[${requestId}] DNS resolution failed for ${connection.containerId}`,
          );
          throw new Error(
            `DNS resolution failed for ${url} - container network unreachable`,
          );
        } else if (error.message.includes('ETIMEDOUT')) {
          this.logger.error(
            `[${requestId}] Connection to ${connection.containerId} timed out`,
          );
          throw new Error(`Connection to ${url} timed out`);
        } else {
          this.logger.error(
            `[${requestId}] Request to ${connection.containerId} failed: ${error.message}`,
          );
          throw error;
        }
      } else {
        this.logger.error(
          `[${requestId}] Request to ${connection.containerId} failed: ${String(error)}`,
        );
        throw new Error(`HTTP request failed: ${String(error)}`);
      }
    }
  }
}
