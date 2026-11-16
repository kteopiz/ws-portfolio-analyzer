import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['dist/**', 'coverage/**', 'src/data/**']),
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
    rules: {
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'all', argsIgnorePattern: '^_', caughtErrors: 'all' },
      ],
    },
  },
  prettier,
]);
