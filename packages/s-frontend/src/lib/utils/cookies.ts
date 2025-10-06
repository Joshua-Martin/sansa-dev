/**
 * Cookie utilities for secure token management in Next.js
 *
 * This module provides secure cookie handling for authentication tokens,
 * following Next.js best practices for SSR compatibility.
 */

/**
 * Cookie configuration for authentication tokens
 */
export const COOKIE_CONFIG = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  // Cookie options for security
  OPTIONS: {
    httpOnly: false, // Must be false for client-side access in browser
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax' as const, // CSRF protection
    path: '/', // Available site-wide
    maxAge: 60 * 60 * 24 * 7, // 7 days for refresh token
  },
  ACCESS_TOKEN_MAX_AGE: 60 * 15, // 15 minutes for access token
} as const;

/**
 * Set a cookie with secure defaults
 *
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Additional cookie options
 */
export function setCookie(
  name: string,
  value: string,
  options: Partial<{
    maxAge: number;
    expires: Date;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path: string;
  }> = {}
): void {
  if (typeof document === 'undefined') {
    // Server-side: cannot set cookies directly
    console.warn(
      'Cannot set cookie on server-side. Use Next.js cookies() API instead.'
    );
    return;
  }

  const cookieOptions = {
    ...COOKIE_CONFIG.OPTIONS,
    ...options,
  };

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (cookieOptions.maxAge) {
    cookieString += `; Max-Age=${cookieOptions.maxAge}`;
  }

  if (cookieOptions.expires) {
    cookieString += `; Expires=${cookieOptions.expires.toUTCString()}`;
  }

  if (cookieOptions.path) {
    cookieString += `; Path=${cookieOptions.path}`;
  }

  if (cookieOptions.secure) {
    cookieString += '; Secure';
  }

  if (cookieOptions.sameSite) {
    cookieString += `; SameSite=${cookieOptions.sameSite}`;
  }

  if (cookieOptions.httpOnly) {
    cookieString += '; HttpOnly';
  }

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 *
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    // Server-side: cannot access document.cookie
    return null;
  }

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
 *
 * @param name - Cookie name
 * @param path - Cookie path (should match the path used when setting)
 */
export function deleteCookie(name: string, path: string = '/'): void {
  if (typeof document === 'undefined') {
    // Server-side: cannot delete cookies directly
    console.warn(
      'Cannot delete cookie on server-side. Use Next.js cookies() API instead.'
    );
    return;
  }

  setCookie(name, '', {
    maxAge: -1,
    path,
    expires: new Date(0),
  });
}

/**
 * Check if cookies are available (client-side)
 */
export function areCookiesAvailable(): boolean {
  return typeof document !== 'undefined' && typeof document.cookie === 'string';
}

/**
 * Set authentication tokens in cookies
 *
 * @param accessToken - JWT access token
 * @param refreshToken - JWT refresh token
 */
export function setAuthTokens(accessToken: string, refreshToken: string): void {
  setCookie(COOKIE_CONFIG.ACCESS_TOKEN, accessToken, {
    maxAge: COOKIE_CONFIG.ACCESS_TOKEN_MAX_AGE,
  });

  setCookie(COOKIE_CONFIG.REFRESH_TOKEN, refreshToken, {
    maxAge: COOKIE_CONFIG.OPTIONS.maxAge,
  });
}

/**
 * Get access token from cookies
 *
 * @returns Access token or null
 */
export function getAccessToken(): string | null {
  return getCookie(COOKIE_CONFIG.ACCESS_TOKEN);
}

/**
 * Get refresh token from cookies
 *
 * @returns Refresh token or null
 */
export function getRefreshToken(): string | null {
  return getCookie(COOKIE_CONFIG.REFRESH_TOKEN);
}

/**
 * Clear all authentication tokens
 */
export function clearAuthTokens(): void {
  deleteCookie(COOKIE_CONFIG.ACCESS_TOKEN);
  deleteCookie(COOKIE_CONFIG.REFRESH_TOKEN);
}

/**
 * Check if user has authentication tokens
 *
 * @returns True if both access and refresh tokens exist
 */
export function hasAuthTokens(): boolean {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  return !!(accessToken && refreshToken);
}
