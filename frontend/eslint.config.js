import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // disables cross-feature imports:
            // eg. src/features/discussions should not import from src/features/comments, etc.
            {
              target: './src/features/auth',
              from: './src/features',
              except: ['./auth'],
            },
            {
              target: './src/features/auction',
              from: './src/features',
              except: ['./auction'],
            },
            {
              target: './src/features/order',
              from: './src/features',
              except: ['./order'],
            },
            {
              target: './src/features/notification',
              from: './src/features',
              except: ['./notification'],
            },
            {
              target: './src/features',
              from: './src/app',
            },

            // e.g src/features and src/app can import from these shared modules but not the other way around
            {
              target: [
                './src/components',
                './src/hooks',
                './src/lib',
                './src/types',
                './src/utils',
              ],
              from: ['./src/features', './src/app'],
            },
          ],
        },
      ],
    }
  },
])
