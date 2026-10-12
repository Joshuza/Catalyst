import { enterWorkspace } from './startup-helper';
import { expect, test, type Page } from '@playwright/test';
import type { Row } from '../src/data/stored';
import { sampleRecords } from '../src/fixtures/search';

async function ready(page: Page) {
  await page.goto('/#records');
  await enterWorkspace(page);
  await expect(
    page.getByRole('button', { name: /^Search Ctrl/ }),
  ).toBeEnabled();
}
async function samples(page: Page) {
  await page.getByText('Data and backups', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Load sample data', exact: true })
    .click();
  await expect(
    page.getByText('9 records · Sample data loaded', { exact: true }),
  ).toBeVisible();
}
const recent = (page: Page, name: string) =>
  page
    .getByRole('list', { name: 'Recent records' })
    .getByRole('button', { name: new RegExp(name) });

test('SRCH-01 to SRCH-06: keyboard Spotlight, required filters, secondary actions, focus and private storage', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  await samples(page);
  const opener = page.getByRole('button', { name: /^Search Ctrl/ });
  await opener.focus();
  await page.keyboard.press('Control+k');
  const spotlight = page.getByRole('dialog', { name: 'Search this device' });
  const search = spotlight.getByRole('searchbox', { name: 'Search records' });
  await expect(search).toBeFocused();
  await search.fill('receipts over $100 in October');
  await expect(
    spotlight.getByRole('button', { name: /^Sample: equipment invoice/ }),
  ).toHaveCount(1);
  await expect(
    spotlight.getByRole('button', { name: /^Sample: small receipt/ }),
  ).toHaveCount(0);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /Copy amount/ })).toBeFocused();
  await search.focus();
  await search.fill('unread from Maria');
  await expect(
    spotlight.getByRole('button', { name: /^Sample: draft feedback/ }),
  ).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('dialog', { name: 'Record detail' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Sample: draft feedback' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  const stored = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nexus-os');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const stores = Array.from(db.objectStoreNames);
    const rows = await new Promise<Row[]>((resolve, reject) => {
      const request = db.transaction('records').objectStore('records').getAll();
      request.onsuccess = () => resolve(request.result as Row[]);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return {
      stores,
      sensitive: JSON.stringify(
        rows.filter((row) => ['transaction', 'message'].includes(row.kind)),
      ),
      localKeys: Object.keys(localStorage),
    };
  });
  expect(stored.stores).toEqual(['keys', 'metadata', 'records']);
  expect(stored.localKeys).toEqual(['nexus.theme']);
  expect(stored.sensitive).not.toContain('Maria');
  expect(stored.sensitive).not.toContain('15025');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await context.setOffline(true);
  await page.reload();
  await enterWorkspace(page);
  await expect(opener).toBeEnabled();
  await page.keyboard.press('Control+k');
  await search.fill('receipt');
  await expect(
    spotlight.getByRole('button', { name: /^Sample: equipment invoice/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('UX-05: create, edit, hold-delete, undo and redo Note and Transaction with keyboard only', async ({
  page,
}) => {
  await ready(page);
  for (const kind of ['note', 'transaction']) {
    const name = `My ${kind}`;
    await page
      .getByRole('button', { name: `New ${kind}`, exact: true })
      .press('Enter');
    await page.getByLabel('Title', { exact: true }).fill(name);
    if (kind === 'transaction')
      await page.getByLabel('Amount', { exact: true }).fill('-123.45');
    else
      await page
        .getByLabel('Note', { exact: true })
        .fill('Kept on this device.');
    await page
      .getByRole('button', { name: 'Save record', exact: true })
      .press('Enter');
    await expect(
      page.getByText('Saved on this device.', { exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Close Record detail' })
      .press('Enter');
    await page
      .getByRole('button', { name: 'Undo', exact: true })
      .press('Enter');
    await expect(recent(page, name)).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Redo', exact: true })
      .press('Enter');
    await expect(recent(page, name)).toBeVisible();
    await recent(page, name).press('Enter');
    await page.getByLabel('Title', { exact: true }).fill(`Updated ${kind}`);
    await page
      .getByRole('button', { name: 'Save record', exact: true })
      .press('Enter');
    await expect(
      page.getByText('Saved on this device.', { exact: true }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+z');
    await expect(recent(page, name)).toBeVisible();
    await page.keyboard.press('Control+Shift+z');
    await expect(recent(page, `Updated ${kind}`)).toBeVisible();
    await recent(page, `Updated ${kind}`).press('Enter');
    const hold = page.getByRole('button', { name: /^Hold to delete/ });
    await hold.focus();
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.down('Enter');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.keyboard.up('Enter');
    await expect(recent(page, `Updated ${kind}`)).toHaveCount(0);
    await page.keyboard.press('Control+z');
    await expect(recent(page, `Updated ${kind}`)).toBeVisible();
    await page.keyboard.press('Control+Shift+z');
    await expect(recent(page, `Updated ${kind}`)).toHaveCount(0);
  }
});

test('UX-07: durable data, atomic backups, sample removal and tamper error without a crash', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  await samples(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON backup' }).click();
  expect((await download).suggestedFilename()).toBe('catalyst-backup.json');
  await page.getByRole('button', { name: 'Remove sample data' }).click();
  await expect(page.getByText('0 records', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(recent(page, 'Sample: equipment invoice')).toBeVisible();
  await page.reload();
  await enterWorkspace(page);
  await expect(recent(page, 'Sample: equipment invoice')).toBeVisible();
  await page.getByText('Data and backups', { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken'),
  });
  await page.getByRole('button', { name: 'Import and merge' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'not a valid Catalyst backup',
  );
  const incoming = sampleRecords().map((record) => ({
    ...record,
    title: `${record.title} restored`,
  }));
  await page.locator('input[type="file"]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        format: 'nexus-backup',
        version: 1,
        exportedAt: '2026-10-10T12:00:00Z',
        records: incoming,
      }),
    ),
  });
  await page.getByRole('button', { name: 'Import and merge' }).click();
  await expect(recent(page, 'equipment invoice restored')).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(recent(page, 'Sample: equipment invoice')).toBeVisible();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open('nexus-os');
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('records', 'readwrite');
      const store = tx.objectStore('records');
      const request = store.getAll();
      request.onsuccess = () => {
        const row = (request.result as Row[]).find(
          (value) => value.kind === 'transaction',
        );
        if (row?.value.storage === 'encrypted' && row.value.fields.title) {
          row.value.fields.title.data = 'AAAA';
          store.put(row);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.reload();
  await enterWorkspace(page);
  await expect(page.getByRole('alert')).toContainText(
    'stored record could not be verified',
  );
  await expect(
    page.getByRole('button', { name: /^Search Ctrl/ }),
  ).toBeEnabled();
  expect(errors).toEqual([]);
});

test('Phase 1: starts from the Phase 0 profile at 360px, traps focus, reduced motion and cold empty load budget', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('nexus.theme', 'dark'));
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const started = performance.now();
  await page.goto('/#records');
  await expect(
    page.getByRole('button', { name: 'Begin survey', exact: true }),
  ).toBeEnabled();
  const elapsed = performance.now() - started;
  console.info(`COLD_EMPTY_LOAD elapsed_ms=${elapsed.toFixed(1)}`);
  expect(elapsed).toBeLessThan(2000);
  await enterWorkspace(page);
  await page.getByRole('button', { name: 'Pages', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Dark theme' })).toBeChecked();
  await page.getByRole('button', { name: 'Close navigation' }).click();
  await page.keyboard.press('Control+k');
  const spotlight = page.getByRole('dialog', { name: 'Search this device' });
  const search = spotlight.getByRole('searchbox', { name: 'Search records' });
  await expect(search).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(
    page.getByRole('button', { name: 'Close Search this device' }),
  ).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(
    await page
      .getByRole('dialog')
      .evaluate((dialog) => dialog.contains(document.activeElement)),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  expect(
    await page
      .getByRole('button', { name: 'Save record', exact: true })
      .evaluate((button) =>
        getComputedStyle(button)
          .transitionDuration.split(',')
          .every((value) => value.trim() === '0s'),
      ),
  ).toBe(true);
});
