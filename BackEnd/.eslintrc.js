module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'import'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/naming-convention': [
      'error',
      {
        "selector": 'interface',
        "format": ['PascalCase'],
        "custom": {
          "regex": '^I[A-Z]',
          "match": true
        }
      }
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',

    'import/no-restricted-paths': ['warn', {
      zones: [
        {
          target: 'src/**/services/',
          from: 'src/**/schemas/',
          message: 'Services não devem importar Schemas do Mongoose. Use repositories.',
        },
      ],
    }],
  },
  overrides: [
    {
      files: ['src/**/services/**/*.ts'],
      rules: {
        'no-restricted-imports': ['warn', {
          paths: [
            { name: 'mongoose', message: 'Services não devem importar Mongoose diretamente. Use repositories.' },
            { name: '@nestjs/mongoose', message: 'Services não devem importar Mongoose diretamente. Use repositories.' },
          ],
        }],
      },
    },
  ],
};
