import type { ReceiptResult } from '../../domain/product/receipts';
import {
  parseReceiptText,
  receiptResultSchema,
} from '../../domain/product/receipts';
export interface ReceiptParser {
  parse(file: File, date: string): Promise<ReceiptResult>;
}
export class ManualReceiptParser implements ReceiptParser {
  constructor(private ocr?: import('../ocr/types').OcrReader) {}
  async parse(file: File, date: string) {
    if (file.size > 20 * 1024 * 1024) throw new Error('Receipt exceeds 20 MB.');
    if (file.type === 'text/plain')
      return parseReceiptText(await file.text(), date);
    if (['image/png', 'image/jpeg'].includes(file.type) && this.ocr) {
      const result = await this.ocr.read(file);
      const parsed = parseReceiptText(result.text, date);
      return receiptResultSchema.parse({
        ...parsed,
        confidence: Math.min(parsed.confidence, result.confidence),
      });
    }
    if (file.type !== 'application/pdf')
      return {
        vendor: '',
        date,
        totalCents: 0,
        taxCents: 0,
        items: ['Screenshot: enter the values manually. OCR is not connected.'],
        confidence: 0,
      };
    return parseReceiptText(await new ManualDocumentReader().read(file), date);
  }
}
export class ManualDocumentReader {
  async read(file: File) {
    if (file.size > 20 * 1024 * 1024) throw new Error('File exceeds 20 MB.');
    if (file.type === 'text/plain' || /\.(txt|md)$/i.test(file.name)) {
      const text = await file.text();
      if (text.length > 100000)
        throw new Error('Document text exceeds 100,000 characters.');
      return text;
    }
    if (file.type !== 'application/pdf')
      throw new Error('Choose PDF, plain text, or Markdown.');
    const pdf = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdf.GlobalWorkerOptions.workerSrc = worker.default;
    const document = await pdf.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
      disableFontFace: true,
    }).promise;
    try {
      if (document.numPages > 100)
        throw new Error('Choose a PDF with at most 100 pages.');
      let text = '';
      for (let i = 1; i <= document.numPages; i++) {
        const page = await document.getPage(i),
          content = await page.getTextContent();
        for (const item of content.items) {
          if ('str' in item)
            text += item.str + ('hasEOL' in item && item.hasEOL ? '\n' : ' ');
        }
        if (text.length > 100000)
          throw new Error('PDF text exceeds the size limit.');
        text += '\n';
      }
      return text;
    } finally {
      await document.destroy();
    }
  }
}
export class MockDocumentReader {
  constructor(private text: string) {}
  async read() {
    if (this.text.length > 100000)
      throw new Error('Document text exceeds the size limit.');
    return this.text;
  }
}
export class MockReceiptParser implements ReceiptParser {
  constructor(private result: ReceiptResult) {}
  async parse() {
    return receiptResultSchema.parse(structuredClone(this.result));
  }
}
export function fileBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () =>
      reject(new Error('The receipt file could not be read.'));
    reader.readAsDataURL(file);
  });
}
