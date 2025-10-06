/**
 * WebSocket Error Types and Factories
 *
 * Standardized error handling for WebSocket events that aligns with
 * the application's error system while maintaining real-time compatibility.
 */

import {
  BaseDaError,
  X21ErrorCategory,
  X21ErrorSeverity,
} from '../app/error.types';
import { BaseWebSocketEvent } from './websocket.types';

/**
 * WebSocket-specific error codes
 */
export const WEBSOCKET_ERROR_CODES = {
  // Connection errors
  CONNECTION_FAILED: 'WS_CONNECTION_FAILED',
  UNAUTHORIZED: 'WS_UNAUTHORIZED',
  TOKEN_EXPIRED: 'WS_TOKEN_EXPIRED',
  TOKEN_INVALID: 'WS_TOKEN_INVALID',

  // Thread errors
  THREAD_NOT_FOUND: 'WS_THREAD_NOT_FOUND',
  THREAD_ACCESS_DENIED: 'WS_THREAD_ACCESS_DENIED',
  THREAD_INACTIVE: 'WS_THREAD_INACTIVE',
  JOIN_ERROR: 'WS_JOIN_ERROR',
  LEAVE_ERROR: 'WS_LEAVE_ERROR',

  // Message errors
  MESSAGE_SEND_FAILED: 'WS_MESSAGE_SEND_FAILED',
  MESSAGE_TOO_LONG: 'WS_MESSAGE_TOO_LONG',
  MESSAGE_EMPTY: 'WS_MESSAGE_EMPTY',
  CHAT_ERROR: 'WS_CHAT_ERROR',

  // Streaming errors
  STREAM_ERROR: 'WS_STREAM_ERROR',
  STREAM_TIMEOUT: 'WS_STREAM_TIMEOUT',
  LLM_UNAVAILABLE: 'WS_LLM_UNAVAILABLE',

  // Rate limiting
  RATE_LIMITED: 'WS_RATE_LIMITED',
  TOO_MANY_MESSAGES: 'WS_TOO_MANY_MESSAGES',

  // General errors
  VALIDATION_ERROR: 'WS_VALIDATION_ERROR',
  SERVER_ERROR: 'WS_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'WS_SERVICE_UNAVAILABLE',
} as const;

/**
 * Union type of all WebSocket error codes
 */
export type WebSocketErrorCode =
  (typeof WEBSOCKET_ERROR_CODES)[keyof typeof WEBSOCKET_ERROR_CODES];

/**
 * Enhanced WebSocket error event that includes standardized error information
 */
export type WebSocketErrorEvent = BaseWebSocketEvent & {
  /**
   * Standardized error code
   */
  code: WebSocketErrorCode;

  /**
   * Error category for classification
   */
  category: X21ErrorCategory;

  /**
   * Technical error message (for logging)
   */
  message: string;

  /**
   * User-friendly message that can be displayed in UI
   */
  userMessage: string;

  /**
   * Error severity level
   */
  severity: X21ErrorSeverity;

  /**
   * Optional additional details
   */
  details?: Record<string, unknown>;

  /**
   * Optional suggestions for resolving the error
   */
  suggestions?: string[];

  /**
   * Optional help URL for more information
   */
  helpUrl?: string;

  /**
   * ID of the event that caused this error (if applicable)
   */
  relatedEventId?: string;
};

/**
 * WebSocket error factory for creating standardized WebSocket errors
 */
export class WebSocketErrorFactory {
  /**
   * Create a WebSocket error event from a BaseDaError
   */
  static fromBaseDaError(
    error: BaseDaError,
    relatedEventId?: string
  ): WebSocketErrorEvent {
    return {
      timestamp: new Date(),
      code: error.code as WebSocketErrorCode,
      category: error.category,
      message: error.message,
      userMessage: error.userMessage,
      severity: error.severity,
      details: error.details,
      suggestions: error.suggestions,
      helpUrl: error.helpUrl,
      relatedEventId,
    };
  }

  /**
   * Create a generic WebSocket error event
   */
  private static createError(
    code: WebSocketErrorCode,
    category: X21ErrorCategory,
    message: string,
    userMessage: string,
    severity: X21ErrorSeverity = 'MEDIUM',
    details?: Record<string, unknown>,
    suggestions?: string[],
    helpUrl?: string,
    relatedEventId?: string
  ): WebSocketErrorEvent {
    return {
      timestamp: new Date(),
      code,
      category,
      message,
      userMessage,
      severity,
      details,
      suggestions,
      helpUrl,
      relatedEventId,
    };
  }

  // Connection Errors

