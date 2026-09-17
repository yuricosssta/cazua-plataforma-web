import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import tailwindcssPlugin from 'eslint-plugin-tailwindcss';

const legacyAxiosPaths = [
  'src/app/api/axiosInstance.ts',
  'src/lib/redux/slices/authSlice.ts',
  'src/lib/redux/slices/userSlice.ts',
  'src/lib/services/organizationService.ts',
  'src/lib/services/postService.ts',
  'src/lib/services/projectService.ts',
  'src/lib/services/resourceService.ts',
  'src/lib/services/storageService.ts',
  'src/lib/services/planningService.ts',
  'src/lib/services/summaryService.ts',
  'src/lib/services/transcriptionService.ts',
  'src/lib/services/userService.ts',
  'src/components/dashboard/DashboardMetrics.tsx',
  'src/components/dashboard/CreateProjectModal.tsx',
  'src/components/dashboard/settings/BrandingSettings.tsx',
  'src/components/dashboard/settings/StorageManagement.tsx',
  'src/components/dashboard/settings/DataManagement.tsx',
  'src/app/(auth)/reset-password/page.tsx',
  'src/app/(auth)/forgot-password/page.tsx',
];

const tailwindRecommended = tailwindcssPlugin.configs.recommended;

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  tailwindRecommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
      tailwindcss: {
        cssConfigPath: './src/app/globals.css',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/prop-types': 'off',

      'import/no-duplicates': 'warn',

      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-contradicting-classname': 'error',
      'tailwindcss/no-custom-classname': 'off',

      'no-restricted-imports': ['warn', {
        paths: [{
          name: '@/app/api/axiosInstance',
          message: 'Use BFF route handlers em src/app/api/* em vez de chamar axiosInstance diretamente. Exemplo: src/app/api/posts/route.ts.',
        }],
      }],

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  {
    files: legacyAxiosPaths,
    rules: {
      'no-restricted-imports': 'off',
    },
  },
);