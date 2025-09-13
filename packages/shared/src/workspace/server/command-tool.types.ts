/**
 * Command Tool Types
 *
 * Types for AI agent shell command execution within workspace containers
 */

/**
 * Command tool request payload
 * Used by AI agents to execute shell commands for development tasks
 */
export interface ToolCommandRequest {
  /**
   * Complete command to execute including arguments
   * Examples: 'npm install', 'git status', 'ls -la', 'grep -r "pattern" src/'
   */
  command: string;

  /**
   * Maximum execution time in milliseconds
   * Default: 30000 (30 seconds)
   * Commands exceeding timeout are forcefully terminated
   */
  timeout?: number;
}

/**
 * Result data from command tool operations
 * Provides command output, exit status, and execution metadata
 */
export interface ToolCommandResult {
  /**
   * Whether the command completed successfully
   * Based on exit code (0 = success) and timeout status
   */
  success: boolean;

  /**
   * Standard output from command execution
   * Captured as string, may contain newlines
   */
  stdout: string;

  /**
   * Standard error output from command execution
   * Captured as string, may contain newlines
   */
  stderr: string;

  /**
   * Process exit code
   * 0 indicates successful execution
   * Non-zero values indicate various error conditions
   */
  exitCode: number;

  /**
   * Command execution time in milliseconds
   * Actual time taken, may be less than timeout
   */
  executionTime: number;

  /**
   * Whether the command was terminated due to timeout
   * true if command exceeded timeout limit
   */
  timedOut: boolean;

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
