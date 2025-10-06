/**
 * Proactive token refresh service
 *
 * Automatically refreshes access tokens before they expire to ensure
 * seamless user experience without authentication interruptions.
 */

import { tokenManager } from '../api';

/**
 * Token refresh service for proactive token management
 */
export class TokenRefreshService {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isActive = false;
  private lastRefreshAttempt = 0;
  private readonly MIN_REFRESH_INTERVAL = 30000; // 30 seconds

  /**
   * Start automatic token refresh monitoring
   */
  public startAutoRefresh(): void {
    if (this.isActive) {
      console.log('🔄 Token refresh service already active');
      return;
    }

    console.log('🚀 Starting token refresh service');
    this.isActive = true;
    this.scheduleNextRefresh();
  }

  /**
   * Stop automatic token refresh monitoring
   */
  public stopAutoRefresh(): void {
    if (!this.isActive) return;

    console.log('🛑 Stopping token refresh service');
    this.isActive = false;

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Force immediate token refresh
   */
  public async forceRefresh(): Promise<boolean> {
    if (!this.isActive) return false;

    // Prevent too frequent refresh attempts
    const now = Date.now();
    if (now - this.lastRefreshAttempt < this.MIN_REFRESH_INTERVAL) {
      console.warn('⏰ Refresh attempt too soon, skipping');
      return false;
    }

    this.lastRefreshAttempt = now;
    return this.performRefresh();
  }

  /**
   * Schedule next token refresh based on access token expiry
   */
  private scheduleNextRefresh(): void {
    if (!this.isActive) return;

    // Don't schedule refresh if we don't have valid tokens
    if (!tokenManager.hasValidTokens()) {
      console.warn('⚠️ No valid tokens available, not scheduling refresh');
      return;
    }

    const timeUntilExpiry = tokenManager.getTimeUntilExpiry();

    if (timeUntilExpiry <= 0) {
      // Token already expired, try to refresh immediately
      console.warn('⚠️ Access token already expired, attempting refresh');
      this.performRefresh();
      return;
    }

    // Schedule refresh 2 minutes before expiry, or immediately if < 2 minutes
    const refreshDelay = Math.max(0, (timeUntilExpiry - 120) * 1000);

    // Safeguard: Never schedule refresh for 0 seconds or less
    // This prevents infinite loops when token expiry calculation is incorrect
    const minDelay = 10000; // 10 seconds minimum
    const safeDelay = Math.max(minDelay, refreshDelay);

    // Additional safeguard: Don't schedule refresh for more than 24 hours in the future
    // This prevents issues with incorrect token expiry calculations
    const maxDelay = 24 * 60 * 60 * 1000; // 24 hours
    const clampedDelay = Math.min(safeDelay, maxDelay);

    console.log(
      `⏰ Next token refresh in ${Math.round(clampedDelay / 1000)} seconds`
    );

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(() => {
      if (this.isActive) {
        this.performRefresh();
      }
    }, clampedDelay);
  }

  /**
   * Perform token refresh and handle the result
   */
  private async performRefresh(): Promise<boolean> {
    if (!this.isActive) return false;

    try {
      console.log('🔄 Performing proactive token refresh...');

      const newToken = await tokenManager.getValidAccessToken();

      if (newToken) {
        console.log('✅ Proactive token refresh successful');

        // Notify other components
        window.dispatchEvent(
          new CustomEvent('auth:token-refreshed', {
            detail: { proactive: true },
          })
        );

        // Add a small delay to ensure the new token is properly set before scheduling next refresh
        // This prevents infinite loops when the new token has the same expiration time
        setTimeout(() => {
          if (this.isActive) {
            this.scheduleNextRefresh();
          }
        }, 1000); // 1 second delay

        return true;
      } else {
        console.error(
          '❌ Proactive token refresh failed - no valid token received'
        );

        // Notify of refresh failure
        window.dispatchEvent(
          new CustomEvent('auth:refresh-failed', {
            detail: { proactive: true },
          })
        );

        // Stop the service since refresh failed
        this.stopAutoRefresh();

        return false;
      }
    } catch (error) {
      console.error('❌ Proactive token refresh error:', error);

      // Notify of refresh failure
      window.dispatchEvent(
        new CustomEvent('auth:refresh-failed', {
          detail: {
            proactive: true,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      );

      // Stop the service on error
      this.stopAutoRefresh();

      return false;
    }
  }

  /**
   * Check if the service is currently active
   */
  public isActiveService(): boolean {
    return this.isActive;
  }

  /**
   * Get time until next scheduled refresh (in seconds)
   */
  public getTimeUntilNextRefresh(): number {
    if (!this.refreshTimer) return 0;

    // This is a simplified calculation - in practice you'd need to track the scheduled time
    const timeUntilExpiry = tokenManager.getTimeUntilExpiry();
    return Math.max(0, timeUntilExpiry - 120);
  }

  /**
   * Handle window focus events to check token status
   */
  public handleWindowFocus(): void {
    if (!this.isActive) return;

    // Check if token needs immediate refresh when window regains focus
    if (tokenManager.needsTokenRefresh()) {
      console.log('🔄 Window focused - token needs refresh');
      this.performRefresh();
    } else {
      // Re-schedule refresh in case timing changed
      this.scheduleNextRefresh();
    }
  }

  /**
   * Handle visibility change events
   */
  public handleVisibilityChange(): void {
    if (!this.isActive) return;

    if (!document.hidden) {
      // Page became visible, check token status
      this.handleWindowFocus();
    }
  }

  /**
   * Cleanup method for component unmount
   */
  public cleanup(): void {
    this.stopAutoRefresh();
  }
}

/**
 * Singleton instance of the token refresh service
 */
export const tokenRefreshService = new TokenRefreshService();

/**
 * React hook for using the token refresh service
 * Handles lifecycle management automatically
 */
export function useTokenRefresh() {
  React.useEffect(() => {
    // Start service on mount
    tokenRefreshService.startAutoRefresh();

    // Handle window focus
    const handleFocus = () => tokenRefreshService.handleWindowFocus();
    const handleVisibilityChange = () =>
      tokenRefreshService.handleVisibilityChange();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      tokenRefreshService.cleanup();
    };
  }, []);

  return {
    isActive: tokenRefreshService.isActiveService(),
    timeUntilNextRefresh: tokenRefreshService.getTimeUntilNextRefresh(),
    forceRefresh: tokenRefreshService.forceRefresh.bind(tokenRefreshService),
  };
}

// Import React for the hook (this is a workaround since we can't import at the top)
import React from 'react';
