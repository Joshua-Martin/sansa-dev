import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { Principal } from '@sansa-dev/s-shared';
import { Socket } from 'socket.io';

/**
 * WebSocket client authentication data interface
 */
interface WebSocketAuthData {
  userId: string;
  email?: string;
  role?: string;
}

/**
 * Extended Socket interface with authentication data
 */
interface AuthenticatedSocket extends Socket {
  handshake: Socket['handshake'] & {
    auth: WebSocketAuthData;
  };
}

/**
 * Secure decorator that extracts only the userId from authenticated requests
 *
 * This decorator provides type-safe access to the userId with runtime validation.
 * Automatically detects HTTP vs WebSocket context and extracts user ID accordingly.
 * Use this for most controller/gateway methods that only need the user identifier.
 *
 * Usage:
 * ```typescript
 * // HTTP Controllers
 * async createWorkspace(@CurrentUserId() userId: string) {
 *   // userId is guaranteed to be a valid string
 * }
 *
 * // WebSocket Gateways
 * @SubscribeMessage('subscribe')
 * async handleSubscribe(@CurrentUserId() userId: string) {
 *   // userId is guaranteed to be a valid string
 * }
 * ```
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    try {
      // Detect execution context type
      const contextType = ctx.getType();

      if (contextType === 'http') {
        // Handle HTTP context
        return extractUserIdFromHttpRequest(ctx);
      } else if (contextType === 'ws') {
        // Handle WebSocket context
        return extractUserIdFromWebSocketClient(ctx);
      } else {
        throw new UnauthorizedException('Unsupported execution context');
      }
    } catch (error) {
      // Re-throw NestJS exceptions as-is, wrap others in UnauthorizedException
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication context error');
    }
  },
);

/**
 * Extract user ID from HTTP request context
 */
function extractUserIdFromHttpRequest(ctx: ExecutionContext): string {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

  if (!request.user) {
    throw new UnauthorizedException('User not authenticated');
  }

  // Runtime type validation
  if (
    typeof request.user.userId !== 'string' ||
    request.user.userId.trim() === ''
  ) {
    throw new UnauthorizedException('Invalid user authentication');
  }

  return request.user.userId;
}

/**
 * Extract user ID from WebSocket client context
 */
function extractUserIdFromWebSocketClient(ctx: ExecutionContext): string {
  const client = ctx.switchToWs().getClient<AuthenticatedSocket>();

  if (!client.handshake?.auth) {
    throw new UnauthorizedException('WebSocket client not authenticated');
  }

  const auth = client.handshake.auth;

  // Runtime type validation
  if (typeof auth.userId !== 'string' || auth.userId.trim() === '') {
    throw new UnauthorizedException('Invalid WebSocket authentication');
  }

  return auth.userId;
}

/**
 * Decorator for accessing full user context (admin operations only)
 *
 * This decorator should only be used in admin-protected routes where the full
 * Principal object is required. Always combine with RBAC guards.
 * Automatically detects HTTP vs WebSocket context and extracts user context accordingly.
 *
 * Usage:
 * ```typescript
 * // HTTP Controllers
 * @UseGuards(RbacGuard)
 * @RequireRoles('admin')
 * async adminOperation(@CurrentUser() principal: Principal) {
 *   // Full access to user context for admin operations
 * }
 *
 * // WebSocket Gateways (admin operations)
 * @SubscribeMessage('admin-command')
 * async handleAdminCommand(@CurrentUser() principal: Principal) {
 *   // Full access to user context for admin WebSocket operations
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Principal => {
    try {
      // Detect execution context type
      const contextType = ctx.getType();

      if (contextType === 'http') {
        // Handle HTTP context
        return extractUserFromHttpRequest(ctx);
      } else if (contextType === 'ws') {
        // Handle WebSocket context
        return extractUserFromWebSocketClient(ctx);
      } else {
        throw new UnauthorizedException('Unsupported execution context');
      }
    } catch (error) {
      // Re-throw NestJS exceptions as-is, wrap others in UnauthorizedException
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication context error');
    }
  },
);

/**
 * Extract full user context from HTTP request
 */
function extractUserFromHttpRequest(ctx: ExecutionContext): Principal {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

  if (!request.user) {
    throw new UnauthorizedException('User not authenticated');
  }

  return request.user;
}

/**
 * Extract full user context from WebSocket client
 */
function extractUserFromWebSocketClient(ctx: ExecutionContext): Principal {
  const client = ctx.switchToWs().getClient<AuthenticatedSocket>();

  if (!client.handshake?.auth) {
    throw new UnauthorizedException('WebSocket client not authenticated');
  }

  const auth = client.handshake.auth;

  // Runtime type validation
  if (typeof auth.userId !== 'string' || auth.userId.trim() === '') {
    throw new UnauthorizedException('Invalid WebSocket authentication');
  }

  // Construct Principal object from WebSocket auth data
  // Note: WebSocket auth may not have all Principal fields, so we create a minimal Principal
  return {
    userId: auth.userId,
    email: auth.email || '',
    role: auth.role || 'user',
  } as Principal;
}
