import type { NextConfig } from 'next';

/**
 * Next.js configuration for the S Frontend package.
 *
 * - Configures dev server to run on port 4200 for S Frontend
 * - Sets up API proxy to route requests to the S NestJS backend on port 3000
 * - Configures WebSocket support for chat agent functionality
 * - Configures path aliases for local imports and shared package access
 * - Enables experimental features for better development experience
 */
const nextConfig: NextConfig = {
  // Configure rewrites for API proxy to S Backend (port 3000)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
      // WebSocket proxy for Socket.IO to S Backend
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:3000/socket.io/:path*',
      },
    ];
  },

  // Configure headers for development
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },

  // Output configuration
  output: 'standalone',

  // Disable x-powered-by header
  poweredByHeader: false,

  devIndicators: false,
};

export default nextConfig;
