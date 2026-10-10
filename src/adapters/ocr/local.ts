import { z } from 'zod';
import type { OcrReader } from './types';
const resultSchema = z
  .object({
    text: z.string().max(100000),
    confidence: z.number().min(0).max(1),
  })
  .strict();
export class LocalOcrReader implements OcrReader {
  async read(file: File) {
    if (
      file.size > 20 * 1024 * 1024 ||
      !['image/png', 'image/jpeg'].includes(file.type)
    )
      throw new Error('OCR needs PNG or JPEG under 20 MB.');
    const image = await createImageBitmap(file);
    try {
      if (image.width * image.height > 25000000)
        throw new Error('OCR image exceeds 25 million pixels.');
    } finally {
      image.close();
    }
    const { createWorker, OEM } = await import('tesseract.js');
    const worker = await createWorker('eng', OEM.LSTM_ONLY, {
      workerPath: '/assets/ocr/worker.min.js',
      corePath: '/assets/ocr/tesseract-core-lstm.wasm.js',
      langPath: '/assets/ocr',
      workerBlobURL: false,
      cacheMethod: 'none',
      gzip: true,
    });
    try {
      const result = await worker.recognize(file);
      return resultSchema.parse({
        text: result.data.text,
        confidence: result.data.confidence / 100,
      });
    } finally {
      await worker.terminate();
    }
  }
}
export class DisabledOcrReader implements OcrReader {
  async read(): Promise<{ text: string; confidence: number }> {
    throw new Error(
      'Local OCR is disabled. Enable it in Receipts or enter the values manually.',
    );
  }
}
export class MockOcrReader implements OcrReader {
  constructor(private result: { text: string; confidence: number }) {}
  async read() {
    return resultSchema.parse(this.result);
  }
}
