/**
 * Standardized error types for the X21 application
 *
 * This provides a consistent error structure across the entire application,
 * ensuring clear communication between frontend and backend systems.
 */

/**
 * Main application error categories
 */
export type X21ErrorCategory =
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'SERVICE_UNAVAILABLE';

/**
 * Severity levels for errors
 */
export type X21ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Standardized error structure for the X21 application
 */
export type X21Error = {
  /** Unique error code for programmatic handling */
  code: string;
  /** Error category for classification */
  category: X21ErrorCategory;
  /** Human-readable error message */
  message: string;
  /** User-friendly message that can be displayed in UI */
  userMessage: string;
  /** Error severity level */
  severity: X21ErrorSeverity;
  /** Timestamp when error occurred */
  timestamp: string;
  /** Optional additional details */
  details?: Record<string, unknown>;
  /** Optional suggestions for resolving the error */
  suggestions?: string[];
  /** Optional help URL for more information */
  helpUrl?: string;
};

/**
 * Error response format for API responses
 */
export type X21ErrorResponse = {
  error: X21Error;
  /** Request ID for tracking */
  requestId?: string;
  /** Optional path where error occurred */
  path?: string;
};

/**
 * Base class for creating standardized errors
 */
export class BaseDaError extends Error {
  public readonly category: X21ErrorCategory;
  public readonly code: string;
  public readonly userMessage: string;
  public readonly severity: X21ErrorSeverity;
  public readonly timestamp: string;
  public readonly details?: Record<string, unknown>;
  public readonly suggestions?: string[];
  public readonly helpUrl?: string;

  constructor(
    category: X21ErrorCategory,
    code: string,
    message: string,
    userMessage: string,
    severity: X21ErrorSeverity = 'MEDIUM',
    details?: Record<string, unknown>,
    suggestions?: string[],
    helpUrl?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.category = category;
    this.code = code;
    this.userMessage = userMessage;
    this.severity = severity;
    this.timestamp = new Date().toISOString();
    this.details = details;
    this.suggestions = suggestions;
    this.helpUrl = helpUrl;
  }

  /**
   * Convert error to X21Error format
   */
  toX21Error(): X21Error {
    return {
      code: this.code,
      category: this.category,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      timestamp: this.timestamp,
      details: this.details,
      suggestions: this.suggestions,
      helpUrl: this.helpUrl,
    };
  }

  /**
   * Convert error to API response format
   */
  toResponse(requestId?: string, path?: string): X21ErrorResponse {
    return {
      error: this.toX21Error(),
      requestId,
      path,
    };
  }
}

/**
 * Factory for creating standardized errors
 */
export class X21ErrorFactory {
  static create(
    category: X21ErrorCategory,
    code: string,
    message: string,
    userMessage: string,
    severity: X21ErrorSeverity = 'MEDIUM',
    details?: Record<string, unknown>,
    suggestions?: string[],
    helpUrl?: string
  ): BaseDaError {
    return new BaseDaError(
      category,
      code,
      message,
      userMessage,
      severity,
      details,
      suggestions,
      helpUrl
    );
  }
}
