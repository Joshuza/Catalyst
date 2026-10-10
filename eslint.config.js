import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

const layerNames = ['domain', 'data', 'adapters', 'engine', 'ui'];
const allowed = {
  domain: [],
  data: ['domain'],
  adapters: ['domain'],
  engine: ['domain'],
  ui: ['engine', 'data', 'domain'],
};

const layerRule = {
  meta: {
    type: 'problem',
    schema: [],
    messages: { forbidden: '{{source}} cannot import {{target}}.' },
  },
  create(context) {
    const source = layerNames.find((layer) =>
      context.filename.replaceAll('\\', '/').includes(`/src/${layer}/`),
    );
    if (!source) return {};
    const check = (node) => {
      if (typeof node.value !== 'string') return;
      const normalized = node.value.replaceAll('\\', '/');
      const target = layerNames.find((layer) =>
        normalized.split('/').includes(layer),
      );
      if (target && target !== source && !allowed[source].includes(target)) {
        context.report({
          node,
          messageId: 'forbidden',
          data: { source, target },
        });
      }
    };
    return {
      ImportDeclaration: (node) => check(node.source),
      ExportNamedDeclaration: (node) => node.source && check(node.source),
      ExportAllDeclaration: (node) => check(node.source),
      ImportExpression: (node) => check(node.source),
    };
  },
};

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: {
      architecture: { rules: { layers: layerRule } },
      'react-hooks': reactHooks,
    },
    rules: {
      'architecture/layers': 'error',
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'react',
            'react/*',
            'react-dom',
            'react-dom/*',
            'dexie',
            'dexie/*',
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'indexedDB',
        'localStorage',
        'navigator',
      ],
    },
  },
);
