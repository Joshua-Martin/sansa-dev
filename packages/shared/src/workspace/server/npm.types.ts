/**
 * NPM Types
 *
 * Types for NPM operations within workspace containers.
 * Provides comprehensive type definitions for package management operations
 * with proper error handling and result tracking.
 */

/**
 * NPM install operation parameters
 * Defines the input parameters for NPM package installation operations
 */
export interface NpmInstallParams {
  /** Working directory where npm install should be executed */
  workingDir: string;
  /** Optional timeout in milliseconds for the operation (default: 300000 = 5 minutes) */
  timeout?: number;
}

/**
 * NPM install result data
 * Comprehensive result information for NPM package installation operations
 */
export interface NpmInstallResultData {
  /** Number of packages that were installed/updated */
  packagesInstalled: number;
  /** Total duration of the operation in milliseconds */
  duration: number;
  /** Whether the package-lock.json file was created or updated */
  lockfileUpdated: boolean;
}
