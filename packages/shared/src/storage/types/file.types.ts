/**
 * File-related types for storage operations - MVP Version
 *
 * Simplified types for basic file handling and metadata within the storage system.
 */

/**
 * Base file interface containing all common file properties
 *
 * This serves as the foundation for all file-related entities to extend from,
 * eliminating duplication and ensuring consistency across domains.
 */
export interface BaseFile {
  /** Unique identifier for the file */
  id: string;

  /** Owner of the file */
  userId: string;

  /** Filename as uploaded by the user */
  filename: string;

  /** Storage key/path where the file is located */
  storageKey: string;

  /** MIME type of the file */
  mimeType: string;

  /** Size of the file in bytes */
  size: number;

  /** Public URL for accessing the file (if public) */
  url?: string;

  /** File metadata */
  metadata?: FileMetadata;

  /** When the file was uploaded */
  uploadedAt: string;
}

/**
 * Basic file metadata structure
 *
 * Contains essential metadata about the file content
 */
export interface FileMetadata {
  /** Image dimensions (for image files) */
  dimensions?: {
    width: number;
    height: number;
  };
}

/**
 * File upload request
 */
export interface BaseFileUploadRequest {
  /** The file to upload */
  file: File;
}
