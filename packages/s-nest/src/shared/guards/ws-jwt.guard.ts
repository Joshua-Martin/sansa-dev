import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { JwtService } from '../../shared/auth/jwt.service';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * WebSocket JWT Authentication Guard
 *
 * Validates JWT tokens for WebSocket connections and extracts user information.
 * Handles authentication for real-time workspace communication.
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Validate WebSocket connection with JWT token
   */
  canActivate(context: ExecutionContext): boolean {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        this.logger.warn('WebSocket connection rejected: No token provided');
        throw new WsException('Authentication token required');
      }

      // Verify and decode the JWT token
      const payload = this.jwtService.verifyToken(token);

      if (!payload || !payload.sub) {
        this.logger.warn(
          'WebSocket connection rejected: Invalid token payload',
        );
        throw new WsException('Invalid authentication token');
      }

      // Attach user information to the socket for later use
      client.handshake.auth = {
        ...client.handshake.auth,
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      this.logger.debug(`WebSocket authenticated for user: ${payload.sub}`);
      return true;
    } catch (error) {
      this.logger.error('WebSocket authentication failed', error);

      if (error instanceof WsException) {
        throw error;
      }

      throw new WsException('Authentication failed');
    }
  }

  /**
   * Extract JWT token from WebSocket handshake
   */
  private extractTokenFromHandshake(client: Socket): string | null {
    // Try to get token from auth object
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }

    // Try to get token from query parameters
    if (client.handshake.query?.token) {
      return Array.isArray(client.handshake.query.token)
        ? client.handshake.query.token[0]
        : client.handshake.query.token;
    }

    // Try to get token from headers (Authorization: Bearer <token>)
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
