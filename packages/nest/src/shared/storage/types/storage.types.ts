/**
 * Nest-specific storage types
 *
 * These types are used only within the Nest backend and contain
 * provider-specific configurations and internal interfaces.
 */

/**
 * Result returned from storage operations
 */
export interface StorageResult {
  /** Unique identifier for the stored file */
  id: string;

  /** Storage key/path where the file is located */
  storageKey: string;

  /** Size of the uploaded file in bytes */
  size: number;

  /** MIME type of the uploaded file */
  mimeType: string;

  /** ETag for the uploaded file (if provided by storage provider) */
  etag?: string;

  /** Timestamp when the file was uploaded */
  uploadedAt: string;
}

/**
 * Configuration for storage operations
 */
export interface StorageConfig {
  /** Storage provider to use */
  provider: 'minio' | 'r2';

  /** Storage bucket name */
  bucket: string;

  /** Storage region (optional, defaults vary by provider) */
  region?: string;

  /** Public URL for accessing files (optional, for R2) */
  publicUrl?: string;

  /** Default expiry time for signed URLs in seconds */
  signedUrlExpiry: number;

  /** Maximum file size allowed in bytes */
  maxFileSize: number;

  /** Allowed MIME types for uploads */
  allowedMimeTypes: string[];
}

/**
 * Options for generating signed URLs
 */
export interface SignedUrlOptions {
  /** URL expiry time in seconds */
  expiresIn: number;

  /** Content type header for the URL */
  contentType?: string;

  /** Content disposition for the URL */
  contentDisposition?: 'inline' | 'attachment';
}

/**
 * MinIO storage provider configuration
 */
export interface MinioConfig {
  /** MinIO server endpoint URL */
  endpoint: string;

  /** Access key for MinIO authentication */
  accessKey: string;

  /** Secret key for MinIO authentication */
  secretKey: string;

  /** Storage bucket name */
  bucket: string;

  /** Storage region */
  region: string;

  /** Whether to use SSL/TLS for connections */
  useSSL: boolean;
}

/**
 * Cloudflare R2 storage provider configuration
 */
export interface R2Config {
  /** Cloudflare account ID */
  accountId: string;

  /** R2 access key ID */
  accessKeyId: string;

  /** R2 secret access key */
  secretAccessKey: string;

  /** Storage bucket name */
  bucket: string;

  /** Storage region */
  region: string;

  /** Public URL for accessing files (optional) */
  publicUrl?: string;
}

/**
 * Storage provider configuration union
 */
export type StorageProviderConfig = MinioConfig | R2Config;

/**
 * Extended storage configuration with provider-specific settings
 */
export interface ExtendedStorageConfig extends StorageConfig {
  /** MinIO-specific configuration (when using MinIO provider) */
  minio?: MinioConfig;

  /** R2-specific configuration (when using R2 provider) */
  r2?: R2Config;
}

/**
 * File upload request with additional context
 */
export interface FileUploadRequest {
  /** The file buffer to upload */
  file: Buffer;

  /** Original filename */
  filename: string;

  /** MIME type of the file */
  mimeType: string;

  /** User ID who owns the file */
  userId: string;

  /** Project ID the file belongs to */
  workspaceId: string;

  /** File category (brand-asset, brand-board, code-snapshot) */
  category: string;

  /** Optional metadata */
  metadata?: Record<string, string>;
}

/**
 * File metadata returned from storage providers
 */
export interface ProviderFileMetadata {
  /** Size in bytes */
  size: number;

  /** MIME type */
  mimeType: string;

  /** Last modified timestamp */
  lastModified: Date;

  /** ETag */
  etag?: string;

  /** Additional provider-specific metadata */
  customMetadata?: Record<string, string>;
}

/**
 * Storage operation options
 */
export interface StorageOperationOptions {
  /** Content type for the operation */
  contentType?: string;

  /** Custom metadata to attach */
  metadata?: Record<string, string>;

  /** Cache control settings */
  cacheControl?: string;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  /** Successfully processed items */
  successful: string[];

  /** Failed items with error details */
  failed: Array<{
    key: string;
    error: string;
  }>;
}
