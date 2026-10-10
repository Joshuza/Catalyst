import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

describe('Phase 0 one-way layer contract', () => {
  const eslint = new ESLint();
  it.each([
    ['domain', 'ui'],
    ['domain', 'data'],
    ['domain', 'engine'],
    ['data', 'ui'],
    ['data', 'engine'],
    ['data', 'adapters'],
    ['engine', 'data'],
    ['engine', 'adapters'],
    ['adapters', 'engine'],
    ['ui', 'adapters'],
  ])('rejects %s importing %s', async (source, target) => {
    const results = await eslint.lintText(`import '../${target}/types';`, {
      filePath: `src/${source}/boundary-proof.ts`,
    });
    expect(
      results[0]?.messages.some(
        (message) => message.ruleId === 'architecture/layers',
      ),
    ).toBe(true);
  });
  it.each([
    ['ui', 'engine'],
    ['ui', 'data'],
    ['ui', 'domain'],
    ['data', 'domain'],
    ['adapters', 'domain'],
    ['engine', 'domain'],
  ])('allows %s importing %s', async (source, target) => {
    const results = await eslint.lintText(`import '../${target}/types';`, {
      filePath: `src/${source}/boundary-proof.ts`,
    });
    expect(results[0]?.messages).toHaveLength(0);
  });
  it('rejects a dynamic cross-layer import and a re-export', async () => {
    for (const code of ["import('../ui/App');", "export * from '../ui/App';"]) {
      const results = await eslint.lintText(code, {
        filePath: 'src/domain/boundary-proof.ts',
      });
      expect(
        results[0]?.messages.some(
          (message) => message.ruleId === 'architecture/layers',
        ),
      ).toBe(true);
    }
  });
  it('keeps React and browser persistence out of domain code', async () => {
    for (const code of [
      "import 'react';",
      'window.location;',
      'indexedDB.open("test");',
    ]) {
      const results = await eslint.lintText(code, {
        filePath: 'src/domain/boundary-proof.ts',
      });
      expect(results[0]?.errorCount).toBeGreaterThan(0);
    }
  });
});
