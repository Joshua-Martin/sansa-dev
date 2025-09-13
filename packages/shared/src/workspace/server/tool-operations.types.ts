/**
 * Tool Operations Union Types
 *
 * Union types and shared interfaces for all tool operations
 */

import type { ToolSearchRequest } from './search-tool.types';
import type { ToolReadRequest } from './read-tool.types';
import type { ToolCommandRequest } from './command-tool.types';
import type { ToolEditRequest } from './edit-tool.types';
import type { ToolErrorResponse } from './error-codes.types';
import type {
  ToolOperationRequest,
  ToolOperationResponse,
  ToolSearchResponse,
  ToolReadResponse,
  ToolEditResponse,
  ToolCommandResponse,
  ToolHealthResponse,
} from './tool-server-operations.types';

/**
 * Unified tool operation types
 * All operations that can be performed within workspace containers via HTTP
 */
export type ToolOperationType =
  | 'search'
  | 'read'
  | 'edit'
  | 'command'
  | 'health'
  | 'create-archive'
  | 'upload-and-extract-archive'
  | 'run-npm-install'
  | 'start-dev-server'
  | 'stop-dev-server'
  | 'get-available-port';

/**
 * Union type for all AI tool request types
 * Used by generic tool handling functions
 */
export type ToolRequest =
  | ToolSearchRequest
  | ToolReadRequest
  | ToolCommandRequest
  | ToolEditRequest;

/**
 * Union type for all request types
 * Used by the Express server for handling all request types
 */
export type AllRequestType = ToolRequest | ToolOperationRequest;

/**
 * Union type for all response types
 * Used by the Express server for handling all response types
 */
export type AllResponseType =
  | ToolSearchResponse
  | ToolReadResponse
  | ToolEditResponse
  | ToolCommandResponse
  | ToolHealthResponse
  | ToolErrorResponse;

/**
 * Generic tool handler function signature
 * Defines the contract for tool handler functions in the Express server
 */
export type ToolHandler<TRequest, TResponse> = (
  request: TRequest,
  workspaceRoot: string
) => Promise<TResponse>;

/**
 * Specific handler type signatures for each AI tool
 */
export type SearchHandler = ToolHandler<ToolSearchRequest, ToolSearchResponse>;
export type ReadHandler = ToolHandler<ToolReadRequest, ToolReadResponse>;
export type CommandHandler = ToolHandler<
  ToolCommandRequest,
  ToolCommandResponse
>;
export type EditHandler = ToolHandler<ToolEditRequest, ToolEditResponse>;

/**
 * Tool operation handler function signature
 * Defines the contract for tool operation handlers
 */
export type ToolOperationHandler<TParams, TResult> = (
  request: ToolOperationRequest & { parameters: TParams },
  workspaceRoot: string
) => Promise<ToolOperationResponse & { data: TResult }>;
