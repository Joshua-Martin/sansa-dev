/**
 * Session Activity Manager
 *
 * Manages workspace session activity and connection tracking for activity-based cleanup.
 * Handles connection state changes, activity level classification, and cleanup decisions.
 */

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceSessionEntity } from '../../../../shared/database/entities/session.entity';
import { ActivityBasedCleanupProcessor } from '../../processors/activity-based-cleanup.processor';
import type {
  ConnectionState,
  ActivityEvent,
  ActivityLevel,
  ConnectionQuality,
  ConnectionMetrics,
} from '@sansa-dev/shared';

/**
 * Activity timeouts in milliseconds
 */
const ACTIVITY_TIMEOUTS = {
  ACTIVE_TO_IDLE: 2 * 60 * 1000, // 2 minutes
  IDLE_TO_BACKGROUND: 10 * 60 * 1000, // 10 minutes
  BACKGROUND_TO_DISCONNECT: 30 * 60 * 1000, // 30 minutes (with grace period)
  GRACE_PERIOD: 30 * 1000, // 30 seconds grace period for reconnection
  PING_TIMEOUT: 60 * 1000, // 1 minute without ping
} as const;

/**
 * Connection quality thresholds
 */
const CONNECTION_QUALITY_THRESHOLDS = {
  UNSTABLE_LATENCY: 5000, // 5 seconds
  POOR_LATENCY: 10000, // 10 seconds
} as const;

/**
 * Session Activity Manager
 *
 * Tracks connection states and activity levels for all workspace sessions.
 * Makes real-time decisions about when to clean up inactive sessions.
 */
@Injectable()
export class SessionActivityManager {
  private readonly logger = new Logger(SessionActivityManager.name);

