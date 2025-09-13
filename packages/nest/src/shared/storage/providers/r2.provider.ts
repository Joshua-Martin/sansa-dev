/**
 * Cloudflare R2 Storage Provider
 *
 * Implements the StorageProvider interface for Cloudflare R2 object storage.
 * Used in production environments and provides S3-compatible API.
 */

import { Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectAttributesCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageResult } from '../types/storage.types';
import { SignedUrlOptions } from '../types/storage.types';
import { StorageProvider } from '../storage.provider';
import {
  R2Config,
  ProviderFileMetadata,
  StorageOperationOptions,
} from '../types/storage.types';
import {
  StorageError,
  FileNotFoundError,
  StorageErrorCode,
} from '../errors/storage.errors';

/**
 * Cloudflare R2 implementation of the StorageProvider interface
 *
 * Provides R2-specific implementations for all storage operations,
 * including upload, download, delete, and signed URL generation.
 */
export class R2StorageProvider implements StorageProvider {
  private readonly logger = new Logger(R2StorageProvider.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly publicUrl?: string;

  /**
   * Creates a new R2 storage provider instance
   *
   * @param config - R2 configuration
   */
  constructor(private readonly config: R2Config) {
    this.client = new S3Client({
      region: config.region,
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // Disable SSL verification in development if needed
      // requestHandler: new NodeHttpHandler({
      //   httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      // }),
    });

    this.bucket = config.bucket;
    this.region = config.region;
    this.publicUrl = config.publicUrl;

    this.logger.log(`R2 provider initialized for bucket: ${this.bucket}`);
  }

  /**
   * Upload a file to R2 storage
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
      this.logger.debug(`Uploading file to R2: ${key}`);

      const uploadParams = {
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: options?.contentType || 'application/octet-stream',
        Metadata: options?.metadata || {},
        CacheControl: options?.cacheControl,
      };

      const command = new PutObjectCommand(uploadParams);
      const response = await this.client.send(command);

      const result: StorageResult = {
        id: this.generateIdFromKey(key),
        storageKey: key,
        size: file.length,
        mimeType: options?.contentType || 'application/octet-stream',
        etag: response.ETag?.replace(/"/g, ''), // Remove quotes from ETag
        uploadedAt: new Date().toISOString(),
      };

      this.logger.debug(`File uploaded successfully: ${key}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to upload file ${key}:`, error);
      throw StorageError.fromError(error, StorageErrorCode.UPLOAD_FAILED, 500);
    }
  }

  /**
   * Download a file from R2 storage
   *
   * @param key - The storage key/path of the file to download
   * @returns Promise resolving to file buffer
   */
  async download(key: string): Promise<Buffer> {
    try {
      this.logger.debug(`Downloading file from R2: ${key}`);

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new FileNotFoundError(key);
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToByteArray();

      return new Promise<Buffer>((resolve, reject) => {
        reader
          .then((arrayBuffer) => {
            const buffer = Buffer.from(arrayBuffer);
            this.logger.debug(`File downloaded successfully: ${key}`);
            resolve(buffer);
          })
          .catch((error) => {
            this.logger.error(`Failed to download file ${key}:`, error);
            reject(
              StorageError.fromError(
                error,
                StorageErrorCode.STORAGE_UNAVAILABLE,
                503,
              ),
            );
          });
      });
    } catch (error) {
      this.logger.error(`Failed to download file ${key}:`, error);
      const errorObj = error as any;
      if (errorObj?.name === 'NoSuchKey') {
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
   * Delete a file from R2 storage
   *
   * @param key - The storage key/path of the file to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(key: string): Promise<void> {
    try {
      this.logger.debug(`Deleting file from R2: ${key}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);

      this.logger.debug(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}:`, error);
      const errorObj = error as any;
      if (errorObj?.name === 'NoSuchKey') {
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
   * Check if a file exists in R2 storage
   *
   * @param key - The storage key/path to check
   * @returns Promise resolving to true if file exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      const errorObj = error as any;
      if (errorObj?.name === 'NotFound' || errorObj?.name === 'NoSuchKey') {
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
   * Generate a signed URL for accessing a file in R2
   *
   * @param key - The storage key/path of the file
   * @param options - Options for the signed URL
   * @returns Promise resolving to signed URL
   */
  async getUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    try {
      this.logger.debug(`Generating signed URL for: ${key}`);

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentType: options?.contentType,
        ResponseContentDisposition: options?.contentDisposition,
      });

      const expiry = options?.expiresIn || 3600; // Default 1 hour

      const signedUrl = await getSignedUrl(this.client, command, {
        expiresIn: expiry,
      });

      return signedUrl;
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
   * Get metadata for a file in R2
   *
   * @param key - The storage key/path of the file
   * @returns Promise resolving to file metadata
   */
  async getMetadata(key: string): Promise<ProviderFileMetadata> {
    try {
      this.logger.debug(`Getting metadata for file: ${key}`);

      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      const metadata: ProviderFileMetadata = {
        size: response.ContentLength || 0,
        mimeType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        etag: response.ETag?.replace(/"/g, ''), // Remove quotes from ETag
        customMetadata: response.Metadata || {},
      };

      return metadata;
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${key}:`, error);
      const errorObj = error as any;
      if (errorObj?.name === 'NoSuchKey') {
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
        `Deleting multiple files from R2: ${keys.length} files`,
      );

      const deleteParams = {
        Bucket: this.bucket,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
          Quiet: true, // Don't return deleted object information
        },
      };

      const command = new DeleteObjectsCommand(deleteParams);
      await this.client.send(command);

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
}
