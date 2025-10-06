import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  HttpStatusCode,
  isAxiosError,
  AxiosInstance,
} from 'axios';
import qs from 'qs';
import { JwtUtils } from './utils/jwt-utils';

/**
 * API Configuration
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export const API_URL = `${API_BASE_URL}`;

/**
 * Routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/api/v1/auth/signup',
  '/api/v1/auth/signin',
  '/api/v1/auth/refresh',
  '/api/v1/auth/verify-email',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/health',
];

/**
 * Routes where we should not trigger global error handling
 * Note: /auth/profile errors should still clear tokens but not show global errors
 */
const IGNORED_GLOBAL_ERROR_ROUTES = ['/api/v1/auth/profile'];

/**
 * Token storage keys - using cookie names that match middleware expectations
 */
const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

/**
 * Circuit breaker pattern to prevent overwhelming the server when it's down
 */
type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 30000; // 30 seconds
  private nextAttemptTime = 0;

  /**
   * Record a successful request
   */
  public recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  /**
   * Record a failed request
   * @returns whether the circuit should remain closed
   */
  public recordFailure(): boolean {
    this.failureCount++;

    if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.resetTimeout;
      console.warn(`Circuit breaker opened. Service appears unavailable.`);

      // Dispatch custom event for UI handling
      window.dispatchEvent(
        new CustomEvent('api:service-unavailable', {
          detail: { nextAttemptTime: this.nextAttemptTime },
        })
      );

      return false;
    }

    return this.state !== 'OPEN';
  }

  /**
   * Check if requests can be made
   */
  public canRequest(): boolean {
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN' && Date.now() >= this.nextAttemptTime) {
      this.state = 'HALF_OPEN';
      return true;
    }

    return this.state === 'HALF_OPEN';
  }

  /**
   * Get current state for debugging
   */
  public getState(): {
    state: CircuitBreakerState;
    failureCount: number;
    nextAttemptTime: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttemptTime: this.nextAttemptTime,
    };
  }
}

/**
 * Enhanced token management utilities with JWT validation and proactive refresh
 */
class TokenManager {
  private refreshPromise: Promise<string | null> | null = null;
  private isRefreshing = false;

