import { expect, test } from '@playwright/test';

test('SRCH-02 / SRCH-03: guide receipt example spans modules and keyboard follows visible groups', async ({
  page,
}) => {
  await page.goto('/#records');
  await page.getByText('Data and backups', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Load sample data', exact: true })
    .click();
  await expect(
    page.getByText('9 records · Sample data loaded', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^Search Ctrl/ }).focus();
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog', { name: 'Search this device' });
  const input = dialog.getByRole('searchbox', { name: 'Search records' });
  const rows = dialog.locator('button[id^="search-hit-"]');
  const titles = await rows.locator('span').allTextContents();
  expect(titles).toHaveLength(9);
  for (const [index, title] of titles.entries()) {
    if (index > 0) await input.press('ArrowDown');
    await expect(input).toHaveAccessibleDescription(
      `9 results. Selected: ${title}`,
    );
    await input.press('Tab');
    await expect(rows.nth(index)).toBeFocused();
    await input.focus();
  }
  await input.fill('receipt');
  await expect(
    dialog.getByRole('region', { name: 'transaction results' }),
  ).toBeVisible();
  await expect(
    dialog.getByRole('region', { name: 'note results' }),
  ).toBeVisible();
  await expect(
    dialog.getByRole('region', { name: 'message results' }),
  ).toBeVisible();
  await expect(rows).toHaveCount(5);
  await expect(input).toHaveAccessibleDescription(
    '5 results. Selected: Sample: equipment invoice',
  );
  await input.press('ArrowDown');
  await input.press('Tab');
  await expect(
    dialog.getByRole('button', { name: /^Sample: small receipt/ }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    dialog.getByRole('button', {
      name: 'Copy amount for Sample: small receipt',
    }),
  ).toBeFocused();
  await input.focus();
  await input.press('ArrowDown');
  await input.press('ArrowDown');
  await expect(input).toHaveAccessibleDescription(
    '5 results. Selected: Sample: research notes',
  );
  await input.press('Enter');
  await expect(
    page.getByRole('dialog', { name: 'Record detail' }),
  ).toBeVisible();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'Sample: research notes',
  );
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: /^Search Ctrl/ }),
  ).toBeFocused();
});
