import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';
const require = createRequire(import.meta.url);
const sources = {
  'worker.min.js': require.resolve('tesseract.js/dist/worker.min.js'),
  'worker.LICENSE.txt': require.resolve(
    'tesseract.js/dist/worker.min.js.LICENSE.txt',
  ),
  'tesseract-core-lstm.wasm.js': require.resolve(
    'tesseract.js-core/tesseract-core-lstm.wasm.js',
  ),
  'tesseract-core-lstm.wasm': require.resolve(
    'tesseract.js-core/tesseract-core-lstm.wasm',
  ),
  'core.LICENSE.txt': require.resolve('tesseract.js-core/LICENSE'),
  'eng.traineddata.gz': require.resolve(
    '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz',
  ),
};
export function ocrAssets(): Plugin {
  const files = Object.entries(sources).map(([name, path]) => ({
    name: `assets/ocr/${name}`,
    source: readFileSync(path),
  }));
  return {
    name: 'local-ocr-assets',
    generateBundle() {
      for (const file of files)
        this.emitFile({
          type: 'asset',
          fileName: file.name,
          source: file.source,
        });
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const file = files.find(
          (f) => '/' + f.name === request.url?.split('?')[0],
        );
        if (!file) return next();
        response.setHeader(
          'Content-Type',
          file.name.endsWith('.js')
            ? 'application/javascript'
            : file.name.endsWith('.wasm')
              ? 'application/wasm'
              : 'application/octet-stream',
        );
        response.end(file.source);
      });
    },
  };
}
