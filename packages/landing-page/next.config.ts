import type { NextConfig } from 'next';

/**
 * Next.js configuration for the landing page.
 *
 * - Configures dev server to run on port 4200 with external host access for Docker.
 * - Optimized for static landing page deployment.
 */
const nextConfig: NextConfig = {
  // Output configuration
  output: 'standalone',

  // Disable x-powered-by header
  poweredByHeader: false,

  // Disable dev indicators for cleaner production experience
  devIndicators: false,
};

export default nextConfig;
