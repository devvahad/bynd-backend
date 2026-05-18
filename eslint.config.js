import airbnbBase from 'eslint-config-airbnb-base';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    plugins: { import: importPlugin },
    rules: {
      ...airbnbBase.rules,
      'no-underscore-dangle': 'off',
      'no-console': 'warn',
      'import/extensions': ['error', 'ignorePackages', { js: 'always' }],
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
];