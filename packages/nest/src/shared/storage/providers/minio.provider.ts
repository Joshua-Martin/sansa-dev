/**
 * MinIO Storage Provider
 *
 * Implements the StorageProvider interface for MinIO object storage.
 * Used in development environments and provides S3-compatible API.
 */

import { Logger } from '@nestjs/common';
import { Client } from 'minio';
import { StorageResult } from '../types/storage.types';
import { SignedUrlOptions } from '../types/storage.types';
import { StorageProvider } from '../storage.provider';
import {
  MinioConfig,
  ProviderFileMetadata,
  StorageOperationOptions,
} from '../types/storage.types';
import {
  StorageError,
  FileNotFoundError,
  UploadFailedError,
  StorageUnavailableError,
  StorageErrorCode,
} from '../errors/storage.errors';

/**
 * MinIO implementation of the StorageProvider interface
 *
 * Provides MinIO-specific implementations for all storage operations,
 * including upload, download, delete, and signed URL generation.
 */
export class MinioStorageProvider implements StorageProvider {
  private readonly logger = new Logger(MinioStorageProvider.name);
  private readonly client: Client;
  private readonly bucket: string;
  private readonly region: string;

  /**
   * Creates a new MinIO storage provider instance
   *
   * @param config - MinIO configuration
   */
  constructor(private readonly config: MinioConfig) {
    // Parse the endpoint URL to extract hostname and port
    const url = new URL(config.endpoint);
    const hostname = url.hostname;
    const port = url.port
      ? parseInt(url.port)
      : config.endpoint.startsWith('https')
        ? 443
        : 80;

    this.client = new Client({
      endPoint: hostname,
      port: port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
    });

    this.bucket = config.bucket;
    this.region = config.region;

    this.logger.log(`MinIO provider initialized for bucket: ${this.bucket}`);

    // Ensure bucket exists
    this.ensureBucketExists();
  }

  /**
   * Upload a file to MinIO storage
   *
   * @param file - The file buffer to upload
   * @param key - The storage key/path for the file
   * @param options - Optional upload configuration
   * @returns Promise resolving to storage result
   */
  async upload(
    file: Buffer,
    key: string,
    options?: StorageOperationOptions,
  ): Promise<StorageResult> {
    try {
      this.logger.debug(`Uploading file to MinIO: ${key}`);

      const uploadOptions: any = {
        'Content-Type': options?.contentType || 'application/octet-stream',
      };

      // Add custom metadata if provided
      if (options?.metadata) {
        Object.entries(options.metadata).forEach(([metaKey, metaValue]) => {
          uploadOptions[`x-amz-meta-${metaKey}`] = metaValue;
        });
      }

      // Add cache control if provided
      if (options?.cacheControl) {
        uploadOptions['Cache-Control'] = options.cacheControl;
      }

      await this.client.putObject(this.bucket, key, file, uploadOptions);

      const stat = await this.client.statObject(this.bucket, key);

      const result: StorageResult = {
        id: this.generateIdFromKey(key),
        storageKey: key,
        size: stat.size,
        mimeType: stat.metaData?.['content-type'] || 'application/octet-stream',
        etag: stat.etag,
        uploadedAt: stat.lastModified.toISOString(),
      };

      this.logger.debug(`File uploaded successfully: ${key}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to upload file ${key}:`, error);
      throw StorageError.fromError(error, StorageErrorCode.UPLOAD_FAILED, 500);
    }
  }

  /**
   * Download a file from MinIO storage
   *
   * @param key - The storage key/path of the file to download
   * @returns Promise resolving to file buffer
   */
  async download(key: string): Promise<Buffer> {
    try {
      this.logger.debug(`Downloading file from MinIO: ${key}`);

      const stream = await this.client.getObject(this.bucket, key);
      const chunks: Buffer[] = [];

      return new Promise<Buffer>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        stream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          this.logger.debug(`File downloaded successfully: ${key}`);
          resolve(buffer);
        });

