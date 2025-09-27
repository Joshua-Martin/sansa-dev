/**
 * Storage Service
 *
 * Main service that orchestrates all storage operations and manages
 * different storage providers (MinIO for development, R2 for production).
 * Provides a unified interface for file operations across the application.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageResult } from './types/storage.types';
import { SignedUrlOptions } from './types/storage.types';
import { FILE_VALIDATION_RULES } from '@sansa-dev/shared';
import { StorageProvider } from './storage.provider';
import { MinioStorageProvider } from './providers/minio.provider';
import { R2StorageProvider } from './providers/r2.provider';
import {
  ExtendedStorageConfig,
  MinioConfig,
  R2Config,
  FileUploadRequest,
  ProviderFileMetadata,
  BatchOperationResult,
} from './types/storage.types';
import {
  InvalidConfigurationError,
  InvalidFileTypeError,
  FileTooLargeError,
  InvalidStorageKeyError,
} from './errors/storage.errors';

/**
 * Main storage service that provides unified file operations
 *
 * This service acts as the primary interface for all storage operations,
 * automatically selecting the appropriate provider based on configuration
 * and handling validation, error handling, and retries.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private provider: StorageProvider;
  private config: ExtendedStorageConfig;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize the storage service on module startup
   *
   * Configures the appropriate storage provider based on environment
   * variables and validates the configuration.
   */
  async onModuleInit(): Promise<void> {
    try {
      this.config = this.loadConfiguration();
      this.provider = this.createProvider();
      this.logger.log(
        `Storage service initialized with provider: ${this.config.provider}`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize storage service:', error);
      throw error;
    }
  }

  /**
   * Upload a file to storage
   *
   * @param request - File upload request with metadata
   * @returns Promise resolving to storage result
   */
  async uploadFile(request: FileUploadRequest): Promise<StorageResult> {
    try {
      this.logger.debug(
        `Uploading file: ${request.filename} for user: ${request.userId}`,
      );

      // Validate file
      await this.validateFile(request);

      // Generate storage key
      const storageKey = this.generateStorageKey(request);

      // Upload to provider
      const result = await this.provider.upload(request.file, storageKey, {
        contentType: request.mimeType,
        metadata: {
          userId: request.userId,
          workspaceId: request.workspaceId,
          category: request.category,
          originalFilename: request.filename,
          uploadedAt: new Date().toISOString(),
          ...request.metadata,
        },
      });

      this.logger.log(`File uploaded successfully: ${storageKey}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to upload file ${request.filename}:`, error);
      throw error;
    }
  }

  /**
   * Download a file from storage
   *
   * @param storageKey - The storage key of the file to download
   * @returns Promise resolving to file buffer
   */
  async downloadFile(storageKey: string): Promise<Buffer> {
    try {
      this.logger.debug(`Downloading file: ${storageKey}`);

      this.validateStorageKey(storageKey);
      const buffer = await this.provider.download(storageKey);

      this.logger.debug(`File downloaded successfully: ${storageKey}`);
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to download file ${storageKey}:`, error);
      throw error;
    }
  }

  /**
   * Delete a file from storage
   *
   * @param storageKey - The storage key of the file to delete
   * @returns Promise resolving when deletion is complete
   */
  async deleteFile(storageKey: string): Promise<void> {
    try {
      this.logger.debug(`Deleting file: ${storageKey}`);

      this.validateStorageKey(storageKey);
      await this.provider.delete(storageKey);

      this.logger.log(`File deleted successfully: ${storageKey}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${storageKey}:`, error);
      throw error;
    }
  }

  /**
   * Delete multiple files in a batch operation
   *
   * @param storageKeys - Array of storage keys to delete
   * @returns Promise resolving to batch operation result
   */
  async deleteFiles(storageKeys: string[]): Promise<BatchOperationResult> {
    try {
      this.logger.debug(`Deleting ${storageKeys.length} files in batch`);

      // Validate all storage keys
      const invalidKeys = storageKeys.filter(
        (key) => !this.isValidStorageKey(key),
      );
      if (invalidKeys.length > 0) {
        throw new InvalidStorageKeyError(invalidKeys[0]);
      }

      await this.provider.deleteMultiple(storageKeys);

      this.logger.log(
        `Batch deletion completed for ${storageKeys.length} files`,
      );
      return {
        successful: storageKeys,
        failed: [],
      };
    } catch (error) {
      this.logger.error(`Failed to delete files in batch:`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists in storage
   *
   * @param storageKey - The storage key to check
   * @returns Promise resolving to true if file exists, false otherwise
   */
  async fileExists(storageKey: string): Promise<boolean> {
    try {
      this.logger.debug(`Checking file existence: ${storageKey}`);

      this.validateStorageKey(storageKey);
      return await this.provider.exists(storageKey);
    } catch (error) {
      this.logger.error(`Failed to check file existence ${storageKey}:`, error);
      throw error;
    }
  }

  /**
   * Get metadata for a file
   *
   * @param storageKey - The storage key of the file
   * @returns Promise resolving to file metadata
   */
  async getFileMetadata(storageKey: string): Promise<ProviderFileMetadata> {
    try {
      this.logger.debug(`Getting metadata for file: ${storageKey}`);

      this.validateStorageKey(storageKey);
      return await this.provider.getMetadata(storageKey);
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${storageKey}:`, error);
      throw error;
    }
  }

  /**
   * Generate a signed URL for accessing a file
   *
   * @param storageKey - The storage key of the file
   * @param options - Options for the signed URL
   * @returns Promise resolving to signed URL
   */
  async getFileUrl(
    storageKey: string,
    options?: SignedUrlOptions,
  ): Promise<string> {
    try {
      this.logger.debug(`Generating signed URL for: ${storageKey}`);

      this.validateStorageKey(storageKey);
      return await this.provider.getUrl(storageKey, options);
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL for ${storageKey}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get the current storage provider
   *
   * @returns The current storage provider instance
   */
  getProvider(): StorageProvider {
    return this.provider;
  }

  /**
   * Get the current storage configuration
   *
   * @returns The current storage configuration
   */
  getConfig(): ExtendedStorageConfig {
    return this.config;
  }

  /**
   * Validate a file upload request
   *
   * @param request - File upload request to validate
   * @throws StorageError if validation fails
   */
  private async validateFile(request: FileUploadRequest): Promise<void> {
    // Get validation rules for the category
    const rules = FILE_VALIDATION_RULES[request.category];
    if (!rules) {
      throw new InvalidFileTypeError(request.mimeType, []);
    }

    // Check file size
    if (request.file.length > rules.maxSizeBytes) {
      throw new FileTooLargeError(request.file.length, rules.maxSizeBytes);
    }

    // Check MIME type
    if (!rules.allowedMimeTypes.includes(request.mimeType)) {
      throw new InvalidFileTypeError(request.mimeType, rules.allowedMimeTypes);
    }
  }

  /**
   * Generate a storage key for a file
   *
   * @param request - File upload request
   * @returns Generated storage key
   */
  private generateStorageKey(request: FileUploadRequest): string {
    const timestamp = Date.now();
    const uuid = this.generateUUID();
    const extension = this.getFileExtension(request.filename);

    // Format: /{userId}/{workspaceId}/{category}/{filename}-{timestamp}-{uuid}.{extension}
    return `/${request.userId}/${request.workspaceId}/${request.category}/${request.filename}-${timestamp}-${uuid}.${extension}`;
  }

  /**
   * Validate a storage key format
   *
   * @param storageKey - Storage key to validate
   * @throws InvalidStorageKeyError if key is invalid
   */
  private validateStorageKey(storageKey: string): void {
    if (!this.isValidStorageKey(storageKey)) {
      throw new InvalidStorageKeyError(storageKey);
    }
  }

  /**
   * Check if a storage key has valid format
   *
   * @param storageKey - Storage key to check
   * @returns True if key is valid, false otherwise
   */
  private isValidStorageKey(storageKey: string): boolean {
    // Support multiple valid formats:
    // 1. Workspace format: /workspaces/{userId}/{workspaceId}/workspace.tar.gz
    // 2. General format: /{userId}/{workspaceId}/{category}/{filename}-{timestamp}-{uuid}.{extension}
    const workspacePattern =
      /^\/workspaces\/[^\/]+\/[^\/]+\/workspace\.tar\.gz$/;
    const generalPattern =
      /^\/[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+-\d+-[^\/]+\.[^\/]+$/;

    return workspacePattern.test(storageKey) || generalPattern.test(storageKey);
  }

  /**
   * Load storage configuration from environment variables
   *
   * @returns Storage configuration
   * @throws InvalidConfigurationError if configuration is invalid
   */
  private loadConfiguration(): ExtendedStorageConfig {
    const provider = this.configService.get<string>(
      'STORAGE_PROVIDER',
      'minio',
    );

    const baseConfig = {
      provider: provider as 'minio' | 'r2',
      bucket:
        this.configService.get<string>('STORAGE_BUCKET') ||
        this.getDefaultBucket(provider),
      region: this.configService.get<string>('STORAGE_REGION', 'us-east-1'),
      publicUrl: this.configService.get<string>('STORAGE_PUBLIC_URL'),
      signedUrlExpiry: parseInt(
        this.configService.get<string>('STORAGE_SIGNED_URL_EXPIRY', '3600'),
      ),
      maxFileSize: parseInt(
        this.configService.get<string>('STORAGE_MAX_FILE_SIZE', '10485760'),
      ), // 10MB
      allowedMimeTypes: this.getDefaultAllowedMimeTypes(),
    };

    if (provider === 'minio') {
      const minioConfig: MinioConfig = {
        endpoint: this.configService.get<string>(
          'MINIO_ENDPOINT',
          'http://minio:9000',
        ),
        accessKey: this.configService.get<string>(
          'MINIO_ACCESS_KEY',
          'minioadmin',
        ),
        secretKey: this.configService.get<string>(
          'MINIO_SECRET_KEY',
          'minioadmin123',
        ),
        bucket: this.configService.get<string>(
          'MINIO_BUCKET',
          'sansa-dev-files',
        ),
        region: this.configService.get<string>('MINIO_REGION', 'us-east-1'),
        useSSL:
          this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      };

      return { ...baseConfig, minio: minioConfig };
    } else if (provider === 'r2') {
      const r2Config: R2Config = {
        accountId: this.configService.get<string>('R2_ACCOUNT_ID') || '',
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY', '') || '',
        secretAccessKey:
          this.configService.get<string>('R2_SECRET_KEY', '') || '',
        bucket: this.configService.get<string>('R2_BUCKET', 'x21-prod-files'),
        region: this.configService.get<string>('R2_REGION', 'auto'),
        publicUrl: this.configService.get<string>('R2_PUBLIC_URL'),
      };

      // Validate required R2 configuration
      if (
        !r2Config.accountId ||
        !r2Config.accessKeyId ||
        !r2Config.secretAccessKey
      ) {
        throw new InvalidConfigurationError(
          'R2_ACCOUNT_ID, R2_ACCESS_KEY, and R2_SECRET_KEY are required for R2 provider',
        );
      }

      return { ...baseConfig, r2: r2Config };
    }

    throw new InvalidConfigurationError(
      `Unsupported storage provider: ${provider}`,
    );
  }

  /**
   * Create the appropriate storage provider instance
   *
   * @returns Storage provider instance
   */
  private createProvider(): StorageProvider {
    switch (this.config.provider) {
      case 'minio':
        if (!this.config.minio) {
          throw new InvalidConfigurationError(
            'MinIO configuration is required',
          );
        }
        return new MinioStorageProvider(this.config.minio);

      case 'r2':
        if (!this.config.r2) {
          throw new InvalidConfigurationError('R2 configuration is required');
        }
        return new R2StorageProvider(this.config.r2);

      default:
        throw new InvalidConfigurationError(
          `Unsupported storage provider: ${this.config.provider}`,
        );
    }
  }

  /**
   * Get default bucket name for a provider
   *
   * @param provider - Storage provider
   * @returns Default bucket name
   */
  private getDefaultBucket(provider: string): string {
    return provider === 'minio' ? 'sansa-dev-files' : 'x21-prod-files';
  }

  /**
   * Get default allowed MIME types
   *
   * @returns Array of allowed MIME types
   */
  private getDefaultAllowedMimeTypes(): string[] {
    return [
      'image/png',
      'image/jpeg',
      'image/svg+xml',
      'image/webp',
      'application/pdf',
      'application/zip',
      'application/x-tar',
      'application/gzip',
    ];
  }

  /**
   * Generate a UUID v4
   *
   * @returns UUID string
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get file extension from filename
   *
   * @param filename - Filename
   * @returns File extension (without dot)
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }
}
