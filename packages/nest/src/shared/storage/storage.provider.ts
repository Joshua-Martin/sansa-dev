/**
 * Storage Provider Interface
 *
 * Defines the contract that all storage providers must implement.
 * This abstraction allows the storage service to work with different
 * backend storage systems (MinIO, Cloudflare R2, etc.) through a
 * unified interface.
 */

import { StorageResult } from './types/storage.types';
import { SignedUrlOptions } from './types/storage.types';
import {
  ProviderFileMetadata,
  StorageOperationOptions,
} from './types/storage.types';

/**
 * Abstract storage provider interface
 *
 * All storage providers must implement this interface to ensure
 * consistent behavior across different storage backends.
 */
export interface StorageProvider {
  /**
   * Upload a file to storage
   *
   * @param file - The file buffer to upload
   * @param key - The storage key/path for the file
   * @param options - Optional upload configuration
   * @returns Promise resolving to storage result
   */
  upload(
    file: Buffer,
    key: string,
    options?: StorageOperationOptions,
  ): Promise<StorageResult>;

  /**
   * Download a file from storage
   *
   * @param key - The storage key/path of the file to download
   * @returns Promise resolving to file buffer
   */
  download(key: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   *
   * @param key - The storage key/path of the file to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists in storage
   *
   * @param key - The storage key/path to check
   * @returns Promise resolving to true if file exists, false otherwise
   */
  exists(key: string): Promise<boolean>;

  /**
   * Generate a signed URL for accessing a file
   *
   * @param key - The storage key/path of the file
   * @param options - Options for the signed URL
   * @returns Promise resolving to signed URL
   */
  getUrl(key: string, options?: SignedUrlOptions): Promise<string>;

  /**
   * Get metadata for a file
   *
   * @param key - The storage key/path of the file
   * @returns Promise resolving to file metadata
   */
  getMetadata(key: string): Promise<ProviderFileMetadata>;

  /**
   * Delete multiple files in a batch operation
   *
   * @param keys - Array of storage keys to delete
   * @returns Promise resolving when all deletions are complete
   */
  deleteMultiple(keys: string[]): Promise<void>;

  /**
   * Get the bucket name for this provider
   *
   * @returns The bucket name
   */
  getBucket(): string;

  /**
   * Get the region for this provider
   *
   * @returns The region
   */
  getRegion(): string;
}