        stream.on('error', (error) => {
          this.logger.error(`Failed to download file ${key}:`, error);
          reject(
            StorageError.fromError(error, StorageErrorCode.FILE_NOT_FOUND, 404),
          );
        });
      });
    } catch (error) {
      this.logger.error(`Failed to download file ${key}:`, error);
      const errorObj = error as any;
      if (errorObj?.code === 'NotFound') {
        throw new FileNotFoundError(key);
      }
      throw StorageError.fromError(
        error,
        StorageErrorCode.STORAGE_UNAVAILABLE,
        503,
      );
    }
  }

  /**
   * Delete a file from MinIO storage
   *
   * @param key - The storage key/path of the file to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(key: string): Promise<void> {
    try {
      this.logger.debug(`Deleting file from MinIO: ${key}`);

      await this.client.removeObject(this.bucket, key);

      this.logger.debug(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}:`, error);
      const errorObj = error as any;
      if (errorObj?.code === 'NotFound') {
        throw new FileNotFoundError(key);
      }
      throw StorageError.fromError(
        error,
        StorageErrorCode.STORAGE_UNAVAILABLE,
        503,
      );
    }
  }

  /**
   * Check if a file exists in MinIO storage
   *
   * @param key - The storage key/path to check
   * @returns Promise resolving to true if file exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, key);
      return true;
    } catch (error) {
      const errorObj = error as any;
      if (errorObj?.code === 'NotFound') {
        return false;
      }
      this.logger.error(`Failed to check file existence ${key}:`, error);
      throw StorageError.fromError(
        error,
        StorageErrorCode.STORAGE_UNAVAILABLE,
        503,
      );
    }
  }

  /**
   * Generate a signed URL for accessing a file in MinIO
   *
   * @param key - The storage key/path of the file
   * @param options - Options for the signed URL
   * @returns Promise resolving to signed URL
   */
  async getUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    try {
      this.logger.debug(`Generating signed URL for: ${key}`);

      const expiry = options?.expiresIn || 3600; // Default 1 hour

      const url = await this.client.presignedGetObject(
        this.bucket,
        key,
        expiry,
        {
          'Content-Type': options?.contentType,
          'Content-Disposition': options?.contentDisposition,
        },
      );

      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for ${key}:`, error);
      throw StorageError.fromError(
        error,
        StorageErrorCode.STORAGE_UNAVAILABLE,
        503,
      );
    }
  }

  /**
   * Get metadata for a file in MinIO
   *
   * @param key - The storage key/path of the file
   * @returns Promise resolving to file metadata
   */
  async getMetadata(key: string): Promise<ProviderFileMetadata> {
    try {
      this.logger.debug(`Getting metadata for file: ${key}`);

      const stat = await this.client.statObject(this.bucket, key);

      const metadata: ProviderFileMetadata = {
        size: stat.size,
        mimeType: stat.metaData?.['content-type'] || 'application/octet-stream',
        lastModified: stat.lastModified,
        etag: stat.etag,
        customMetadata: {},
      };

      // Extract custom metadata (x-amz-meta-* headers)
      if (stat.metaData) {
        Object.entries(stat.metaData).forEach(([key, value]) => {
          if (key.startsWith('x-amz-meta-')) {
            const metaKey = key.replace('x-amz-meta-', '');
            metadata.customMetadata![metaKey] = value;
          }
        });
      }

      return metadata;
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${key}:`, error);
      const errorObj = error as any;
      if (errorObj?.code === 'NotFound') {
        throw new FileNotFoundError(key);
      }
      throw StorageError.fromError(
        error,
        StorageErrorCode.STORAGE_UNAVAILABLE,
        503,
      );
    }
  }

  /**
   * Delete multiple files in a batch operation
   *
   * @param keys - Array of storage keys to delete
   * @returns Promise resolving when all deletions are complete
   */
  async deleteMultiple(keys: string[]): Promise<void> {
    try {
      this.logger.debug(
        `Deleting multiple files from MinIO: ${keys.length} files`,
      );

      // MinIO client supports batch delete via removeObjects
      await this.client.removeObjects(this.bucket, keys);

      this.logger.debug(`Batch deletion completed for ${keys.length} files`);
    } catch (error) {
      this.logger.error(`Failed to delete multiple files:`, error);
      throw StorageError.fromError(
        error,
        StorageErrorCode.STORAGE_UNAVAILABLE,
        503,
      );
    }
  }

  /**
   * Get the bucket name for this provider
   *
   * @returns The bucket name
   */
  getBucket(): string {
    return this.bucket;
  }

  /**
   * Get the region for this provider
   *
   * @returns The region
   */
  getRegion(): string {
    return this.region;
  }

  /**
   * Generate a unique ID from a storage key
   *
   * @param key - The storage key
   * @returns A unique identifier
   */
  private generateIdFromKey(key: string): string {
    // Extract timestamp and UUID from key structure
    // Expected format: /{userId}/{workspaceId}/{category}/{filename}-{timestamp}-{uuid}.{ext}
    const parts = key.split('/');
    const filename = parts[parts.length - 1];
    const filenameParts = filename.split('-');

    if (filenameParts.length >= 3) {
      // Extract UUID from the end
      const uuid = filenameParts[filenameParts.length - 1].split('.')[0];
      return uuid;
    }

    // Fallback: generate a simple hash
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure the bucket exists, create it if it doesn't
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      const bucketExists = await this.client.bucketExists(this.bucket);
      if (!bucketExists) {
        this.logger.log(`Creating bucket: ${this.bucket}`);
        await this.client.makeBucket(this.bucket, this.region);
        this.logger.log(`Successfully created bucket: ${this.bucket}`);
      } else {
        this.logger.debug(`Bucket already exists: ${this.bucket}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to ensure bucket exists: ${this.bucket}`,
        error,
      );
      // Don't throw - let the application start and handle bucket errors later
    }
  }
}
