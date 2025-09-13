import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

export default [
  // Base configuration for all files
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      'workspace-templates/',
      '*.min.js',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.min.js',
      '**/*.bundle.js',
    ],
  },

  // Configuration files - basic JavaScript rules
  {
    files: [
      '*.config.js',
      '*.config.ts',
      '*.config.cjs',
      '*.config.mjs',
      'eslint.config.js',
      '**/postcss.config.js',
      '**/tailwind.config.js',
      '**/vite.config.js',
      '**/vite.config.ts',
      '**/vitest.config.js',
      '**/vitest.config.ts',
      '**/webpack.config.js',
      '**/rollup.config.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        browser: true,
        es2021: true,
        node: true,
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      'no-console': 'off',
      'prettier/prettier': 'warn',
    },
  },

  // Base TypeScript configuration
  {
    files: ['**/*.{ts,tsx}'],
    ignores: [
      '*.config.js',
      '*.config.ts',
      '*.config.cjs',
      '*.config.mjs',
      'eslint.config.js',
      '**/postcss.config.js',
      '**/tailwind.config.js',
      '**/vite.config.js',
      '**/vite.config.ts',
      '**/vitest.config.js',
      '**/vitest.config.ts',
      '**/webpack.config.js',
      '**/rollup.config.js',
    ],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        browser: true,
        es2021: true,
        node: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier,
    },
    rules: {
      // Core TypeScript rules
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',

      // General best practices
      'prettier/prettier': 'warn',
      'no-console': 'warn',
    },
  },
];
