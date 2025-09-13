/**
 * Storage error classes and enums
 *
 * Provides structured error handling for storage operations with
 * appropriate HTTP status codes and error codes.
 */

/**
 * Error codes for storage operations
 */
export enum StorageErrorCode {
  /** File not found in storage */
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',

  /** Invalid file type provided */
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',

  /** File exceeds maximum size limit */
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',

  /** Storage service is unavailable */
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',

  /** Upload operation failed */
  UPLOAD_FAILED = 'UPLOAD_FAILED',

  /** Permission denied for operation */
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  /** Invalid configuration provided */
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',

  /** File already exists */
  FILE_EXISTS = 'FILE_EXISTS',

  /** Invalid storage key format */
  INVALID_STORAGE_KEY = 'INVALID_STORAGE_KEY',

  /** Operation timed out */
  OPERATION_TIMEOUT = 'OPERATION_TIMEOUT',

  /** Malware detected in file */
  MALWARE_DETECTED = 'MALWARE_DETECTED',
}

/**
 * Base storage error class
 *
 * Extends Error with storage-specific properties for better error handling
 * and debugging across the storage system.
 */
export class StorageError extends Error {
  /**
   * Creates a new storage error
   *
   * @param code - The error code identifying the type of error
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code for API responses
   * @param originalError - Optional original error that caused this error
   */
  constructor(
    public readonly code: StorageErrorCode,
    message: string,
    public readonly statusCode: number,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'StorageError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, StorageError.prototype);
  }

  /**
   * Creates a StorageError from an unknown error
   *
   * @param error - The original error to wrap
   * @param code - The storage error code
   * @param statusCode - HTTP status code
   * @returns A new StorageError instance
   */
  static fromError(
    error: unknown,
    code: StorageErrorCode,
    statusCode: number,
  ): StorageError {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const originalError = error instanceof Error ? error : undefined;

    return new StorageError(code, message, statusCode, originalError);
  }
}

/**
 * Convenience error classes for common storage errors
 */
export class FileNotFoundError extends StorageError {
  constructor(storageKey: string) {
    super(
      StorageErrorCode.FILE_NOT_FOUND,
      `File not found: ${storageKey}`,
      404,
    );
  }
}

export class InvalidFileTypeError extends StorageError {
  constructor(mimeType: string, allowedTypes: string[]) {
    super(
      StorageErrorCode.INVALID_FILE_TYPE,
      `Invalid file type: ${mimeType}. Allowed types: ${allowedTypes.join(', ')}`,
      400,
    );
  }
}

export class FileTooLargeError extends StorageError {
  constructor(size: number, maxSize: number) {
    super(
      StorageErrorCode.FILE_TOO_LARGE,
      `File size ${size} bytes exceeds maximum allowed size of ${maxSize} bytes`,
      413,
    );
  }
}

export class StorageUnavailableError extends StorageError {
  constructor(provider: string) {
    super(
      StorageErrorCode.STORAGE_UNAVAILABLE,
      `Storage provider ${provider} is currently unavailable`,
      503,
    );
  }
}

export class UploadFailedError extends StorageError {
  constructor(reason: string) {
    super(StorageErrorCode.UPLOAD_FAILED, `Upload failed: ${reason}`, 500);
  }
}

export class PermissionDeniedError extends StorageError {
  constructor(operation: string) {
    super(
      StorageErrorCode.PERMISSION_DENIED,
      `Permission denied for operation: ${operation}`,
      403,
    );
  }
}

export class InvalidConfigurationError extends StorageError {
  constructor(missingConfig: string) {
    super(
      StorageErrorCode.INVALID_CONFIGURATION,
      `Invalid storage configuration: ${missingConfig}`,
      500,
    );
  }
}

export class FileExistsError extends StorageError {
  constructor(storageKey: string) {
    super(
      StorageErrorCode.FILE_EXISTS,
      `File already exists: ${storageKey}`,
      409,
    );
  }
}

export class InvalidStorageKeyError extends StorageError {
  constructor(storageKey: string) {
    super(
      StorageErrorCode.INVALID_STORAGE_KEY,
      `Invalid storage key format: ${storageKey}`,
      400,
    );
  }
}

export class OperationTimeoutError extends StorageError {
  constructor(operation: string) {
    super(
      StorageErrorCode.OPERATION_TIMEOUT,
      `Operation timed out: ${operation}`,
      408,
    );
  }
}

export class MalwareDetectedError extends StorageError {
  constructor(filename: string) {
    super(
      StorageErrorCode.MALWARE_DETECTED,
      `Malware detected in file: ${filename}`,
      400,
    );
  }
}
