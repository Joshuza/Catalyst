import { enterWorkspace } from './startup-helper';
import { test, expect } from '@playwright/test';
test('RCP-01 / RCP-02: opt-in screenshot OCR runs offline with local models and keeps unclear matches reviewable', async ({
  page,
  context,
}) => {
  const errors: string[] = [],
    external: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  context.on('request', (r) => {
    if (new URL(r.url()).origin !== 'http://127.0.0.1:4173')
      external.push(r.url());
  });
  await page.goto('/#receipts');
  await enterWorkspace(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await page.getByLabel('Enable local screenshot OCR (English)').check();
  await expect(page.getByText('Record saved', { exact: true })).toBeVisible();
  await context.setOffline(true);
  await page
    .getByLabel('Receipt files')
    .setInputFiles('src/fixtures/receipts/sample-image-receipt.png');
  const review = page
    .getByRole('heading', { name: /Review sample-image-receipt.png/ })
    .locator('..');
  await expect(review.getByLabel('Receipt total')).toHaveValue('48.6', {
    timeout: 30000,
  });
  await expect(review.getByLabel('Receipt tax')).toHaveValue('3.6');
  await expect(review.getByLabel('Receipt vendor')).toHaveValue(
    'Sample Corner Store',
  );
  await expect(
    review.getByRole('button', { name: 'Accept receipt', exact: true }),
  ).toBeVisible();
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
