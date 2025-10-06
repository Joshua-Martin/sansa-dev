import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, UserRole } from '@sansa-dev/s-shared';
import { AuthenticatedRequest, IS_PUBLIC_KEY } from './jwt-auth.guard';

/**
 * Role permissions mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['read', 'write', 'delete', 'admin'],
  moderator: ['read', 'write', 'delete'],
  user: ['read', 'write'],
};

/**
 * Role hierarchy (higher number = more permissions)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
};

/**
 * Metadata keys for role-based access control
 */
export const REQUIRED_ROLES_KEY = 'requiredRoles';
export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';
export const MIN_ROLE_LEVEL_KEY = 'minRoleLevel';

/**
 * Decorator to specify required roles for an endpoint
 *
 * @param roles - Array of roles required to access the endpoint
 * @returns Method decorator
 */
export const RequireRoles = (...roles: UserRole[]) => {
  return SetMetadata(REQUIRED_ROLES_KEY, roles);
};

/**
 * Decorator to specify required permissions for an endpoint
 *
 * @param permissions - Array of permissions required to access the endpoint
 * @returns Method decorator
 */
export const RequirePermissions = (...permissions: Permission[]) => {
  return SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
};

/**
 * Decorator to specify minimum role level for an endpoint
 *
 * @param role - Minimum role required to access the endpoint
 * @returns Method decorator
 */
export const RequireMinRoleLevel = (role: UserRole) => {
  return SetMetadata(MIN_ROLE_LEVEL_KEY, role);
};

/**
 * RBAC (Role-Based Access Control) Guard
 *
 * Enforces role and permission-based access control on protected endpoints.
 * Checks user roles, permissions, and hierarchy levels.
 *
 * **Important**: This guard respects the @Public() decorator and will skip
 * RBAC checks for public routes (like sign-up, sign-in, etc.)
 */
@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(private reflector: Reflector) {}

  /**
   * Determine if the request can proceed based on user roles and permissions
   *
   * @param context - Execution context
   * @returns True if user has required permissions or route is public
   */
  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public - skip RBAC for public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug('Route is public, skipping RBAC checks');
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // If no user is attached to request for a protected route, authentication failed
    if (!request.user) {
      this.logger.warn('No user found in request for protected route');
      throw new ForbiddenException('Authentication required');
    }

    const user = request.user;

    // Check if user account is active
    if (!user.isActive) {
      this.logger.warn(
        `Inactive user ${user.userId} attempted to access protected route`,
      );
      throw new ForbiddenException('Account is deactivated');
    }

    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Get minimum role level from decorator
    const minRoleLevel = this.reflector.getAllAndOverride<UserRole>(
      MIN_ROLE_LEVEL_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no RBAC requirements specified, allow access for authenticated users
    if (!requiredRoles && !requiredPermissions && !minRoleLevel) {
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(
          `Access granted for authenticated user ${user.userId} (no RBAC requirements)`,
        );
      }
      return true;
    }

    let hasAccess = false;
    let reason = '';

    // Check required roles
    if (requiredRoles) {
      hasAccess = requiredRoles.includes(user.role);
      if (!hasAccess) {
        reason = `Required roles: ${requiredRoles.join(', ')}. User role: ${user.role}`;
      }
    }

    // Check required permissions
    if (requiredPermissions && !hasAccess) {
      const userPermissions = ROLE_PERMISSIONS[user.role];
      hasAccess = requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );
      if (!hasAccess) {
        reason = `Required permissions: ${requiredPermissions.join(', ')}. User permissions: ${userPermissions.join(', ')}`;
      }
    }

    // Check minimum role level
    if (minRoleLevel && !hasAccess) {
      hasAccess = ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRoleLevel];
      if (!hasAccess) {
        reason = `Minimum role level: ${minRoleLevel}. User role: ${user.role}`;
      }
    }

    if (!hasAccess) {
      this.logger.warn(`Access denied for user ${user.userId}: ${reason}`);
      throw new ForbiddenException('Insufficient permissions');
    }

    this.logger.debug(
      `Access granted for user ${user.userId} with role ${user.role}`,
    );
    return true;
  }

  /**
   * Check if a role has a specific permission
   *
   * @param role - User role
   * @param permission - Required permission
   * @returns True if role has permission
   */
  static hasPermission(role: UserRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
  }

  /**
   * Check if a role has higher or equal hierarchy level than another role
   *
   * @param currentRole - Current user role
   * @param requiredRole - Required role level
   * @returns True if current role meets requirement
   */
  static hasRoleHierarchy(
    currentRole: UserRole,
    requiredRole: UserRole,
  ): boolean {
    return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[requiredRole];
  }

  /**
   * Check if a user can access a resource owned by another user
   *
   * @param currentUserRole - Current user's role
   * @param currentUserId - Current user's ID
   * @param resourceOwnerId - Resource owner's ID
   * @param requiredPermission - Required permission for the action
   * @returns True if user can access the resource
   */
  static canAccessResource(
    currentUserRole: UserRole,
    currentUserId: string,
    resourceOwnerId: string,
    requiredPermission: Permission,
  ): boolean {
    // Own resource access
    if (currentUserId === resourceOwnerId) {
      return this.hasPermission(currentUserRole, requiredPermission);
    }

    // Admin can access any resource
    if (currentUserRole === 'admin') {
      return true;
    }

    // Moderators can access user resources for read/write
    if (
      currentUserRole === 'moderator' &&
      (requiredPermission === 'read' || requiredPermission === 'write')
    ) {
      return true;
    }

    return false;
  }
}
