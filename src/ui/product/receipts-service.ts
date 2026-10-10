import { providers } from '../../engine/product/providers';
function fileBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('File could not be read.'));
    reader.readAsDataURL(file);
  });
}
import { AUTO_RECEIPT_CONFIDENCE } from '../../domain/product/receipts';
import { workspace } from '../local/runtime';
import { entities, type Entity } from './state';
import type { UserRecord } from '../../domain/records';
export async function importReceipts(
  files: File[],
  today: string,
  ocr = false,
) {
  const parser = ocr ? providers().ocrReceipts : providers().receipts;
  for (const file of files) {
    const parsed = await parser.parse(file, today);
    const purchase = entities('purchase').find(
      (p) =>
        p.data.status === 'planned' &&
        (!p.data.currency || p.data.currency === workspace.profile.currency) &&
        p.title.toLowerCase().includes(parsed.vendor.toLowerCase()) &&
        parsed.vendor &&
        Math.abs(p.data.costCents - parsed.totalCents) <= 100,
    );
    const transaction = workspace
      .visible('transaction')
      .find(
        (t) =>
          t.kind === 'transaction' &&
          t.currency === workspace.profile.currency &&
          t.title.toLowerCase() === parsed.vendor.toLowerCase() &&
          t.date === parsed.date,
      );
    const vendorRule = entities('vendorRule').find(
      (r) => r.data.vendor.toLowerCase() === parsed.vendor.toLowerCase(),
    );
    const result = {
      ...parsed,
      taxCents:
        parsed.taxCents === 0 &&
        parsed.confidence < AUTO_RECEIPT_CONFIDENCE &&
        vendorRule
          ? Math.round(parsed.totalCents * vendorRule.data.taxRate)
          : parsed.taxCents,
    };
    const record = workspace.make(parsed.vendor || file.name, {
      type: 'receipt',
      ...result,
      filename: file.name,
      mime: file.type as Entity<'receipt'>['data']['mime'],
      file: await fileBase64(file),
      accepted: false,
      transactionId: transaction?.id ?? null,
      purchaseId: purchase?.id ?? null,
    }) as Entity<'receipt'>;
    if (
      parsed.confidence >= AUTO_RECEIPT_CONFIDENCE &&
      (purchase || transaction)
    )
      await acceptReceipt(record);
    else await workspace.save(record);
  }
}
export async function acceptReceipt(receipt: Entity<'receipt'>) {
  const before = receipt.data.transactionId
    ? workspace
        .visible('transaction')
        .find((t) => t.id === receipt.data.transactionId)
    : undefined;
  const transaction = {
    ...(before ?? workspace.draft('transaction')),
    title: receipt.data.vendor || receipt.title,
    amountCents: -receipt.data.totalCents,
    currency:
      before?.kind === 'transaction'
        ? before.currency
        : (entities('purchase').find((p) => p.id === receipt.data.purchaseId)
            ?.data.currency ?? workspace.profile.currency),
    date: receipt.data.date,
    category: 'Receipt',
    receiptFile: receipt.data.filename,
    taxCents: receipt.data.taxCents,
  } as UserRecord;
  const purchase = entities('purchase').find(
    (p) => p.id === receipt.data.purchaseId,
  );
  const rule = entities('vendorRule').find(
    (r) => r.data.vendor.toLowerCase() === receipt.data.vendor.toLowerCase(),
  );
  const vendor =
    receipt.data.totalCents > 0
      ? workspace.make(receipt.data.vendor || receipt.title, {
          type: 'vendorRule',
          vendor: receipt.data.vendor,
          taxRate: receipt.data.taxCents / receipt.data.totalCents,
        })
      : null;
  const changes: UserRecord[] = [
    transaction,
    {
      ...receipt,
      data: { ...receipt.data, accepted: true, transactionId: transaction.id },
    },
  ];
  if (purchase)
    changes.push({
      ...purchase,
      data: {
        ...purchase.data,
        status: 'bought',
        date: receipt.data.date,
        actualCents: receipt.data.totalCents,
        transactionId: transaction.id,
        regret: purchase.data.regret,
        emotion: purchase.data.emotion,
      },
    });
  if (rule && vendor) changes.push({ ...rule, data: vendor.data });
  else if (vendor) changes.push(vendor);
  await workspace.commit('Receipt accepted', changes);
}