  /**
   * Connection failed error
   */
  static connectionFailed(
    reason?: string,
    relatedEventId?: string
  ): WebSocketErrorEvent {
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      WEBSOCKET_ERROR_CODES.CONNECTION_FAILED,
      'NETWORK_ERROR',
      `WebSocket connection failed${hasReason ? `: ${reason}` : ''}`,
      'Failed to connect to the chat service. Please check your internet connection and try again.',
      'HIGH',
      hasReason ? { reason } : undefined,
      [
        'Check your internet connection',
        'Try refreshing the page',
        'Contact support if the problem persists',
      ],
      undefined,
      relatedEventId
    );
  }

  /**
   * Unauthorized access error
   */
  static unauthorized(relatedEventId?: string): WebSocketErrorEvent {
    return this.createError(
      WEBSOCKET_ERROR_CODES.UNAUTHORIZED,
      'AUTHENTICATION',
      'WebSocket authentication required',
      'You need to be signed in to use the chat feature.',
      'HIGH',
      undefined,
      [
        'Sign in to your account',
        'Refresh the page if you are already signed in',
      ],
      '/auth/signin',
      relatedEventId
    );
  }

  /**
   * Token expired error
   */
  static tokenExpired(relatedEventId?: string): WebSocketErrorEvent {
    return this.createError(
      WEBSOCKET_ERROR_CODES.TOKEN_EXPIRED,
      'AUTHENTICATION',
      'WebSocket authentication token expired',
      'Your session has expired. Please sign in again.',
      'MEDIUM',
      undefined,
      [
        'Sign in again to continue',
        'Check if you have been inactive for too long',
      ],
      '/auth/signin',
      relatedEventId
    );
  }

  // Thread Errors

  /**
   * Thread not found error
   */
  static threadNotFound(
    threadId?: string,
    relatedEventId?: string
  ): WebSocketErrorEvent {
    const hasThreadId =
      typeof threadId === 'string' && threadId.trim().length > 0;
    return this.createError(
      WEBSOCKET_ERROR_CODES.THREAD_NOT_FOUND,
      'NOT_FOUND',
      'Chat thread not found',
      'The conversation you are looking for could not be found.',
      'MEDIUM',
      hasThreadId ? { threadId } : undefined,
      [
        'Start a new conversation',
        'Check if the conversation was deleted',
        'Make sure you have access to this conversation',
      ],
      undefined,
      relatedEventId
    );
  }

  /**
   * Thread access denied error
   */
  static threadAccessDenied(
    threadId?: string,
    relatedEventId?: string
  ): WebSocketErrorEvent {
    const hasThreadId =
      typeof threadId === 'string' && threadId.trim().length > 0;
    return this.createError(
      WEBSOCKET_ERROR_CODES.THREAD_ACCESS_DENIED,
      'AUTHORIZATION',
      'Access denied to chat thread',
      'You do not have permission to access this conversation.',
      'HIGH',
      hasThreadId ? { threadId } : undefined,
      [
        'Make sure you are signed in to the correct account',
        'Contact the conversation owner for access',
      ],
      undefined,
      relatedEventId
    );
  }

  // Message Errors

  /**
   * Message send failed error
   */
  static messageSendFailed(
    reason?: string,
    relatedEventId?: string
  ): WebSocketErrorEvent {
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      WEBSOCKET_ERROR_CODES.MESSAGE_SEND_FAILED,
      'SERVER_ERROR',
      `Failed to send message${hasReason ? `: ${reason}` : ''}`,
      'Your message could not be sent. Please try again.',
      'MEDIUM',
      hasReason ? { reason } : undefined,
      [
        'Try sending the message again',
        'Check your internet connection',
        'Try refreshing the page if the problem persists',
      ],
      undefined,
      relatedEventId
    );
  }

  /**
   * Message too long error
   */
  static messageTooLong(
    maxLength: number,
    currentLength: number,
    relatedEventId?: string
  ): WebSocketErrorEvent {
    return this.createError(
      WEBSOCKET_ERROR_CODES.MESSAGE_TOO_LONG,
      'VALIDATION',
      `Message exceeds maximum length of ${maxLength} characters`,
      `Your message is too long. Please shorten it to ${maxLength} characters or less.`,
      'LOW',
      { maxLength, currentLength },
      [
        `Shorten your message to ${maxLength} characters or less`,
        'Break your message into multiple parts',
        'Remove unnecessary text or formatting',
      ],
      undefined,
      relatedEventId
    );
  }

  // Streaming Errors

  /**
   * Stream error
   */
  static streamError(
    reason?: string,
    relatedEventId?: string
  ): WebSocketErrorEvent {
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      WEBSOCKET_ERROR_CODES.STREAM_ERROR,
      'SERVER_ERROR',
      `Response streaming failed${hasReason ? `: ${reason}` : ''}`,
      'There was an error generating the response. Please try again.',
      'MEDIUM',
      hasReason ? { reason } : undefined,
      [
        'Try sending your message again',
        'Check your internet connection',
        'Contact support if the problem persists',
      ],
      undefined,
      relatedEventId
    );
  }

  /**
   * LLM service unavailable error
   */
  static llmUnavailable(relatedEventId?: string): WebSocketErrorEvent {
    return this.createError(
      WEBSOCKET_ERROR_CODES.LLM_UNAVAILABLE,
      'SERVICE_UNAVAILABLE',
      'LLM service is currently unavailable',
      'The AI assistant is temporarily unavailable. Please try again in a few moments.',
      'HIGH',
      undefined,
      [
        'Wait a few moments and try again',
        'Check our status page for service updates',
        'Contact support if the issue persists',
      ],
      '/status',
      relatedEventId
    );
  }

  // Rate Limiting Errors

  /**
   * Rate limited error
   */
  static rateLimited(
    retryAfter?: number,
    relatedEventId?: string
  ): WebSocketErrorEvent {
    const hasRetryAfter =
      typeof retryAfter === 'number' && !isNaN(retryAfter) && retryAfter > 0;
    const retryMessage = hasRetryAfter
      ? ` Please wait ${retryAfter} seconds before trying again.`
      : ' Please wait before trying again.';
    return this.createError(
      WEBSOCKET_ERROR_CODES.RATE_LIMITED,
      'RATE_LIMIT',
      'Rate limit exceeded',
      `You are sending messages too quickly.${retryMessage}`,
      'MEDIUM',
      hasRetryAfter ? { retryAfter } : undefined,
      [
        'Wait before sending another message',
        'Reduce the frequency of your messages',
        'Consider upgrading your plan for higher limits',
      ],
      undefined,
      relatedEventId
    );
  }

  // General Errors

  /**
   * Validation error
   */
  static validationError(
    field: string,
    reason: string,
    relatedEventId?: string
  ): WebSocketErrorEvent {
    return this.createError(
      WEBSOCKET_ERROR_CODES.VALIDATION_ERROR,
      'VALIDATION',
      `Validation failed for ${field}: ${reason}`,
      'Please check your input and try again.',
      'LOW',
      { field, reason },
      [
        'Check your input for any errors',
        'Make sure all required fields are filled',
        'Follow the input format requirements',
      ],
      undefined,
      relatedEventId
    );
  }

  /**
   * Generic server error
   */
  static serverError(
    reason?: string,
    relatedEventId?: string
  ): WebSocketErrorEvent {
    const hasReason = typeof reason === 'string' && reason.trim().length > 0;
    return this.createError(
      WEBSOCKET_ERROR_CODES.SERVER_ERROR,
      'SERVER_ERROR',
      `Server error${hasReason ? `: ${reason}` : ''}`,
      'An unexpected error occurred. Please try again.',
      'HIGH',
      hasReason ? { reason } : undefined,
      [
        'Try again in a few moments',
        'Refresh the page if the problem persists',
        'Contact support if you continue to experience issues',
      ],
      undefined,
      relatedEventId
    );
  }
}

/**
 * Utility to convert standard JavaScript errors to WebSocket error events
 */
export function errorToWebSocketError(
  error: unknown,
  relatedEventId?: string
): WebSocketErrorEvent {
  if (error instanceof BaseDaError) {
    return WebSocketErrorFactory.fromBaseDaError(error, relatedEventId);
  }

  if (error instanceof Error) {
    // Map common error messages to specific WebSocket errors
    const message = error.message.toLowerCase();

    if (message.includes('thread') && message.includes('not found')) {
      return WebSocketErrorFactory.threadNotFound(undefined, relatedEventId);
    }

    if (
      message.includes('unauthorized') ||
      message.includes('authentication')
    ) {
      return WebSocketErrorFactory.unauthorized(relatedEventId);
    }

    if (message.includes('token') && message.includes('expired')) {
      return WebSocketErrorFactory.tokenExpired(relatedEventId);
    }

    // Default to server error
    return WebSocketErrorFactory.serverError(error.message, relatedEventId);
  }

  // Unknown error type
  return WebSocketErrorFactory.serverError(
    'Unknown error occurred',
    relatedEventId
  );
}
