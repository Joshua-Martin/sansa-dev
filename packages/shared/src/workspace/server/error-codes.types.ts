/**
 * Error Codes and Error Handling Types
 *
 * Standard error codes and error response structures for all tool operations
 */

/**
 * Standard error codes for tool operations
 * Provides consistent, machine-readable error identification
 */
export enum ToolErrorCode {
  // Generic errors
  /** Internal server error occurred */
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  /** Request exceeded rate limit */
  RATE_LIMIT = 'RATE_LIMIT',

  /** Invalid request format or missing required fields */
  INVALID_REQUEST = 'INVALID_REQUEST',

  // Search tool errors
  /** Search pattern not provided */
  MISSING_PATTERN = 'MISSING_PATTERN',

  /** Invalid search type specified */
  INVALID_SEARCH_TYPE = 'INVALID_SEARCH_TYPE',

  /** Search operation failed */
  SEARCH_ERROR = 'SEARCH_ERROR',

  // Read tool errors
  /** File path not provided */
  MISSING_PATH = 'MISSING_PATH',

  /** File not found at specified path */
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',

  /** Path is not a file (directory, symlink, etc.) */
  NOT_A_FILE = 'NOT_A_FILE',

  /** File read operation failed */
  READ_ERROR = 'READ_ERROR',

  // Command tool errors
  /** Command not provided */
  MISSING_COMMAND = 'MISSING_COMMAND',

  /** Command execution timed out */
  COMMAND_TIMEOUT = 'COMMAND_TIMEOUT',

  /** Command execution failed */
  COMMAND_ERROR = 'COMMAND_ERROR',

  // Edit tool errors
  /** Find text not provided */
  MISSING_FIND_TEXT = 'MISSING_FIND_TEXT',

  /** Text to find was not found in the file */
  TEXT_NOT_FOUND = 'TEXT_NOT_FOUND',

  /** File edit operation failed */
  EDIT_ERROR = 'EDIT_ERROR',

  /** Path outside workspace boundaries */
  FORBIDDEN_PATH = 'FORBIDDEN_PATH',

  // Session and security errors
  /** Session not found or access denied */
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',

  /** Session not ready for tool operations */
  SESSION_NOT_READY = 'SESSION_NOT_READY',

  /** Tool server not available in container */
  TOOL_SERVER_UNAVAILABLE = 'TOOL_SERVER_UNAVAILABLE',
}

/**
 * Standard error response structure for all tool operations
 * Provides consistent error reporting format
 */
export interface ToolErrorResponse {
  /**
   * Always false for error responses
   * Indicates operation did not complete successfully
   */
  success: false;

  /**
   * Human-readable error message
   * Suitable for display to users or logging
   */
  error: string;

  /**
   * Machine-readable error code
   * Maps to ToolErrorCode enum values
   */
  code: ToolErrorCode;

  /**
   * Optional additional error context
   * May include validation errors, field-specific issues, etc.
   */
  details?: Record<string, unknown>;
}
