import { describe, it, expect } from 'vitest';
import { DisabledOcrReader, LocalOcrReader, MockOcrReader } from './local';
describe('RCP: validated optional OCR boundary', () => {
  it('rejects unconfigured OCR and unsupported images without loading a worker', async () => {
    await expect(new DisabledOcrReader().read()).rejects.toThrow('disabled');
    await expect(
      new LocalOcrReader().read(
        new File(['<svg/>'], 'receipt.svg', { type: 'image/svg+xml' }),
      ),
    ).rejects.toThrow('PNG or JPEG');
  });
  it('validates mock response limits so tests cannot hide malformed provider data', async () => {
    await expect(
      new MockOcrReader({ text: 'TOTAL $20', confidence: 0.8 }).read(),
    ).resolves.toEqual({ text: 'TOTAL $20', confidence: 0.8 });
    await expect(
      new MockOcrReader({ text: 'bad', confidence: 2 }).read(),
    ).rejects.toThrow();
  });
});
