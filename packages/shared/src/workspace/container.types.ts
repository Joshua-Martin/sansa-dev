/**
 * Container orchestration types for Docker integration
 *
 */
import type { X21Timestamp } from '../app';
import type { ResourceAllocation } from './session.types';
import type { Port } from './session.types';

/**
 * Docker container health status
 */
export type ContainerHealthStatus =
  | 'starting'
  | 'healthy'
  | 'unhealthy'
  | 'none';

/**
 * Container lifecycle states
 */
export type ContainerLifecycleState =
  | 'created'
  | 'restarting'
  | 'running'
  | 'removing'
  | 'paused'
  | 'exited'
  | 'dead';

/**
 * Container information from Docker API
 */
export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  imageId: string;
  command: string;
  created: X21Timestamp;
  state: ContainerLifecycleState;
  status: string;
  ports: ContainerPortInfo[];
  labels: Record<string, string>;
  mounts: ContainerMountInfo[];
  networkSettings: ContainerNetworkSettings;
  hostConfig: ContainerHostConfig;
}

export interface ContainerPortInfo {
  privatePort: Port;
  publicPort?: Port;
  type: 'tcp' | 'udp';
  ip?: string;
}

export interface ContainerMountInfo {
  type: 'bind' | 'volume' | 'tmpfs';
  name?: string;
  source: string;
  destination: string;
  driver?: string;
  mode: string;
  rw: boolean;
  propagation: string;
}

export interface ContainerNetworkSettings {
  networks: Record<string, ContainerNetworkInfo>;
  ports: Record<string, ContainerPortBinding[]>;
}

export interface ContainerNetworkInfo {
  ipamConfig?: {
    ipv4Address?: string;
    ipv6Address?: string;
  };
  links?: string[];
  aliases?: string[];
  networkId: string;
  endpointId: string;
  gateway: string;
  ipAddress: string;
  ipPrefixLen: number;
  ipv6Gateway: string;
  globalIPv6Address: string;
  globalIPv6PrefixLen: number;
  macAddress: string;
  driverOpts?: Record<string, string>;
}

export interface ContainerPortBinding {
  hostIp: string;
  hostPort: string;
}

export interface ContainerHostConfig {
  cpuShares: number;
  memory: number;
  memorySwap: number;
  memoryReservation: number;
  kernelMemory: number;
  cpuPercent: number;
  cpusetCpus: string;
  cpusetMems: string;
  maximumIOps: number;
  maximumIOBps: number;
  blkioWeight: number;
  ulimits: ContainerUlimit[];
  restartPolicy: ContainerRestartPolicy;
  autoRemove: boolean;
  volumeDriver: string;
  volumesFrom: string[];
  capAdd: string[];
  capDrop: string[];
  dns: string[];
  dnsOptions: string[];
  dnsSearch: string[];
  extraHosts: string[];
  groupAdd: string[];
  ipcMode: string;
  cgroup: string;
  links: string[];
  oomScoreAdj: number;
  pidMode: string;
  privileged: boolean;
  publishAllPorts: boolean;
  readonlyRootfs: boolean;
  securityOpt: string[];
  storageOpt: Record<string, string>;
  tmpfs: Record<string, string>;
  utSMode: string;
  usernsMode: string;
  shmSize: number;
  sysctls: Record<string, string>;
  runtime: string;
  isolation: string;
  maskedPaths: string[];
  readonlyPaths: string[];
}

export interface ContainerUlimit {
  name: string;
  soft: number;
  hard: number;
}

export interface ContainerRestartPolicy {
  name: 'no' | 'always' | 'unless-stopped' | 'on-failure';
  maximumRetryCount: number;
}

/**
 * Container statistics and monitoring
 */
