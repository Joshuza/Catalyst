import { PlanningExport } from './PlanningExport';
import { workspace } from '../local/runtime';
import { useState, useEffect } from 'react';
import { Page, Panel, Field, MoneyField, DeleteRecord } from './Common';
import { MagneticDropZone, ReceiptPrinter } from './Animations';
import { importReceipts, acceptReceipt } from './receipts-service';
import { reportCsv } from '../../domain/product/receipts';
import { downloadBackup } from '../local/runtime';
import { entities, useProduct, run, money, type Entity } from './state';
import s from './product.module.css';
export function ReceiptsPage() {
  const { today, baseProfile, busy } = useProduct();
  const [ocr, setOcr] = useState(!!baseProfile.receiptOcr);
  useEffect(() => setOcr(!!baseProfile.receiptOcr), [baseProfile.receiptOcr]);
  const [processing, setProcessing] = useState(false),
    [error, setError] = useState(''),
    [printed, setPrinted] = useState<Entity<'receipt'> | null>(null);
  return (
    <Page
      title="Receipts & reports"
      subtitle="Reconcile purchases with their final cost. Receipt files stay encrypted on this device."
    >
      <div className={s.grid}>
        <Panel title="Import receipts">
          <label>
            <input
              type="checkbox"
              checked={ocr}
              disabled={busy || processing}
              onChange={(e) => {
                const enabled = e.target.checked;
                setOcr(enabled);
                run(
                  workspace
                    .saveProfile({ ...baseProfile, receiptOcr: enabled })
                    .catch((error) => {
                      setOcr(!!baseProfile.receiptOcr);
                      setError(
                        error instanceof Error
                          ? error.message
                          : 'Preference could not be saved.',
                      );
                    }),
                );
              }}
            />
            Enable local screenshot OCR (English)
          </label>
          <MagneticDropZone
            onFiles={(files) => {
              if (processing) return;
              setProcessing(true);
              setError('');
              void importReceipts(files, today, ocr)
                .catch((err) =>
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'This receipt could not be parsed.',
                  ),
                )
                .finally(() => setProcessing(false));
            }}
          >
            <p role="status">
              {processing
                ? 'Processing receipts locally. You can keep working.'
                : ''}
            </p>
          </MagneticDropZone>
          <p className={s.muted}>
            PDF and text extraction run locally. Optional screenshot OCR loads
            local language files and uses an on-device worker. Images stay on
            your device. Review unclear results before applying them.
          </p>
          {error && <p role="alert">{error}</p>}
        </Panel>
        <Panel title="Expense export">
          <ExpenseExport />
        </Panel>
        <Panel title="Planning audit">
          <PlanningExport />
        </Panel>
        <Panel title="Receipt review" wide>
          {entities('receipt').length === 0 ? (
            <p className={s.empty}>
              Drop a receipt to reconcile a purchase or create an expense.
            </p>
          ) : (
            entities('receipt').map((r) => (
              <div key={r.id}>
                {r.data.accepted ? (
                  <div className={s.row}>
                    <div>
                      <strong>{r.data.vendor}</strong>
                      <p className={s.muted}>
                        {r.data.filename} · {r.data.date} ·{' '}
                        {money(r.data.totalCents)}
                      </p>
                    </div>
                    <span className={s.badge}>Accepted</span>
                    <DeleteRecord record={r} />
                  </div>
                ) : (
                  <ReceiptReview receipt={r} onAccepted={setPrinted} />
                )}
              </div>
            ))
          )}
        </Panel>
        {printed && (
          <Panel title="Purchase recorded">
            <ReceiptPrinter
              title={printed.data.vendor}
              cents={printed.data.totalCents}
            />
          </Panel>
        )}
      </div>
    </Page>
  );
}
export function ReceiptReview({
  receipt,
  onAccepted,
}: {
  receipt: Entity<'receipt'>;
  onAccepted?: (r: Entity<'receipt'>) => void;
}) {
  const [draft, setDraft] = useState(receipt.data),
    [purchase, setPurchase] = useState(receipt.data.purchaseId ?? ''),
    [error, setError] = useState('');
  return (
    <div className={s.panel}>
      <h3>
        Review {receipt.data.filename} ·{' '}
        {Math.round(receipt.data.confidence * 100)}% extraction confidence
      </h3>
      <div className={s.pair}>
        <Field label="Receipt vendor">
          <input
            value={draft.vendor}
            onChange={(e) =>
              setDraft((d) => ({ ...d, vendor: e.target.value }))
            }
          />
        </Field>
        <Field label="Receipt date">
          <input
            type="date"
            value={draft.date}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
          />
        </Field>
        <MoneyField
          label="Receipt total"
          cents={draft.totalCents}
          onChange={(totalCents) => setDraft((d) => ({ ...d, totalCents }))}
        />
        <MoneyField
          label="Receipt tax"
          cents={draft.taxCents}
          onChange={(taxCents) => setDraft((d) => ({ ...d, taxCents }))}
        />
      </div>
      <Field label="Match purchase">
        <select value={purchase} onChange={(e) => setPurchase(e.target.value)}>
          <option value="">New transaction</option>
          {entities('purchase')
            .filter((p) => p.data.status === 'planned')
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
        </select>
      </Field>
      <details>
        <summary>Extracted line items</summary>
        <p className={s.note}>
          {draft.items.join('\n') || 'No line items found.'}
        </p>
      </details>
      <button
        type="button"
        disabled={
          !draft.vendor.trim() ||
          draft.totalCents <= 0 ||
          draft.taxCents > draft.totalCents
        }
        onClick={() => {
          const accepted = {
            ...receipt,
            title: draft.vendor,
            data: { ...draft, purchaseId: purchase || null },
          };
          void acceptReceipt(accepted)
            .then(() => onAccepted?.(accepted))
            .catch((err) =>
              setError(
                err instanceof Error
                  ? err.message
                  : 'Receipt could not be accepted.',
              ),
            );
        }}
      >
        Accept receipt
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export function ExpenseExport() {
  const { today, records } = useProduct();
  const [start, setStart] = useState(today.slice(0, 8) + '01'),
    [end, setEnd] = useState(today),
    [category, setCategory] = useState(''),
    [includeEmotion, setIncludeEmotion] = useState(false);
  const expenses = records.filter(
    (r) =>
      r.kind === 'transaction' &&
      !r.deletedAt &&
      r.date >= start &&
      r.date <= end &&
      r.amountCents < 0 &&
      (!category || r.category === category),
  );
  const rows: unknown[][] = [
    [
      'Date',
      'Vendor',
      'Category',
      'Amount',
      'Currency',
      'Tax',
      'Original receipt file',
      ...(includeEmotion ? ['Regret', 'Emotion'] : []),
    ],
    ...expenses.map((r) =>
      r.kind === 'transaction'
        ? [
            r.date,
            r.title,
            r.category,
            (Math.abs(r.amountCents) / 100).toFixed(2),
            r.currency,
            ((r.taxCents ?? 0) / 100).toFixed(2),
            r.receiptFile ?? '',
            ...(includeEmotion ? [r.regret ?? '', r.emotion ?? ''] : []),
          ]
        : [],
    ),
  ];
  return (
    <div className={s.form}>
      <div className={s.pair}>
        <Field label="Export from">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </Field>
        <Field label="Export to">
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Export category">
        <input
          value={category}
          placeholder="All categories"
          onChange={(e) => setCategory(e.target.value)}
        />
      </Field>
      <label>
        <input
          type="checkbox"
          checked={includeEmotion}
          onChange={(e) => setIncludeEmotion(e.target.checked)}
        />
        Include regret and emotional tags
      </label>
      <p>{expenses.length} expenses</p>
      {[
        ...new Set(
          expenses.flatMap((r) =>
            r.kind === 'transaction' ? [r.currency] : [],
          ),
        ),
      ].map((currency) => (
        <p key={currency}>
          {currency}:{' '}
          {money(
            expenses.reduce(
              (sum, r) =>
                sum +
                (r.kind === 'transaction' && r.currency === currency
                  ? Math.abs(r.amountCents)
                  : 0),
              0,
            ),
            currency,
          )}
        </p>
      ))}
      <div className={s.actions}>
        <button
          type="button"
          disabled={start > end}
          onClick={() =>
            downloadBackup(reportCsv(rows), 'catalyst-expenses.csv')
          }
        >
          Export CSV
        </button>
        <button
          type="button"
          disabled={start > end}
          onClick={() =>
            run(
              import('write-excel-file').then(async ({ default: write }) => {
                await write(
                  rows.map((row) =>
                    row.map((value) => ({
                      type: String,
                      value: String(value ?? ''),
                    })),
                  ),
                  { fileName: 'catalyst-expenses.xlsx' },
                );
              }),
            )
          }
        >
          Export Excel
        </button>
      </div>
    </div>
  );
}
