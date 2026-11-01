import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { FixedClock } from '../src/domain/clock';
import { productSamples } from '../src/fixtures/product';
import { recordSchema } from '../src/domain/records';
import { exportBackup, importBackup } from '../src/data/backup';
import { enterWorkspace } from './startup-helper';

test('Rollback: original sidebar and dashboard load widget-era preferences without losing records', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const clock = new FixedClock('2026-10-10T12:00:00Z');
  const samples = productSamples(clock);
  const base = samples[0]!;
  const task = samples.find((record) => record.kind === 'task')!;
  const layout = [{ id: 'tasks', size: 'large' }];
  const briefing = recordSchema.parse({
    id: base.id,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
    schemaVersion: 1,
    deletedAt: null,
    sampleSet: 'product-tour',
    kind: 'module',
    title: 'Sample: saved dashboard preferences',
    data: {
      type: 'briefing',
      lastVisit: '2026-10-10',
      deepWork: false,
      activeTask: '',
      hidden: [],
      pinned: ['finance'],
      expanded: [],
      widgetLayout: layout,
    },
  });
  await page.clock.setFixedTime(clock.now());
  await page.goto('/#records');
  await enterWorkspace(page);
  await page.getByText('Data and backups', { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'sample-widget-era-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      exportBackup([briefing, task], clock.now().toISOString()),
    ),
  });
  await page
    .getByRole('button', { name: 'Import and merge', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: /^Sample: history essay/ }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Briefing', exact: true }).click();
  await expect(page.locator('[data-briefing-sections] > section')).toHaveCount(
    3,
  );
  await expect(
    page.getByRole('button', { name: 'Browse widgets', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-widget-canvas], [data-module-window]'),
  ).toHaveCount(0);
  const nav = page.getByRole('navigation', {
    name: 'Catalyst pages',
    exact: true,
  });
  expect(
    await nav.evaluate((element) => element.getBoundingClientRect().width),
  ).toBeGreaterThan(180);
  await page.getByRole('link', { name: 'Tasks', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: task.title, exact: true }),
  ).toBeVisible();
  await page.reload();
  await enterWorkspace(page);
  await expect(
    page.getByRole('heading', { name: task.title, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page
    .getByRole('link', { name: 'Notes & records', exact: true })
    .click();
  await page.getByText('Data and backups', { exact: true }).click();
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Export JSON backup', exact: true })
    .click();
  const path = await (await download).path();
  if (!path) throw new Error('Missing exported backup.');
  const exported = importBackup(await readFile(path, 'utf8'));
  expect(exported.records).toContainEqual(task);
  const saved = exported.records.find((record) => record.id === briefing.id);
  expect(saved).toMatchObject({
    data: { widgetLayout: layout, pinned: ['finance'] },
  });
  expect(errors).toEqual([]);
});
