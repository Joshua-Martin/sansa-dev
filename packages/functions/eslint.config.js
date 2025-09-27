import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';

// Instead of using extends, we include the configs directly
export default [
  // Ignore configuration
  {
    ignores: ['dist/**', 'lib/**', 'node_modules/**', 'coverage/**'],
  },
  // Include JavaScript recommended rules
  js.configs.recommended,

  // Include TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Custom configuration for our project
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        console: true, // Allow console
        module: true, // Allow module
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: prettier,
    },
    rules: {
      // Disable rules that are causing issues in your functions code
      '@typescript-eslint/strict-boolean-expressions': 'off',
      'no-undef': 'off',
      'no-console': 'off',
      'prettier/prettier': [
        'warn',
        {
          singleQuote: true,
        },
      ],
    },
  },
];
