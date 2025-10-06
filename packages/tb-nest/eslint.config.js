import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

/**
 * ESLint configuration for NestJS backend package
 * TypeScript-only configuration with essential rules
 */
export default [
  // Global ignores
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'coverage/'],
  },

  // TypeScript configuration
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        node: true,
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier,
    },
    rules: {
      // Core TypeScript rules
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // MOST IMPORTANT: Exhaustive switch statements
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Prettier formatting
      'prettier/prettier': 'warn',

      // General rules
      'no-console': 'warn',
    },
  },
];
