/**
 * Read Tool Types
 *
 * Types for AI agent file content access operations within workspace containers
 */

/**
 * Read tool request payload
 * Used by AI agents to retrieve complete file contents
 */
export interface ToolReadRequest {
  /**
   * Path to the file to read
   * Can be absolute (/app/src/file.tsx) or relative (src/file.tsx)
   * Relative paths are resolved against workspace root (/app)
   */
  path: string;
}

/**
 * Result data from read tool operations
 * Provides file content along with comprehensive metadata
 */
export interface ToolReadResult {
  /**
   * Whether the read operation completed successfully
   * false indicates file not found, permission denied, or other error
   */
  success: boolean;

  /**
   * Complete file content as string
   * Empty string if file is empty
   * Only present when success=true
   */
  content: string;

  /**
   * File size in bytes
   * Matches content.length for text files
   */
  size: number;

  /**
   * Last modification timestamp in ISO 8601 format
   * Format: '2024-01-15T10:30:45.123Z'
   */
  lastModified: string;

  /**
   * Text encoding used for reading the file
   * Always 'utf8' for all text files
   */
  encoding: 'utf8';

  /**
   * Number of lines in the file
   * Calculated by counting newline characters
   */
  lineCount: number;

  /**
   * Error message if operation failed
   * Only present when success=false
   */
  error?: string;

  /**
   * Machine-readable error code for programmatic handling
   * Only present when success=false
   */
  code?: string;
}