  /**
   * Get access token from cookies
   */
  public getAccessToken(): string | null {
    try {
      if (typeof document === 'undefined') return null;
      return this.getCookie(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  }

  /**
   * Get refresh token from cookies
   */
  public getRefreshToken(): string | null {
    try {
      if (typeof document === 'undefined') return null;
      return this.getCookie(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  }

  /**
   * Store tokens in secure cookies with enhanced security
   */
  public setTokens(accessToken: string, refreshToken: string): void {
    try {
      if (typeof document === 'undefined') {
        console.warn('Cannot set cookies on server-side');
        return;
      }

      // Validate tokens before storing
      if (
        !JwtUtils.isTokenValid(accessToken, 0) ||
        !JwtUtils.isTokenValid(refreshToken, 0)
      ) {
        console.error('Attempted to store invalid tokens');
        return;
      }

      // Set access token with shorter expiry (15 minutes)
      this.setCookie(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, accessToken, {
        maxAge: 60 * 15,
      });

      // Set refresh token with longer expiry (7 days)
      this.setCookie(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, refreshToken, {
        maxAge: 60 * 60 * 24 * 7,
      });

      console.log('✅ Tokens stored securely');
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * Clear all tokens from cookies
   */
  public clearTokens(): void {
    try {
      if (typeof document === 'undefined') {
        console.warn('Cannot clear cookies on server-side');
        return;
      }

      this.deleteCookie(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
      this.deleteCookie(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);

      // Reset refresh state
      this.refreshPromise = null;
      this.isRefreshing = false;

      console.log('🗑️ Tokens cleared');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Check if user has valid, non-expired tokens
   * This is the primary method for authentication checking
   */
  public hasValidTokens(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    // Must have both tokens
    if (!accessToken || !refreshToken) {
      return false;
    }

    // Check if refresh token is expired (if so, user needs to re-authenticate)
    if (JwtUtils.isTokenExpired(refreshToken)) {
      console.warn('Refresh token expired, clearing tokens');
      this.clearTokens();
      return false;
    }

    return true;
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use hasValidTokens() instead
   */
  public hasTokens(): boolean {
    return this.hasValidTokens();
  }

  /**
   * Check if access token needs refresh
   * Returns true if token expires within 2 minutes
   */
  public needsTokenRefresh(): boolean {
    const accessToken = this.getAccessToken();
    if (!accessToken) return false;

    // Refresh if access token expires within 2 minutes
    return JwtUtils.isTokenExpired(accessToken, 120);
  }

  /**
   * Get a valid access token, refreshing if necessary
   * This is the main method for getting tokens for API calls
   */
  public async getValidAccessToken(): Promise<string | null> {
    // Check if we have valid tokens
    if (!this.hasValidTokens()) {
      return null;
    }

    const accessToken = this.getAccessToken()!;

    // If token is still valid for at least 30 seconds, return it
    if (!JwtUtils.isTokenExpired(accessToken, 30)) {
      return accessToken;
    }

    // Token needs refresh, attempt to refresh
    return this.refreshAccessToken();
  }

  /**
   * Refresh access token using refresh token
   * Handles concurrent refresh requests properly
   */
  private async refreshAccessToken(): Promise<string | null> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // If no refresh token, can't refresh
    const refreshToken = this.getRefreshToken();
    if (!refreshToken || JwtUtils.isTokenExpired(refreshToken)) {
      this.clearTokens();
      return null;
    }

    this.isRefreshing = true;

    this.refreshPromise = (async () => {
      try {
        console.log('🔄 Refreshing access token...');

        const response = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {
            refreshToken,
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Validate new tokens
        if (
          !JwtUtils.isTokenValid(accessToken, 0) ||
          !JwtUtils.isTokenValid(newRefreshToken, 0)
        ) {
          throw new Error('Invalid tokens received from refresh');
        }

        // Store new tokens
        this.setTokens(accessToken, newRefreshToken);

        // Dispatch success event
        window.dispatchEvent(new CustomEvent('auth:token-refreshed'));

        console.log('✅ Token refresh successful');
        return accessToken;
      } catch (error) {
        console.error('❌ Token refresh failed:', error);

        // Clear tokens on refresh failure
        this.clearTokens();

        // Dispatch failure event
        window.dispatchEvent(new CustomEvent('auth:refresh-failed'));

        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Get time until access token expires (in seconds)
   */
  public getTimeUntilExpiry(): number {
    const accessToken = this.getAccessToken();
    if (!accessToken) return 0;

    return JwtUtils.getTimeUntilExpiry(accessToken);
  }

  /**
   * Check if currently refreshing tokens
   */
  public isRefreshingTokens(): boolean {
    return this.isRefreshing;
  }

  /**
   * Get user information from access token
   */
  public getUserInfo(): { userId: string; email: string; role: string } | null {
    const accessToken = this.getAccessToken();
    if (!accessToken) return null;

    const userId = JwtUtils.getUserId(accessToken);
    const email = JwtUtils.getUserEmail(accessToken);
    const role = JwtUtils.getUserRole(accessToken);

    if (!userId || !email || !role) return null;

    return { userId, email, role };
  }

  /**
   * Enhanced cookie management with improved security
   */
  private setCookie(
    name: string,
    value: string,
    options: { maxAge?: number; path?: string } = {}
  ): void {
    const cookieOptions = {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Enhanced security from 'lax'
      httpOnly: false, // Must be false for client access
      ...options,
    };

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (cookieOptions.maxAge) {
      cookieString += `; Max-Age=${cookieOptions.maxAge}`;
    }

    if (cookieOptions.path) {
      cookieString += `; Path=${cookieOptions.path}`;
    }

    if (cookieOptions.secure) {
      cookieString += '; Secure';
    }

    if (cookieOptions.httpOnly) {
      cookieString += '; HttpOnly';
    }

    cookieString += `; SameSite=${cookieOptions.sameSite}`;

    document.cookie = cookieString;
  }

  /**
   * Get a cookie value by name
   */
  private getCookie(name: string): string | null {
    const nameEQ = `${encodeURIComponent(name)}=`;
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        const value = cookie.substring(nameEQ.length);
        return decodeURIComponent(value);
      }
    }

    return null;
  }

  /**
   * Delete a cookie by setting it to expire
   */
  private deleteCookie(name: string, path: string = '/'): void {
    this.setCookie(name, '', {
      maxAge: -1,
      path,
    });
  }
}

// Initialize instances
const circuitBreaker = new CircuitBreaker();
const tokenManager = new TokenManager();

/**
 * Create Axios instance with base configuration
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Check if a route requires authentication
 */
function requiresAuth(url: string): boolean {
  // Extract path from absolute URL if needed
  const path = url.startsWith('http') ? new URL(url).pathname : url;
  return !PUBLIC_ROUTES.some((route) => path.startsWith(route));
}

/**
 * Check if URL is relative
 */
function isUrlRelative(url: string): boolean {
  return !url.startsWith('http') && !url.startsWith('https');
}

/**
 * Global error handler for authentication and other errors
 */
function handleGlobalError(error: AxiosError, url: string): void {
  const isIgnoredRoute = IGNORED_GLOBAL_ERROR_ROUTES.some((route) =>
    url.includes(route)
  );

  // Handle authentication errors (always clear tokens, even for ignored routes)
  if (error.response?.status === 401) {
    tokenManager.clearTokens();

    // Only dispatch global auth error event for non-ignored routes
    if (!isIgnoredRoute) {
      window.dispatchEvent(
        new CustomEvent('auth:unauthorized', {
          detail: { error: error.response.data },
        })
      );
    }
  }

  // Skip other global error handling for ignored routes
  if (isIgnoredRoute) {
    return;
  }

  // Handle server errors
  if (error.response?.status && error.response.status >= 500) {
    window.dispatchEvent(
      new CustomEvent('api:server-error', {
        detail: {
          status: error.response.status,
          message: error.message,
          url,
        },
      })
    );
  }
}

/**
 * Enhanced request interceptor with proactive token refresh
 */
axiosInstance.interceptors.request.use(
  async (config) => {
    // Check circuit breaker before sending request
    if (!circuitBreaker.canRequest() && !config.url?.includes('/health')) {
      return Promise.reject(
        new Error('Service unavailable - circuit breaker is open')
      );
    }

    // Add authentication token if required
    const url = config.url || '';
    if (requiresAuth(url)) {
      try {
        // Get valid token (will refresh if needed)
        const token = await tokenManager.getValidAccessToken();

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          // No valid token available
          console.warn(
            `Authentication required for ${url} but no valid token available`
          );
          return Promise.reject(new Error('Authentication required'));
        }
      } catch (error) {
        // Token refresh failed
        console.error('Token refresh failed during request:', error);
        return Promise.reject(new Error('Authentication failed'));
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - focused on error handling
 * Token refresh is now handled proactively in the request interceptor
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    circuitBreaker.recordSuccess();
    return response;
  },
  (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle connection errors (service unavailable)
    if (!error.response) {
      circuitBreaker.recordFailure();
      return Promise.reject(error);
    }

    // Handle authentication errors
    if (error.response.status === 401) {
      // Clear tokens on 401 errors (token refresh is handled in request interceptor)
      if (
        !originalRequest?.url?.includes('/api/v1/auth/signin') &&
        !originalRequest?.url?.includes('/api/v1/auth/refresh')
      ) {
        console.warn('401 error received, clearing tokens');
        tokenManager.clearTokens();
      }
    }

    // Handle global error (but don't dispatch auth errors for profile requests)
    handleGlobalError(error, originalRequest?.url || '');

    return Promise.reject(error);
  }
);

/**
 * Generic request function
 */
function request<TResponse>(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<TResponse> {
  const resolvedUrl = isUrlRelative(url) ? `${API_URL}${url}` : url;

  return axiosInstance({
    url: resolvedUrl,
    ...config,
  }).then((response) => {
    // Return response.data for JSON responses, or response for blobs
    return config.responseType === 'blob' ? response.data : response.data;
  });
}

/**
 * HTTP Error type
 */
export type HttpError = AxiosError<unknown, AxiosResponse<unknown>>;

/**
 * API client with typed methods
 */
export const api = {
  /**
   * Type guard to check if error is an HTTP error
   */
  isError(error: unknown): error is HttpError {
    return isAxiosError(error);
  },

  /**
   * Check if error is a specific HTTP status
   */
  isStatus(error: unknown, status: number): boolean {
    return this.isError(error) && error.response?.status === status;
  },

  /**
   * Check if error is 404 Not Found
   */
  isNotFoundError(error: unknown): boolean {
    return this.isStatus(error, 404);
  },

  /**
   * Check if error is 401 Unauthorized
   */
  isUnauthorizedError(error: unknown): boolean {
    return this.isStatus(error, 401);
  },

  /**
   * Check if error is 409 Conflict
   */
  isConflictError(error: unknown): boolean {
    return this.isStatus(error, 409);
  },

  /**
   * GET request
   */
  get: <TResponse>(
    url: string,
    query?: unknown,
    config?: AxiosRequestConfig
  ): Promise<TResponse> =>
    request<TResponse>(url, {
      method: 'GET',
      params: query,
      paramsSerializer: (params) => {
        return qs.stringify(params, {
          arrayFormat: 'repeat',
          skipNulls: true,
        });
      },
      ...config,
    }),

  /**
   * POST request
   */
  post: <TResponse, TBody = unknown, TParams = unknown>(
    url: string,
    body?: TBody,
    params?: TParams,
    config?: AxiosRequestConfig
  ): Promise<TResponse> => {
    // Handle FormData content type automatically
    const headers =
      body instanceof FormData
        ? {} // Let axios set the boundary for multipart/form-data
        : { 'Content-Type': 'application/json' };

    return request<TResponse>(url, {
      method: 'POST',
      data: body,
      params,
      headers: {
        ...headers,
        ...config?.headers,
      },
      ...config,
    });
  },

  /**
   * PUT request
   */
  put: <TResponse, TBody = unknown, TParams = unknown>(
    url: string,
    body?: TBody,
    params?: TParams,
    config?: AxiosRequestConfig
  ): Promise<TResponse> =>
    request<TResponse>(url, {
      method: 'PUT',
      data: body,
      params,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      ...config,
    }),

  /**
   * PATCH request
   */
  patch: <TResponse, TBody = unknown, TParams = unknown>(
    url: string,
    body?: TBody,
    params?: TParams,
    config?: AxiosRequestConfig
  ): Promise<TResponse> =>
    request<TResponse>(url, {
      method: 'PATCH',
      data: body,
      params,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      ...config,
    }),

  /**
   * DELETE request
   */
  delete: <TResponse>(
    url: string,
    query?: Record<string, string>,
    body?: unknown,
    config?: AxiosRequestConfig
  ): Promise<TResponse> =>
    request<TResponse>(url, {
      method: 'DELETE',
      params: query,
      data: body,
      paramsSerializer: (params) => {
        return qs.stringify(params, {
          arrayFormat: 'repeat',
          skipNulls: true,
        });
      },
      ...config,
    }),

  /**
   * HTTP status codes
   */
  httpStatus: HttpStatusCode,

  /**
   * Token management utilities
   */
  tokens: tokenManager,

  /**
   * Circuit breaker utilities
   */
  circuitBreaker: {
    getState: () => circuitBreaker.getState(),
    canRequest: () => circuitBreaker.canRequest(),
  },
};

/**
 * Export token manager for external usage
 */
export { tokenManager };
