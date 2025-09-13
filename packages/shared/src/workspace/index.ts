/**
 * Workspace types and utilities
 *
 * This module contains types and utilities for workspace functionality
 * that are shared between frontend and backend applications.
 */

// Core workspace types
export * from './workspace.types';
export * from './hmr.types';
export * from './container.types';
export * from './template.types';
export * from './session.types';
export * from './template-metadata.types';

// Container tool server types
export * from './server';

// Export specific types for activity-based cleanup
export type {
  ActivityLevel,
  ConnectionState,
  ActivityEvent,
  ActivityEventType,
  ConnectionQuality,
  ConnectionMetrics,
} from './hmr.types';
