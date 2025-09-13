/**
 * Search Tool Types
 *
 * Types for AI agent file discovery operations within workspace containers
 */

/**
 * Search tool request payload
 * Used by AI agents to discover files within the workspace codebase
 */
export interface ToolSearchRequest {
  /** Search pattern to match against file paths or content */
  pattern: string;

  /** Search strategy to use for pattern matching */
  type: 'glob' | 'regex' | 'exact';

  /**
   * Where to search for the pattern
   * - 'filenames': Search only in filenames (default for backward compatibility)
   * - 'content': Search only in file content
   * - 'both': Search in both filenames and content
   */
  searchIn?: 'filenames' | 'content' | 'both';

  /**
   * Whether pattern matching should be case sensitive
   * Default: false (case-insensitive matching)
   */
  caseSensitive?: boolean;

  /**
   * Maximum number of results to return
   * Default: 1000
   * Prevents memory exhaustion from overly broad searches
   */
  maxResults?: number;
}

/**
 * Individual file result from search operations
 * Represents a single file that matches the search criteria
 */
export interface ToolSearchFileResult {
  /**
   * Absolute path to the file from container root
   * Always starts with '/app' for workspace files
   */
  path: string;

  /**
   * File size in bytes
   * Helps AI agents decide whether to read large files
   */
  size: number;

  /**
   * Last modification timestamp in ISO 8601 format
   * Format: '2024-01-15T10:30:45.123Z'
   */
  lastModified: string;
}

/**
 * Result data from search tool operations
 * Provides search results along with operation metadata
 */
export interface ToolSearchResult {
  /**
   * Whether the search operation completed successfully
   * false indicates an error occurred during search
   */
  success: boolean;

  /**
   * Array of files matching the search criteria
   * Empty array if no matches found
   */
  results: ToolSearchFileResult[];

  /**
   * Total number of files found (before maxResults limit)
   * May be larger than results.length if truncated
   */
  totalFound: number;

  /**
   * Search operation execution time in milliseconds
   * Used for performance monitoring
   */
  executionTime: number;

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
