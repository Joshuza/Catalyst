import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/ui/tokens.css', 'utf8');

function parseTokens(block: string): Record<string, string> {
  return Object.fromEntries(
    [...block.matchAll(/--(color-[\w-]+):\s*(#[\da-f]{6});/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );
}
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (
    (channels[0] ?? 0) * 0.2126 +
    (channels[1] ?? 0) * 0.7152 +
    (channels[2] ?? 0) * 0.0722
  );
}
const blocks = {
  light: [...css.matchAll(/:root \{([^}]+)\}/g)].map((m) => m[1]).join('\n'),
  dark: [...css.matchAll(/:root\[data-theme='dark'\] \{([^}]+)\}/g)]
    .map((m) => m[1])
    .join('\n'),
};
describe('UX-08 / UX-09 text token contrast', () => {
  for (const [theme, block] of Object.entries(blocks)) {
    const tokens = parseTokens(block);
    for (const foreground of [
      'color-text',
      'color-muted',
      'color-focus',
      'color-urgent',
      'color-warning',
    ]) {
      for (const background of [
        'color-background',
        'color-surface',
        'color-surface-soft',
      ]) {
        it(`${theme}: ${foreground} on ${background} reaches 4.5:1`, () => {
          const fg = tokens[foreground];
          const bg = tokens[background];
          expect(fg).toBeDefined();
          expect(bg).toBeDefined();
          if (!fg || !bg) throw new Error('Missing contrast token.');
          const a = luminance(fg);
          const b = luminance(bg);
          expect(
            (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
          ).toBeGreaterThanOrEqual(4.5);
        });
      }
    }
    it(`${theme}: selected control text on accent reaches 4.5:1`, () => {
      const fg = tokens['color-accent-text'];
      const bg = tokens['color-accent'];
      if (!fg || !bg) throw new Error('Missing accent token.');
      const a = luminance(fg);
      const b = luminance(bg);
      expect(
        (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      ).toBeGreaterThanOrEqual(4.5);
    });
  }
});
