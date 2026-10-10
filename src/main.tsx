import { LocalOcrReader } from './adapters/ocr/local';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { ErrorBoundary } from './ui/ErrorBoundary';
import './ui/tokens.css';
import './ui/global.css';
import { configureProviders } from './engine/product/providers';
import {
  ManualAiProvider,
  MockAiProvider,
  ManualFeedResolver,
} from './adapters/local/providers';
import {
  ManualReceiptParser,
  ManualDocumentReader,
} from './adapters/local/receipts';

configureProviders({
  manualAi: new ManualAiProvider(),
  sampleAi: new MockAiProvider(),
  receipts: new ManualReceiptParser(),
  ocrReceipts: new ManualReceiptParser(new LocalOcrReader()),
  feeds: new ManualFeedResolver(),
  documents: new ManualDocumentReader(),
});

const root = document.getElementById('root');
if (!root) throw new Error('Canvas root was not found.');
createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // The canvas remains usable online when this browser disables service workers.
      document.dispatchEvent(new Event('nexus:offline-unavailable'));
    });
  });
}
