import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { ocrAssets } from './scripts/ocr-assets';

export default defineConfig({
  plugins: [
    react(),
    ocrAssets(),
    {
      name: 'nexus-precache',
      generateBundle(_options, bundle) {
        this.emitFile({
          type: 'asset',
          fileName: 'precache.json',
          source: JSON.stringify(
            Object.keys(bundle)
              .filter((name) => /\.(js|mjs|css|wasm|gz)$/.test(name))
              .map((name) => `/${name}`),
          ),
        });
      },
    },
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
