import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { JwtUtils } from './lib/utils/jwt-utils';

/**
 * Next.js Middleware for Authentication and Route Protection
 *
 * This middleware handles:
 * - Server-side authentication checks and redirects
 * - Route protection for authenticated routes
 * - Prevention of authenticated users accessing auth pages
 * - Proper handling of dynamic routes and return URLs
 */

// Route configuration
const ROUTES = {
  AUTH: ['/signin', '/signup', '/forgot-password', '/reset-password'],
  PROTECTED: ['/dashboard', '/profile', '/builder'],
  PUBLIC: ['/'],
} as const;

// Cookie names (should match client-side cookie names)
const COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

/**
 * Check if user has valid authentication tokens with JWT validation
 * Requires BOTH access and refresh tokens to be present and valid
 */
function isAuthenticated(request: NextRequest): boolean {
  const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

  // Must have both tokens
  if (!accessToken || !refreshToken) {
    return false;
  }

  // Basic JWT format validation (server will do full validation)
  const accessParts = accessToken.split('.');
  const refreshParts = refreshToken.split('.');

  if (accessParts.length !== 3 || refreshParts.length !== 3) {
    return false;
  }

  // Validate refresh token expiry (basic check)
  try {
    const refreshPayload = JSON.parse(atob(refreshParts[1]));
    const now = Math.floor(Date.now() / 1000);

    if (refreshPayload.exp <= now) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Check if the current path matches any of the given route patterns
 * Handles exact matches and dynamic route prefixes
 */
function matchesRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some((route) => {
    if (route === pathname) return true;
    // Handle dynamic routes like /verify-email/[token]
    if (route.includes('[') && pathname.startsWith(route.split('[')[0]))
      return true;
    return false;
  });
}

/**
 * Create a redirect response with proper headers
 */
function createRedirect(url: string | URL, request: NextRequest): NextResponse {
  const response = NextResponse.redirect(url);
  // Ensure proper cache control for redirects
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = isAuthenticated(request);

  // Handle root path - redirect based on auth status
  if (pathname === '/') {
    const redirectUrl = authenticated ? '/dashboard' : '/signin';
    return createRedirect(new URL(redirectUrl, request.url), request);
  }

  // Handle authentication routes (signin, signup, etc.)
  if (
    matchesRoute(pathname, ROUTES.AUTH) ||
    pathname.startsWith('/verify-email/')
  ) {
    // Redirect authenticated users away from auth pages
    if (authenticated) {
      return createRedirect(new URL('/dashboard', request.url), request);
    }
    // Allow unauthenticated users to access auth pages
    return NextResponse.next();
  }

  // Handle protected routes
  if (matchesRoute(pathname, ROUTES.PROTECTED)) {
    if (!authenticated) {
      // Redirect to signin with return URL for post-authentication redirect
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('from', pathname);
      return createRedirect(signInUrl, request);
    }
    // Allow authenticated users to access protected routes
    return NextResponse.next();
  }

  // Allow access to all other routes (public routes, API routes, etc.)
  return NextResponse.next();
}

/**
 * Configure which routes this middleware should run on
 * Optimized matcher for better performance and security
 */
export const config = {
  matcher: [
    /*
     * Match all application routes that need authentication checks:
     * - Root path (/)
     * - Auth routes (/signin, /signup, etc.)
     * - Protected routes (/dashboard, /profile, /builder)
     * - Dynamic routes (/verify-email/*)
     *
     * Exclude:
     * - API routes (/api/*)
     * - Next.js internals (/_next/*)
     * - Static files (favicon.ico, images, etc.)
     */
    '/',
    '/signin',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email/:path*',
    '/dashboard',
    '/profile',
    '/builder',
  ],
};
