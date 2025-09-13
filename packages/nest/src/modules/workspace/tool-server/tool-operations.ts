/**
 * Tool Operations Builders
 *
 * Helper functions for building tool server operation requests
 */

import type { ToolOperationRequest } from '@sansa-dev/shared';

/**
 * Generate unique operation ID
 */
export function generateOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Build command execution request
 */
export function buildCommandRequest(
  command: string,
  timeout: number = 30000,
): ToolOperationRequest {
  return {
    id: generateOperationId(),
    operation: 'command',
    sessionId: '', // Will be set by caller
    parameters: {
      command,
      timeout,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build archive extraction request
 */
export function buildArchiveExtractionRequest(
  sessionId: string,
  archivePath: string,
  targetPath: string = '/app',
): ToolOperationRequest {
  return {
    id: generateOperationId(),
    operation: 'upload-and-extract-archive',
    sessionId: sessionId, // Will be set by caller
    parameters: {
      command: `tar -xzf "${archivePath}" -C ${targetPath}`,
      timeout: 60000,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build npm install request
 */
export function buildNpmInstallRequest(
  sessionId: string,
  workingDir: string = '/app',
  timeout: number = 300000,
): ToolOperationRequest {
  return {
    id: generateOperationId(),
    operation: 'run-npm-install',
    sessionId: sessionId, // Will be set by caller
    parameters: {
      command: `cd ${workingDir} && npm install`,
      timeout,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build dev server start request
 */
export function buildDevServerStartRequest(
  sessionId: string,
  port: number,
  command: string = 'npm run dev',
): ToolOperationRequest {
  return {
    id: generateOperationId(),
    operation: 'start-dev-server',
    sessionId: sessionId, // Will be set by caller
    parameters: {
      command: `${command} -- --port ${port} --host 0.0.0.0`,
      timeout: 30000,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build dev server stop request
 */
export function buildDevServerStopRequest(
  sessionId: string,
): ToolOperationRequest {
  return {
    id: generateOperationId(),
    operation: 'stop-dev-server',
    sessionId: sessionId, // Will be set by caller
    parameters: {
      command: 'pkill -f "npm.*dev" || true', // Best effort process killing
      timeout: 10000,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build port allocation request
 */
export function buildPortAllocationRequest(
  sessionId: string,
  preferredPort?: number,
): ToolOperationRequest {
  return {
    id: generateOperationId(),
    operation: 'get-available-port',
    sessionId: sessionId, // Will be set by caller
    parameters: {
      preferredPort,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build health check request
 */
export function buildHealthCheckRequest(
  sessionId: string,
): ToolOperationRequest {
  return {
    id: generateOperationId(),
    operation: 'health',
    sessionId: sessionId, // Will be set by caller
    parameters: {},
    timestamp: new Date().toISOString(),
  };
}
