import { Injectable, Logger } from '@nestjs/common';
import Docker from 'dockerode';
import * as tarStream from 'tar-stream';
import type {
  DockerContainerConfig,
  ContainerInfo,
  ContainerMetrics,
  DockerContainerOperationResult,
  ExecCommandOptions,
  ExecCommandResult,
} from '@sansa-dev/shared';

/**
 * Simplified Docker Service for container management
 *
 * Provides basic Docker operations for workspace containers with
 * simplified type handling to avoid dockerode type conflicts.
 */
@Injectable()
export class DockerService {
  private readonly logger = new Logger(DockerService.name);
  private readonly docker: Docker;

  constructor() {
    // Initialize Docker client with socket connection
    this.docker = new Docker({
      socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
    });

    this.logger.log('Docker service initialized');
  }

  /**
   * Create a new container with the specified configuration
   */
  async createContainer(config: DockerContainerConfig): Promise<string> {
    this.logger.log(`Creating container: ${config.name}`);

    try {
      // Prepare port bindings
      const portBindings: any = {};
      const exposedPorts: any = {};

      config.ports.forEach((port) => {
        const containerPort = `${port.containerPort}/${port.protocol}`;
        exposedPorts[containerPort] = {};
        portBindings[containerPort] = [{ HostPort: port.hostPort.toString() }];
      });

      // Prepare environment variables
      const env = Object.entries(config.environment).map(
        ([key, value]) => `${key}=${value}`,
      );

      // Prepare volume binds - create empty volume for user data
      // Template files are already in the image at /app
      const binds = [`workspace-${config.name}:/workspace/user-data:rw`];

      // Container creation options
      const createOptions = {
        name: config.name,
        Image: config.image,
        Env: env,
        ExposedPorts: exposedPorts,
        WorkingDir: '/app', // Use the image's working directory where template files exist
        HostConfig: {
          PortBindings: portBindings,
          Binds: binds,
          Memory: config.resources.memory * 1024 * 1024, // Convert MB to bytes
          CpuShares: Math.floor(config.resources.cpu * 1024), // Convert CPU cores to shares
          CapDrop: ['ALL'],
          CapAdd: ['CHOWN', 'DAC_OVERRIDE', 'FOWNER', 'SETGID', 'SETUID'],
          ReadonlyRootfs: false,
          AutoRemove: false,
          RestartPolicy: {
            Name: 'no',
            MaximumRetryCount: 0,
          },
        },
        // Connect to the same network as the dev container
        NetworkingConfig: {
          EndpointsConfig: {
            [await this.getDevContainerNetworkName()]: {
              // Connect the container to the same network as the dev container
            },
          },
        },
        Labels: {
          'workspace.session': config.name,
          'workspace.type': 'preview',
          'workspace.managed': 'true',
        },
      };

      // Create the container
      const container = await this.docker.createContainer(createOptions);
      const containerId = container.id;

      this.logger.log(`Container created successfully: ${containerId}`);
      return containerId;
    } catch (error) {
      this.logger.error(`Failed to create container: ${config.name}`, error);
      throw error;
    }
  }

  /**
   * Start a container
   */
  async startContainer(
    containerId: string,
  ): Promise<DockerContainerOperationResult> {
    this.logger.log(`Starting container: ${containerId}`);

    try {
      const container = this.docker.getContainer(containerId);
      await container.start();

      this.logger.log(`Container started successfully: ${containerId}`);
      return {
        success: true,
        containerId,
        duration: 0,
      };
    } catch (error) {
      this.logger.error(`Failed to start container: ${containerId}`, error);
      return {
        success: false,
        containerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: 0,
      };
    }
  }

  /**
   * Stop a container
   */
  async stopContainer(
    containerId: string,
  ): Promise<DockerContainerOperationResult> {
    this.logger.log(`Stopping container: ${containerId}`);

    try {
      const container = this.docker.getContainer(containerId);
      await container.stop();

      this.logger.log(`Container stopped successfully: ${containerId}`);
      return {
        success: true,
        containerId,
        duration: 0,
      };
    } catch (error) {
      this.logger.error(`Failed to stop container: ${containerId}`, error);
      return {
        success: false,
        containerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: 0,
      };
    }
  }

  /**
   * Find the dev container network name
   * This is needed because Docker Compose prefixes network names with project name
   */
  private async getDevContainerNetworkName(): Promise<string> {
    try {
      const networks = await this.docker.listNetworks();

      // Look for a network that contains 'sansa-dev' in its name
      const devNetwork = networks.find(
        (network) => network.Name && network.Name.includes('sansa-dev'),
      );

      if (devNetwork) {
        this.logger.debug(`Found dev container network: ${devNetwork.Name}`);
        return devNetwork.Name;
      }

      // Fallback to default network if not found
      this.logger.warn('Could not find sansa-dev network, using bridge network');
      return 'bridge';
    } catch (error) {
      this.logger.error('Failed to find dev container network', error);
      return 'bridge';
    }
  }

