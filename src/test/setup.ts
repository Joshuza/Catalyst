import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { useCanvasStore } from '../ui/store';

Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
  configurable: true,
});

afterEach(() => {
  cleanup();
  useCanvasStore.getState().reset();
  localStorage.clear();
  vi.restoreAllMocks();
});
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