  // In-memory connection tracking
  private readonly sessionConnections = new Map<string, Set<ConnectionState>>();
  private readonly activityTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly gracePeriodTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    @InjectRepository(WorkspaceSessionEntity)
    private readonly workspaceRepository: Repository<WorkspaceSessionEntity>,
    @Inject(forwardRef(() => ActivityBasedCleanupProcessor))
    private readonly cleanupProcessor: ActivityBasedCleanupProcessor,
  ) {}

  /**
   * Register a new connection for a session
   */
  async registerConnection(
    sessionId: string,
    userId: string,
    websocketId: string,
  ): Promise<void> {
    this.logger.log(
      `Registering connection ${websocketId} for session ${sessionId}`,
    );

    const connection: ConnectionState = {
      sessionId,
      userId,
      websocketId,
      connectedAt: new Date().toISOString(),
      lastPingAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      activityLevel: 'active',
      connectionQuality: 'stable',
    };

    // Get or create connection set for session
    let connections = this.sessionConnections.get(sessionId);
    if (!connections) {
      connections = new Set<ConnectionState>();
      this.sessionConnections.set(sessionId, connections);
    }

    connections.add(connection);

    // Update database
    await this.updateSessionActivity(sessionId, {
      activityLevel: 'active',
      activeConnectionCount: connections.size,
      lastActivityAt: new Date().toISOString(),
    });

    // Clear any existing cleanup timers
    this.clearActivityTimeout(sessionId);
    this.clearGracePeriodTimeout(sessionId);
  }

  /**
   * Unregister a connection from a session
   */
  async unregisterConnection(
    sessionId: string,
    websocketId: string,
  ): Promise<void> {
    this.logger.log(
      `Unregistering connection ${websocketId} from session ${sessionId}`,
    );

    const connections = this.sessionConnections.get(sessionId);
    if (!connections) {
      return;
    }

    // Find and remove the connection
    const connection = Array.from(connections).find(
      (conn) => conn.websocketId === websocketId,
    );

    if (connection) {
      connections.delete(connection);

      const newConnectionCount = connections.size;

      if (newConnectionCount === 0) {
        // Last connection disconnected - start grace period
        this.logger.log(
          `Last connection disconnected from session ${sessionId}, starting grace period`,
        );
        await this.handleLastConnectionDisconnect(sessionId);
      } else {
        // Still have connections - update count
        await this.updateSessionActivity(sessionId, {
          activeConnectionCount: newConnectionCount,
        });
      }
    }

    // Clean up empty connection sets
    if (connections.size === 0) {
      this.sessionConnections.delete(sessionId);
    }
  }

  /**
   * Record activity event for a session
   */
  async recordActivity(
    sessionId: string,
    activity: ActivityEvent,
  ): Promise<void> {
    const connections = this.sessionConnections.get(sessionId);
    if (!connections || connections.size === 0) {
      this.logger.warn(
        `Received activity for session ${sessionId} with no active connections`,
      );
      return;
    }

    // Update all connections for this session
    const now = new Date();
    for (const connection of connections) {
      connection.lastActivityAt = now.toISOString();
      connection.activityLevel = this.classifyActivityLevel(activity.type);
    }

    // Update database
    await this.updateSessionActivity(sessionId, {
      activityLevel: this.classifyActivityLevel(activity.type),
      lastActivityAt: now.toISOString(),
    });

    // Reset activity timeout
    this.scheduleActivityTimeout(sessionId);
  }

  /**
   * Record ping event for a connection
   */
  async recordPing(sessionId: string, websocketId: string): Promise<void> {
    const connections = this.sessionConnections.get(sessionId);
    if (!connections) {
      return;
    }

    const connection = Array.from(connections).find(
      (conn) => conn.websocketId === websocketId,
    );

    if (connection) {
      const now = new Date();
      connection.lastPingAt = now.toISOString();
      connection.connectionQuality = this.assessConnectionQuality(
        connection,
        now,
      );

      // Update connection metrics
      await this.updateConnectionMetrics(sessionId, connection);
    }
  }

  /**
   * Get current activity level for a session
   */
  getSessionActivityLevel(sessionId: string): ActivityLevel {
    const connections = this.sessionConnections.get(sessionId);
    if (!connections || connections.size === 0) {
      return 'disconnected';
    }

    // Return the most active level among all connections
    const levels = Array.from(connections).map((conn) => conn.activityLevel);
    if (levels.includes('active')) return 'active';
    if (levels.includes('idle')) return 'idle';
    return 'background';
  }

  /**
   * Get connection count for a session
   */
  getSessionConnectionCount(sessionId: string): number {
    const connections = this.sessionConnections.get(sessionId);
    return connections?.size ?? 0;
  }

  /**
   * Check if session should be cleaned up
   */
  async shouldCleanupSession(sessionId: string): Promise<boolean> {
    const session = await this.workspaceRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      return true; // Session doesn't exist
    }

    const connectionCount = this.getSessionConnectionCount(sessionId);

    // Never cleanup if there are active connections
    if (connectionCount > 0) {
      return false;
    }

    // Check grace period
    if (
      session.gracePeriodEndsAt &&
      new Date(session.gracePeriodEndsAt) > new Date()
    ) {
      return false; // Still in grace period
    }

    // Check activity level timeouts
    if (session.activityLevel === 'background') {
      const timeSinceActivity =
        Date.now() - (new Date(session.lastActivityAt).getTime() ?? 0);
      return timeSinceActivity > ACTIVITY_TIMEOUTS.BACKGROUND_TO_DISCONNECT;
    }

    if (session.activityLevel === 'idle') {
      const timeSinceActivity =
        Date.now() - (new Date(session.lastActivityAt).getTime() ?? 0);
      return timeSinceActivity > ACTIVITY_TIMEOUTS.IDLE_TO_BACKGROUND;
    }

    // Session has no connections and is not in grace period
    return session.activityLevel === 'disconnected';
  }

  /**
   * Force cleanup of a session
   */
  async forceCleanup(sessionId: string): Promise<void> {
    this.logger.log(`Force cleanup requested for session ${sessionId}`);

    // Clear all timeouts
    this.clearActivityTimeout(sessionId);
    this.clearGracePeriodTimeout(sessionId);

    // Remove from memory
    this.sessionConnections.delete(sessionId);

    // Update database
    await this.updateSessionActivity(sessionId, {
      activityLevel: 'disconnected',
      activeConnectionCount: 0,
      gracePeriodEndsAt: null,
    });
  }

  /**
   * Handle last connection disconnect with grace period
   */
  private async handleLastConnectionDisconnect(
    sessionId: string,
  ): Promise<void> {
    const gracePeriodEndsAt = new Date(
      Date.now() + ACTIVITY_TIMEOUTS.GRACE_PERIOD,
    );

    // Update database with grace period
    await this.updateSessionActivity(sessionId, {
      activityLevel: 'disconnected',
      activeConnectionCount: 0,
      gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
    });

    // Schedule grace period timeout
    const timeout = setTimeout(() => {
      this.handleGracePeriodExpired(sessionId);
    }, ACTIVITY_TIMEOUTS.GRACE_PERIOD);

    this.gracePeriodTimeouts.set(sessionId, timeout);
  }

  /**
   * Handle grace period expiration
   */
  private async handleGracePeriodExpired(sessionId: string): Promise<void> {
    this.logger.log(`Grace period expired for session ${sessionId}`);

    this.gracePeriodTimeouts.delete(sessionId);

    // Evaluate cleanup
    const shouldCleanup = await this.shouldCleanupSession(sessionId);
    if (shouldCleanup) {
      await this.cleanupProcessor.processSessionCleanup(
        sessionId,
        'disconnected',
      );
    }
  }

  /**
   * Schedule activity timeout for a session
   */
  private scheduleActivityTimeout(sessionId: string): void {
    this.clearActivityTimeout(sessionId);

    const timeout = setTimeout(() => {
      this.handleActivityTimeout(sessionId);
    }, ACTIVITY_TIMEOUTS.ACTIVE_TO_IDLE);

    this.activityTimeouts.set(sessionId, timeout);
  }

  /**
   * Handle activity timeout
   */
  private async handleActivityTimeout(sessionId: string): Promise<void> {
    this.activityTimeouts.delete(sessionId);

    const currentLevel = this.getSessionActivityLevel(sessionId);

    if (currentLevel === 'active') {
      // Downgrade to idle
      await this.updateSessionActivity(sessionId, {
        activityLevel: 'idle',
      });

      // Schedule next timeout
      const timeout = setTimeout(() => {
        this.handleIdleTimeout(sessionId);
      }, ACTIVITY_TIMEOUTS.IDLE_TO_BACKGROUND - ACTIVITY_TIMEOUTS.ACTIVE_TO_IDLE);

      this.activityTimeouts.set(sessionId, timeout);
    }
  }

  /**
   * Handle idle timeout
   */
  private async handleIdleTimeout(sessionId: string): Promise<void> {
    this.activityTimeouts.delete(sessionId);

    const currentLevel = this.getSessionActivityLevel(sessionId);

    if (currentLevel === 'idle') {
      // Downgrade to background
      await this.updateSessionActivity(sessionId, {
        activityLevel: 'background',
      });

      // Schedule final timeout
      const timeout = setTimeout(() => {
        this.handleBackgroundTimeout(sessionId);
      }, ACTIVITY_TIMEOUTS.BACKGROUND_TO_DISCONNECT - ACTIVITY_TIMEOUTS.IDLE_TO_BACKGROUND);

      this.activityTimeouts.set(sessionId, timeout);
    }
  }

  /**
   * Handle background timeout
   */
  private async handleBackgroundTimeout(sessionId: string): Promise<void> {
    this.activityTimeouts.delete(sessionId);

    // Evaluate cleanup
    const shouldCleanup = await this.shouldCleanupSession(sessionId);
    if (shouldCleanup) {
      await this.cleanupProcessor.processSessionCleanup(
        sessionId,
        'background-timeout',
      );
    }
  }

  /**
   * Classify activity level based on event type
   */
  private classifyActivityLevel(eventType: string): ActivityLevel {
    switch (eventType) {
      case 'file-change':
      case 'build-request':
      case 'user-interaction':
      case 'file-activity':
        return 'active';
      case 'navigation':
      case 'focus-change':
        return 'idle';
      case 'ping':
      default:
        return 'background';
    }
  }

  /**
   * Assess connection quality based on ping timing
   */
  private assessConnectionQuality(
    connection: ConnectionState,
    now: Date,
  ): ConnectionQuality {
    const lastPing = new Date(connection.lastPingAt).getTime();
    const latency = now.getTime() - lastPing;

    if (latency > CONNECTION_QUALITY_THRESHOLDS.POOR_LATENCY) {
      return 'poor';
    }

    if (latency > CONNECTION_QUALITY_THRESHOLDS.UNSTABLE_LATENCY) {
      return 'unstable';
    }

    return 'stable';
  }

  /**
   * Update session activity in database
   */
  private async updateSessionActivity(
    sessionId: string,
    updates: Partial<{
      activityLevel: ActivityLevel;
      activeConnectionCount: number;
      lastActivityAt: string;
      gracePeriodEndsAt: string | null;
    }>,
  ): Promise<void> {
    try {
      await this.workspaceRepository.update(sessionId, updates);
    } catch (error) {
      this.logger.error(
        `Failed to update session activity for ${sessionId}:`,
        error,
      );
    }
  }

  /**
   * Update connection metrics
   */
  private async updateConnectionMetrics(
    sessionId: string,
    connection: ConnectionState,
  ): Promise<void> {
    try {
      const session = await this.workspaceRepository.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        return;
      }

      const metrics: ConnectionMetrics = session.connectionMetrics ?? {
        totalConnections: 0,
        averageSessionDuration: 0,
        connectionQualityHistory: [],
        activityLevelTransitions: [],
      };

      // Update metrics
      metrics.connectionQualityHistory.push(connection.connectionQuality);
      metrics.totalConnections = Math.max(
        metrics.totalConnections,
        this.getSessionConnectionCount(sessionId),
      );

      await this.workspaceRepository.update(sessionId, {
        connectionMetrics: metrics,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update connection metrics for ${sessionId}:`,
        error,
      );
    }
  }

  /**
   * Clear activity timeout
   */
  private clearActivityTimeout(sessionId: string): void {
    const timeout = this.activityTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.activityTimeouts.delete(sessionId);
    }
  }

  /**
   * Clear grace period timeout
   */
  private clearGracePeriodTimeout(sessionId: string): void {
    const timeout = this.gracePeriodTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.gracePeriodTimeouts.delete(sessionId);
    }
  }

  /**
   * Get all active session IDs
   */
  getActiveSessionIds(): string[] {
    return Array.from(this.sessionConnections.keys());
  }

  /**
   * Get detailed connection info for monitoring
   */
  getSessionConnectionInfo(sessionId: string): ConnectionState[] {
    const connections = this.sessionConnections.get(sessionId);
    return connections ? Array.from(connections) : [];
  }
}
