import { it, expect } from 'vitest';
import { workspace } from '../ui/local/runtime';
import { entities } from '../ui/product/state';
import { importReceipts, acceptReceipt } from '../ui/product/receipts-service';
import { configureProviders } from '../engine/product/providers';
import {
  MockReceiptParser,
  MockDocumentReader,
} from '../adapters/local/receipts';
import {
  ManualAiProvider,
  MockAiProvider,
  ManualFeedResolver,
} from '../adapters/local/providers';
import type { ReceiptResult } from '../domain/product/receipts';
function configure(result: ReceiptResult) {
  const parser = new MockReceiptParser(result);
  configureProviders({
    manualAi: new ManualAiProvider(),
    sampleAi: new MockAiProvider(),
    receipts: parser,
    ocrReceipts: parser,
    documents: new MockDocumentReader(''),
    feeds: new ManualFeedResolver(),
  });
}
it('RCP-03 / RCP-04 / RCP-05: silently reconciles only matching currency, preserves explicit zero tax, and remembers reviewed vendor corrections', async () => {
  await workspace.initialize();
  const date = '2026-10-10';
  const purchase = (currency: string) =>
    workspace.make('Studio Audio headphones', {
      type: 'purchase',
      currency,
      costCents: 20000,
      date,
      status: 'planned',
      scenario: 'Main',
      actualCents: null,
      regret: null,
      emotion: null,
      transactionId: null,
    });
  const euro = purchase('EUR'),
    usd = purchase('USD');
  await workspace.commit('Plan purchases', [
    euro,
    usd,
    workspace.make('Studio rule', {
      type: 'vendorRule',
      vendor: 'Studio Audio',
      taxRate: 0.08,
    }),
  ]);
  configure({
    vendor: 'Studio Audio',
    date,
    totalCents: 20000,
    taxCents: 0,
    items: [],
    confidence: 1,
  });
  await importReceipts(
    [new File(['Sample invoice'], 'sample.pdf', { type: 'application/pdf' })],
    date,
  );
  expect(entities('purchase').find((p) => p.id === euro.id)?.data.status).toBe(
    'planned',
  );
  expect(entities('purchase').find((p) => p.id === usd.id)?.data.status).toBe(
    'bought',
  );
  expect(entities('receipt')[0]?.data).toMatchObject({
    accepted: true,
    taxCents: 0,
    purchaseId: usd.id,
  });
  expect(workspace.visible('transaction')[0]).toMatchObject({
    currency: 'USD',
    amountCents: -20000,
    taxCents: 0,
  });
  configure({
    vendor: 'Review Shop',
    date,
    totalCents: 10000,
    taxCents: 0,
    items: [],
    confidence: 0.75,
  });
  await importReceipts(
    [new File(['Sample unclear'], 'unclear.pdf', { type: 'application/pdf' })],
    date,
  );
  const review = entities('receipt').find(
    (r) => r.data.vendor === 'Review Shop',
  )!;
  expect(review.data.accepted).toBe(false);
  const corrected = { ...review, data: { ...review.data, taxCents: 800 } };
  await acceptReceipt(corrected);
  expect(
    entities('vendorRule').find((r) => r.data.vendor === 'Review Shop')?.data
      .taxRate,
  ).toBe(0.08);
  await importReceipts(
    [
      new File(['Sample unclear again'], 'later.pdf', {
        type: 'application/pdf',
      }),
    ],
    date,
  );
  const later = entities('receipt').find(
    (r) => r.data.filename === 'later.pdf',
  )!;
  expect(later.data).toMatchObject({ taxCents: 800, accepted: false });
  expect(workspace.visible('transaction')).toHaveLength(2);
});