export interface ContainerStats {
  id: string;
  name: string;
  read: X21Timestamp;
  preread: X21Timestamp;
  pidsStats: {
    current: number;
    limit: number;
  };
  blkioStats: {
    ioServiceBytesRecursive: Array<{
      major: number;
      minor: number;
      op: string;
      value: number;
    }>;
    ioServicedRecursive: Array<{
      major: number;
      minor: number;
      op: string;
      value: number;
    }>;
  };
  numProcs: number;
  storageStats: Record<string, unknown>;
  cpuStats: {
    cpuUsage: {
      totalUsage: number;
      percpuUsage: number[];
      usageInKernelmode: number;
      usageInUsermode: number;
    };
    systemCpuUsage: number;
    onlineCpus: number;
    throttlingData: {
      periods: number;
      throttledPeriods: number;
      throttledTime: number;
    };
  };
  precpuStats: {
    cpuUsage: {
      totalUsage: number;
      percpuUsage: number[];
      usageInKernelmode: number;
      usageInUsermode: number;
    };
    systemCpuUsage: number;
    onlineCpus: number;
    throttlingData: {
      periods: number;
      throttledPeriods: number;
      throttledTime: number;
    };
  };
  memoryStats: {
    usage: number;
    maxUsage: number;
    stats: {
      activeAnon: number;
      activeFile: number;
      cache: number;
      dirty: number;
      hierarchicalMemoryLimit: number;
      hierarchicalMemswLimit: number;
      inactiveAnon: number;
      inactiveFile: number;
      mappedFile: number;
      pgfault: number;
      pgmajfault: number;
      pgpgin: number;
      pgpgout: number;
      rss: number;
      rssHuge: number;
      totalActiveAnon: number;
      totalActiveFile: number;
      totalCache: number;
      totalDirty: number;
      totalInactiveAnon: number;
      totalInactiveFile: number;
      totalMappedFile: number;
      totalPgfault: number;
      totalPgmajfault: number;
      totalPgpgin: number;
      totalPgpgout: number;
      totalRss: number;
      totalRssHuge: number;
      totalUnevictable: number;
      totalWriteback: number;
      unevictable: number;
      writeback: number;
    };
    limit: number;
  };
  networks: Record<
    string,
    {
      rxBytes: number;
      rxPackets: number;
      rxErrors: number;
      rxDropped: number;
      txBytes: number;
      txPackets: number;
      txErrors: number;
      txDropped: number;
    }
  >;
}

/**
 * Container creation options
 */
export interface ContainerCreateOptions {
  name?: string;
  hostname?: string;
  domainname?: string;
  user?: string;
  attachStdin?: boolean;
  attachStdout?: boolean;
  attachStderr?: boolean;
  exposedPorts?: Record<string, Record<string, unknown>>;
  tty?: boolean;
  openStdin?: boolean;
  stdinOnce?: boolean;
  env?: string[];
  cmd?: string[];
  healthcheck?: {
    test?: string[];
    interval?: number;
    timeout?: number;
    retries?: number;
    startPeriod?: number;
  };
  argsEscaped?: boolean;
  image: string;
  volumes?: Record<string, Record<string, unknown>>;
  workingDir?: string;
  entrypoint?: string[];
  networkDisabled?: boolean;
  macAddress?: string;
  onBuild?: string[];
  labels?: Record<string, string>;
  stopSignal?: string;
  stopTimeout?: number;
  shell?: string[];
  hostConfig?: Partial<ContainerHostConfig>;
  networkingConfig?: {
    endpointsConfig?: Record<
      string,
      {
        ipamConfig?: {
          ipv4Address?: string;
          ipv6Address?: string;
          linkLocalIPs?: string[];
        };
        links?: string[];
        aliases?: string[];
        networkId?: string;
        endpointId?: string;
        gateway?: string;
        ipAddress?: string;
        ipPrefixLen?: number;
        ipv6Gateway?: string;
        globalIPv6Address?: string;
        globalIPv6PrefixLen?: number;
        macAddress?: string;
        driverOpts?: Record<string, string>;
      }
    >;
  };
}

/**
 * Docker container configuration for creation
 */
export interface DockerContainerConfig {
  name: string;
  image: string;
  ports: Array<{
    containerPort: Port;
    hostPort: Port;
    protocol: 'tcp' | 'udp';
  }>;
  resources: ResourceAllocation;
  environment: Record<string, string>;
  workspaceMount: string;
}

/**
 * Command execution options
 */
export interface ExecCommandOptions {
  attachStdout?: boolean;
  attachStderr?: boolean;
  timeout?: number;
}

/**
 * Command execution result
 */
export interface ExecCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Docker container operation types
 * These are actual Docker container lifecycle operations (start, stop, etc.)
 */
export type DockerContainerOperationType =
  | 'create'
  | 'start'
  | 'stop'
  | 'restart'
  | 'remove'
  | 'update';

/**
 * Docker container operation request
 * Used for Docker container lifecycle management
 */
export interface DockerContainerOperation {
  /** Type of Docker operation to perform */
  type: DockerContainerOperationType;
  /** Docker container ID */
  containerId: string;
  /** Operation-specific parameters */
  parameters?: Record<string, unknown>;
  /** Operation timestamp */
  timestamp: X21Timestamp;
  /** Operation result (if completed) */
  result?: DockerContainerOperationResult;
}

/**
 * Docker container operation result
 * Result from Docker container lifecycle operations
 */
export interface DockerContainerOperationResult {
  /** Whether the Docker operation completed successfully */
  success: boolean;
  /** Docker container ID that was operated on */
  containerId?: string;
  /** Error message if operation failed */
  error?: string;
  /** Operation logs */
  logs?: string[];
  /** Operation duration in milliseconds */
  duration: number;
}
