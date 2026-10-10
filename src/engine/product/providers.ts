import type {
  AiProvider,
  ReceiptParser,
  FeedResolver,
  DocumentReader,
} from '../../domain/product/providers';
let configured: {
  manualAi: AiProvider;
  sampleAi: AiProvider;
  receipts: ReceiptParser;
  ocrReceipts: ReceiptParser;
  feeds: FeedResolver;
  documents: DocumentReader;
} | null = null;
export function configureProviders(value: NonNullable<typeof configured>) {
  configured = value;
}
export function providers() {
  if (!configured) throw new Error('Local providers are not initialized.');
  return configured;
}
