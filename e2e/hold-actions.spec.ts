import { expect, test } from '@playwright/test';

test('hold control: pointer release and moving outside cancel; a full pointer hold saves deletion', async ({
  page,
}) => {
  await page.goto('/#records');
  await expect(
    page.getByRole('button', { name: 'New note', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await page.getByLabel('Title', { exact: true }).fill('Pointer note');
  await page.getByRole('button', { name: 'Save record', exact: true }).click();
  await expect(
    page.getByText('Saved on this device.', { exact: true }),
  ).toBeVisible();
  await page.clock.install();
  const button = page.getByRole('button', { name: /^Hold to delete/ });
  const box = await button.boundingBox();
  if (!box) throw new Error('Missing hold button.');
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.clock.runFor(1599);
  await page.mouse.up();
  await page.clock.runFor(200);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 30, center.y);
  await page.clock.runFor(1700);
  await page.mouse.up();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.clock.runFor(1600);
  await page.mouse.up();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Undo', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(
    page.getByRole('list', { name: 'Recent records' }),
  ).toContainText('Pointer note');
});

test('SRCH-05: new task and month export verbs perform real local actions', async ({
  page,
}) => {
  await page.goto('/#records');
  await expect(
    page.getByRole('button', { name: /^Search Ctrl/ }),
  ).toBeEnabled();
  await page.getByText('Data and backups', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Load sample data', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Remove sample data' }),
  ).toBeVisible();
  await page.keyboard.press('Control+k');
  await page
    .getByRole('searchbox', { name: 'Search records' })
    .fill('new task');
  await page.keyboard.press('Enter');
  await page.getByLabel('Title', { exact: true }).fill('My search task');
  await page
    .getByLabel('Task notes', { exact: true })
    .fill('Created by the local search action.');
  await page.getByRole('button', { name: 'Save record', exact: true }).click();
  await expect(
    page.getByText('Saved on this device.', { exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+k');
  await page
    .getByRole('searchbox', { name: 'Search records' })
    .fill('export October');
  const download = page.waitForEvent('download');
  await page.keyboard.press('Enter');
  expect((await download).suggestedFilename()).toBe('nexus-backup.json');
  await page.getByRole('button', { name: 'Remove sample data' }).click();
  await expect(page.getByText('1 record', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('list', { name: 'Recent records' }),
  ).toContainText('My search task');
});
