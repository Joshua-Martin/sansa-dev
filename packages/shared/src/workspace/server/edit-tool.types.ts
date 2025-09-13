/**
 * Edit Tool Types
 *
 * Types for AI agent file modification operations using find and replace
 */

/**
 * Edit tool request payload
 * Used by AI agents to make targeted modifications to files
 */
export interface ToolEditRequest {
  /**
   * Path to the file to edit
   * Can be absolute (/app/src/file.tsx) or relative (src/file.tsx)
   * Relative paths are resolved against workspace root (/app)
   */
  path: string;

  /**
   * Text to find in the file for replacement
   * Must be an exact match of existing content
   * Used to locate the precise position for edit
   */
  findText: string;

  /**
   * Text to replace the found text with
   * Can be empty string for deletion
   * Can be multiple lines for insertions
   */
  replaceText: string;

  /**
   * Whether to replace all occurrences of findText
   * Default: false (replace only first occurrence)
   * When true, replaces every instance of findText in the file
   */
  replaceAll?: boolean;
}

/**
 * Result data from edit tool operations
 * Provides edit results and metadata for change tracking
 */
export interface ToolEditResult {
  /**
   * Whether the edit operation completed successfully
   * false indicates file not found, text not found, or other error
   */
  success: boolean;

  /**
   * Number of replacements made in the file
   * 0 if findText was not found in the file
   */
  replacementCount: number;

  /**
   * Original file size in bytes before edit
   * Used for change impact assessment
   */
  previousSize: number;

  /**
   * New file size in bytes after edit
   * Used for change impact assessment
   */
  newSize: number;

  /**
   * Estimated number of lines that changed
   * Calculated by comparing line counts of findText vs replaceText
   */
  linesChanged: number;

  /**
   * New last modification timestamp in ISO 8601 format
   * Format: '2024-01-15T10:30:45.123Z'
   */
  lastModified: string;

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