  /**
   * Get container logs for debugging
   */
  async getContainerLogs(
    containerId: string,
    tailLines: number = 50,
  ): Promise<string> {
    this.logger.debug(`Getting logs for container: ${containerId}`);

    try {
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: tailLines,
        timestamps: true,
      });

      // Convert buffer to string and clean up
      const logString = logs.toString('utf8');
      return logString;
    } catch (error) {
      this.logger.error(
        `Failed to get logs for container: ${containerId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Remove a container
   */
  async removeContainer(
    containerId: string,
  ): Promise<DockerContainerOperationResult> {
    this.logger.log(`Removing container: ${containerId}`);

    try {
      const container = this.docker.getContainer(containerId);
      await container.remove({ force: true });

      this.logger.log(`Container removed successfully: ${containerId}`);
      return {
        success: true,
        containerId,
        duration: 0,
      };
    } catch (error) {
      this.logger.error(`Failed to remove container: ${containerId}`, error);
      return {
        success: false,
        containerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: 0,
      };
    }
  }

  /**
   * Get container information
   */
  async getContainerInfo(containerId: string): Promise<ContainerInfo | null> {
    try {
      const container = this.docker.getContainer(containerId);
      const info = await container.inspect();

      return {
        id: info.Id,
        name: info.Name.replace(/^\//, ''), // Remove leading slash
        image: info.Config.Image,
        imageId: info.Image,
        command: info.Config.Cmd?.join(' ') || '',
        created: info.Created,
        state: info.State.Status as any,
        status: info.State.Status,
        ports: [], // Simplified - would need proper mapping
        labels: info.Config.Labels || {},
        mounts: [], // Simplified
        networkSettings: {
          networks: {},
          ports: {},
        },
        hostConfig: info.HostConfig as any,
      };
    } catch (error) {
      this.logger.error(`Failed to get container info: ${containerId}`, error);
      return null;
    }
  }

  /**
   * Get container metrics (simplified)
   */
  async getContainerMetrics(containerId: string): Promise<ContainerMetrics> {
    try {
      const container = this.docker.getContainer(containerId);
      const dockerStats = (await container.stats({ stream: false })) as any;

      // Simplified metrics calculation
      const cpuUsage = 0; // Would need proper calculation
      const memoryUsage =
        (dockerStats.memory_stats?.usage || 0) / (1024 * 1024);

      return {
        cpuUsage,
        memoryUsage,
        networkIn: 0,
        networkOut: 0,
        uptime: 0,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get container metrics: ${containerId}`,
        error,
      );
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        networkIn: 0,
        networkOut: 0,
        uptime: 0,
      };
    }
  }

  /**
   * Execute command in container (alias for execCommand)
   */
  async execInContainer(
    containerId: string,
    command: string[],
    options: any = {},
  ): Promise<any> {
    return this.execCommand(containerId, command, options);
  }

  /**
   * Check container health
   */
  async checkContainerHealth(containerId: string): Promise<boolean> {
    try {
      const info = await this.getContainerInfo(containerId);
      return info?.status === 'running';
    } catch (error) {
      return false;
    }
  }

  /**
   * Execute command in container with proper stream handling
   */
  async execCommand(
    containerId: string,
    command: string[],
    options: ExecCommandOptions = {},
  ): Promise<ExecCommandResult> {
    this.logger.debug(
      `Executing command in container ${containerId}: ${command.join(' ')}`,
    );

    try {
      const container = this.docker.getContainer(containerId);

      const exec = await container.exec({
        Cmd: command,
        AttachStdout: options.attachStdout ?? true,
        AttachStderr: options.attachStderr ?? true,
      });

      const stream = await exec.start({ Detach: false });

      return new Promise<ExecCommandResult>((resolve) => {
        let stdout = '';
        let stderr = '';
        let exitCode = 0;

        // Docker multiplexes stdout and stderr in the stream
        // Uses 8-byte header: [STREAM_TYPE, 0, 0, 0, SIZE_BYTE1, SIZE_BYTE2, SIZE_BYTE3, SIZE_BYTE4]
        let buffer = Buffer.alloc(0);

        stream.on('data', (chunk: Buffer) => {
          buffer = Buffer.concat([buffer, chunk]);

          // Process complete messages in the buffer
          while (buffer.length >= 8) {
            const streamType = buffer[0];
            const size = buffer.readUInt32BE(4);

            if (buffer.length < 8 + size) {
              // Not enough data for complete message
              break;
            }

            const data = buffer.slice(8, 8 + size).toString();

            if (streamType === 1) {
              stdout += data;
            } else if (streamType === 2) {
              stderr += data;
            }

            // Remove processed message from buffer
            buffer = buffer.slice(8 + size);
          }
        });

        stream.on('end', async () => {
          // Get the actual exit code from the exec instance
          try {
            const inspectResult = await exec.inspect();
            exitCode = inspectResult.ExitCode || 0;
          } catch (error) {
            // If we can't get the exit code, assume success if no stderr
            exitCode = stderr.length > 0 ? 1 : 0;
          }

          const result = {
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode,
          };

          // Enhanced logging for debugging
          this.logger.debug(
            `Command execution completed in container ${containerId}:\n` +
              `Command: ${command.join(' ')}\n` +
              `Exit Code: ${exitCode}\n` +
              `STDOUT Length: ${result.stdout.length} bytes\n` +
              `STDERR Length: ${result.stderr.length} bytes\n` +
              `STDOUT: "${result.stdout}"\n` +
              `STDERR: "${result.stderr}"`,
          );

          resolve(result);
        });

        stream.on('error', (error) => {
          resolve({
            stdout: stdout.trim(),
            stderr: error instanceof Error ? error.message : 'Unknown error',
            exitCode: 1,
          });
        });

        // Set timeout if specified
        if (options.timeout) {
          setTimeout(() => {
            stream.destroy();
            resolve({
              stdout: stdout.trim(),
              stderr: 'Command timed out',
              exitCode: 1,
            });
          }, options.timeout);
        }
      });
    } catch (error) {
      this.logger.error(
        `Failed to execute command in container: ${containerId}`,
        error,
      );
      return {
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
      };
    }
  }

  /**
   * Copy data to a file inside a container
   */
  async copyToContainer(
    containerId: string,
    data: Buffer,
    containerPath: string,
  ): Promise<void> {
    this.logger.debug(
      `Copying data to container ${containerId}:${containerPath}`,
    );

    try {
      const container = this.docker.getContainer(containerId);

      // Create a tar archive containing the file
      const pack = tarStream.pack();

      // Add the file to the tar stream
      const fileName = containerPath.split('/').pop() || 'file';
      pack.entry({ name: fileName }, data);
      pack.finalize();

      // Get the tar buffer
      const chunks: Buffer[] = [];
      pack.on('data', (chunk: Buffer) => chunks.push(chunk));

      await new Promise<void>((resolve, reject) => {
        pack.on('end', () => {
          const tarBuffer = Buffer.concat(chunks);

          // Put the archive into the container
          container
            .putArchive(tarBuffer, {
              path: containerPath.substring(0, containerPath.lastIndexOf('/')),
            })
            .then(() => {
              this.logger.debug(
                `Successfully copied data to container ${containerId}:${containerPath}`,
              );
              resolve();
            })
            .catch((error: Error) => {
              this.logger.error(
                `Failed to copy data to container: ${error.message}`,
              );
              reject(error);
            });
        });
      });
    } catch (error) {
      this.logger.error(
        `Failed to copy data to container ${containerId}:${containerPath}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Copy file from container to buffer
   */
  async copyFromContainer(
    containerId: string,
    containerPath: string,
  ): Promise<Buffer> {
    this.logger.debug(
      `Copying file from container ${containerId}:${containerPath}`,
    );

    try {
      const container = this.docker.getContainer(containerId);

      // Get archive from container
      const archiveStream = await container.getArchive({
        path: containerPath,
      });

      // Extract file from tar archive
      const extract = tarStream.extract();

      return new Promise<Buffer>((resolve, reject) => {
        let fileBuffer: Buffer | null = null;

        extract.on('entry', (header: any, stream: any, next: () => void) => {
          if (header.type === 'file') {
            const chunks: Buffer[] = [];
            stream.on('data', (chunk: Buffer) => chunks.push(chunk));
            stream.on('end', () => {
              fileBuffer = Buffer.concat(chunks);
              next();
            });
          } else {
            next();
          }

          stream.resume();
        });

        extract.on('finish', () => {
          if (fileBuffer) {
            this.logger.debug(
              `Successfully copied file from container ${containerId}:${containerPath}`,
            );
            resolve(fileBuffer);
          } else {
            reject(new Error(`File not found in archive: ${containerPath}`));
          }
        });

        extract.on('error', (error: Error) => {
          this.logger.error(
            `Failed to extract file from archive: ${error.message}`,
          );
          reject(error);
        });

        // Pipe archive stream to extractor
        archiveStream.pipe(extract);
      });
    } catch (error) {
      this.logger.error(
        `Failed to copy file from container ${containerId}:${containerPath}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if Docker daemon is available
   */
  async isDockerAvailable(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch (error) {
      this.logger.error('Docker daemon is not available', error);
      return false;
    }
  }

  /**
   * Pull Docker image
   */
  async pullImage(imageName: string): Promise<boolean> {
    this.logger.log(`Pulling Docker image: ${imageName}`);

    try {
      const stream = await this.docker.pull(imageName);

      return new Promise((resolve, reject) => {
        this.docker.modem.followProgress(stream, (err: any, res: any) => {
          if (err) {
            this.logger.error(`Failed to pull image: ${imageName}`, err);
            reject(err);
          } else {
            this.logger.log(`Successfully pulled image: ${imageName}`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      this.logger.error(`Failed to pull image: ${imageName}`, error);
      return false;
    }
  }
}
