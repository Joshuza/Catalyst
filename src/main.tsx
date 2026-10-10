import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { ErrorBoundary } from './ui/ErrorBoundary';
import './ui/tokens.css';
import './ui/global.css';

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
