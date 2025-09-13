/**
 * Storage provider types and utilities - MVP Version
 *
 * This module provides simplified type definitions for basic storage operations,
 * including storage providers, file management, and upload handling across
 * different storage backends (MinIO, S3, Cloudflare R2).
 */

// File types
export type {
  BaseFile,
  FileMetadata,
  BaseFileUploadRequest,
} from './types/file.types';

// Storage types
export {
  type FileValidationRules,
  type FileCategory,
  FILE_VALIDATION_RULES,
} from './types/storage.types';
