/**
 * Shared storage types for frontend use
 *
 * These types define the validation rules and file categories that the
 * frontend needs for client-side validation and UI hints.
 */

/**
 * Validation rules for file uploads
 */
export interface FileValidationRules {
  /** Allowed MIME types */
  allowedMimeTypes: string[];

  /** Maximum file size in bytes */
  maxSizeBytes: number;

  /** Allowed file extensions */
  allowedExtensions: string[];
}

/**
 * Predefined validation rules for different file categories
 */
export const FILE_VALIDATION_RULES = {
  /** Brand assets validation rules */
  brandAsset: {
    allowedMimeTypes: [
      'image/png',
      'image/jpeg',
      'image/svg+xml',
      'application/pdf',
    ],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.svg', '.pdf'],
    scanForMalware: true,
  } as FileValidationRules,

  /** Brand board images validation rules */
  brandBoard: {
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSizeBytes: 20 * 1024 * 1024, // 20MB
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp'],
    scanForMalware: true,
  } as FileValidationRules,

  /** Workspace archive validation rules */
  'workspace-archive': {
    allowedMimeTypes: [
      'application/gzip',
      'application/x-tar',
      'application/zip',
    ],
    maxSizeBytes: 100 * 1024 * 1024, // 100MB (larger limit for workspace files)
    allowedExtensions: ['.tar.gz', '.tgz', '.zip'],
    scanForMalware: false, // Skip malware scanning for workspace archives
  } as FileValidationRules,
} as const;

/**
 * File categories supported by the storage system
 */
export type FileCategory = keyof typeof FILE_VALIDATION_RULES;
