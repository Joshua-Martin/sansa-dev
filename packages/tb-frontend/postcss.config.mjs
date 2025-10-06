/**
 * PostCSS Configuration for Tailwind CSS v4 in Monorepo
 *
 * The base path configuration helps Tailwind CSS v4 properly scan
 * files across the entire monorepo structure.
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {
      base: process.cwd() + '/../..',
    },
  },
};

export default config;
