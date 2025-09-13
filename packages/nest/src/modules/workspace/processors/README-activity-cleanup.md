# Activity-Based Container Cleanup System

## Overview

This system replaces the previous arbitrary time-based expiration with intelligent activity-based cleanup that ensures containers are only running when actively used by users.

## Key Components

### 1. SessionActivityManager

- **File**: `session-activity-manager.service.ts`
- **Purpose**: Tracks real-time connection states and activity levels for all workspace sessions
- **Key Features**:
  - Connection state management (active, idle, background, disconnected)
  - Activity level classification based on user interactions
  - Grace period handling for reconnection
  - Real-time cleanup decision making

### 2. ActivityBasedCleanupProcessor

- **File**: `activity-based-cleanup.processor.ts`
- **Purpose**: Processes cleanup jobs based on activity levels instead of arbitrary time limits
- **Key Features**:
  - Event-driven cleanup (no more cron jobs)
  - Intelligent cleanup rules based on actual usage
  - Health check integration
  - Orphaned session cleanup

### 3. Updated WorkspaceGateway

- **File**: `workspace.gateway.ts`
- **Purpose**: Handles WebSocket connections with activity tracking
- **Key Features**:
  - Activity event handling (user interactions, file changes, etc.)
  - Real-time connection monitoring
  - Integration with SessionActivityManager

### 4. Updated Database Schema

- **Entity**: `WorkspaceSessionEntity`
- **New Fields**:
  - `lastActivityAt`: Timestamp of last user activity
  - `activityLevel`: Current activity state
  - `activeConnectionCount`: Number of active connections
  - `gracePeriodEndsAt`: Timestamp when grace period expires
  - `connectionMetrics`: Analytics data

## Activity Levels

### Active

- **Duration**: Within last 2 minutes
- **Triggers**: File changes, build requests, user interactions
- **Cleanup**: Never while active connections exist

### Idle

- **Duration**: 2-10 minutes since last meaningful activity
- **Triggers**: Navigation, focus changes, ping events
- **Cleanup**: After 10 minutes of background activity

### Background

- **Duration**: 10+ minutes since last activity
- **Triggers**: Only ping events, no user interactions
- **Cleanup**: After 30 minutes with grace period

### Disconnected

- **Duration**: No active connections
- **Triggers**: WebSocket disconnect
- **Cleanup**: Immediate or after grace period expires

## Cleanup Rules

### Immediate Cleanup (0 seconds)

```typescript
// No active connections AND no grace period active
if (activeConnectionCount === 0 && !gracePeriodEndsAt) {
  cleanup();
}
```

### Grace Period Cleanup (30 seconds)

```typescript
// Last connection disconnected, start grace period
if (lastConnectionDisconnected && withinGracePeriod) {
  // Allow reconnection, cleanup after 30 seconds
}
```

### Activity Timeout Cleanup (10+ minutes)

```typescript
// Based on activity level and time since last activity
if (activityLevel === 'background' && timeSinceActivity > 30 minutes) {
  cleanup();
}
```

## Frontend Integration

### WebSocket Activity Events

```typescript
// Send user interaction events
workspaceWebSocket.sendUserInteraction({ action: 'click' });

// Send navigation events
workspaceWebSocket.sendNavigation({ path: '/editor' });

// Send file activity
workspaceWebSocket.sendFileActivity({ action: 'save', filename: 'app.js' });
```

### API Activity Updates

```typescript
// Update activity via REST API
await workspaceApi.updateActivity(sessionId);
```

## Usage Examples

### Frontend Activity Tracking

```typescript
// Track user interactions
document.addEventListener('click', () => {
  workspaceWebSocket.sendUserInteraction({ type: 'click' });
});

// Track page visibility
document.addEventListener('visibilitychange', () => {
  workspaceWebSocket.sendFocusChange({
    visible: !document.hidden,
  });
});

// Track navigation
window.addEventListener('popstate', () => {
  workspaceWebSocket.sendNavigation({
    path: window.location.pathname,
  });
});
```

### Monitoring Cleanup Statistics

```typescript
// Get cleanup statistics
const stats = await cleanupProcessor.getCleanupStatistics();
console.log(`Active sessions: ${stats.activeSessions}`);
console.log(`Orphaned sessions: ${stats.orphanedSessions}`);
```

## Migration

### Database Migration

Run the migration script to update the database schema:

```sql
-- Run migration
\i migrations/001-activity-based-cleanup.sql
```

### Code Migration

The system is designed to be backwards compatible during transition:

1. **Old expiration-based sessions** will be automatically converted to activity levels
2. **Existing WebSocket connections** will be tracked with new activity system
3. **Cleanup jobs** will use new activity-based logic

## Benefits

### Resource Efficiency

- **Zero waste**: Containers only run when users are actively using them
- **Immediate cleanup**: No waiting for arbitrary time limits
- **Scalability**: Event-driven system handles variable loads better

### User Experience

- **Grace periods**: Handle network hiccups without losing work
- **Activity awareness**: System understands different types of user engagement
- **Predictable behavior**: Cleanup based on actual usage patterns

### Monitoring & Analytics

- **Rich metrics**: Track connection quality, session duration, activity patterns
- **Real-time insights**: Monitor system health and resource utilization
- **Debugging**: Detailed logs for troubleshooting cleanup decisions

## Configuration

### Activity Timeouts (in milliseconds)

```typescript
const ACTIVITY_TIMEOUTS = {
  ACTIVE_TO_IDLE: 2 * 60 * 1000, // 2 minutes
  IDLE_TO_BACKGROUND: 10 * 60 * 1000, // 10 minutes
  BACKGROUND_TO_DISCONNECT: 30 * 60 * 1000, // 30 minutes
  GRACE_PERIOD: 30 * 1000, // 30 seconds
  PING_TIMEOUT: 60 * 1000, // 1 minute
};
```

### Connection Quality Thresholds

```typescript
const CONNECTION_QUALITY_THRESHOLDS = {
  UNSTABLE_LATENCY: 5000, // 5 seconds
  POOR_LATENCY: 10000, // 10 seconds
};
```

## Troubleshooting

### Common Issues

1. **Sessions not cleaning up**

   - Check WebSocket connection state
   - Verify activity events are being sent
   - Check database activity level values

2. **False positive cleanups**

   - Review grace period configuration
   - Check activity level classification logic
   - Monitor connection quality metrics

3. **Performance issues**
   - Monitor connection count per session
   - Check activity event frequency
   - Review cleanup processor queue depth

### Debug Logging

Enable debug logging to troubleshoot cleanup decisions:

```typescript
// Enable detailed activity logging
process.env.DEBUG_ACTIVITY = 'true';

// Monitor cleanup decisions
logger.debug(`Cleanup decision for ${sessionId}:`, {
  activityLevel,
  activeConnections,
  timeSinceActivity,
  shouldCleanup,
});
```

## Future Enhancements

### Planned Features

1. **Machine learning-based cleanup prediction**
2. **User behavior pattern analysis**
3. **Dynamic timeout adjustment based on usage patterns**
4. **Integration with resource usage monitoring**
5. **Advanced connection quality analysis**

### Monitoring Dashboard

- Real-time activity level distribution
- Connection quality metrics
- Cleanup effectiveness statistics
- Resource utilization trends
