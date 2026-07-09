import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { fileURLToPath } from 'url';
import path from 'path';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'logs/**'],
  },
  js.configs.recommended,
  ...compat.extends('airbnb-base'),
  {
    files: ['**/*.js'],
    plugins: { import: importPlugin },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
        __dirname: 'off',
        require: 'off',
        module: 'off',
        exports: 'off',
      },
    },
    rules: {
      'no-underscore-dangle': 'off',
      'no-console': 'warn',
      'no-tabs': 'off',
      'import/extensions': ['error', 'ignorePackages', { js: 'always' }],
      indent: ['error', 'tab', { SwitchCase: 1, VariableDeclarator: 1 }],
    },
  },
];