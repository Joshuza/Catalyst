import { enterWorkspace } from './startup-helper';
import { expect, test } from '@playwright/test';
test('UX-08 / UX-09: left pages, keyboard navigation, history, dark theme and reduced motion', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await enterWorkspace(page);
  await expect(
    page.getByRole('heading', { name: 'A little clarity for your day.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Catalyst pages' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Pet Tracker', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('radio', { name: 'Dark theme', exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await enterWorkspace(page);
  await expect(
    page.getByRole('radio', { name: 'Dark theme', exact: true }),
  ).toBeChecked();
  await page.getByRole('link', { name: 'Financial Core', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Financial core', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#main-content')).toBeFocused();
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'A little clarity for your day.' }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect
    .poll(() =>
      page
        .locator('main > section')
        .first()
        .evaluate((e) => getComputedStyle(e).animationDuration),
    )
    .toBe('0s');
  expect(errors).toEqual([]);
});
test('UX-07: every page works offline after the first visit', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await enterWorkspace(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await enterWorkspace(page);
  await expect(
    page.getByRole('navigation', { name: 'Catalyst pages' }),
  ).toBeVisible();
  for (const [name, heading] of [
    ['Financial Core', 'Financial core'],
    ['Recipes & groceries', 'Recipes & groceries'],
    ['Outdoors & activities', 'Outdoors & activities'],
    ['Receipts & reports', 'Receipts & reports'],
  ]) {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole('radio', { name: 'Dark theme', exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
test('UX-09: left page navigation works at a 360 px touch viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await enterWorkspace(page);
  await expect(
    page.getByRole('heading', { name: 'A little clarity for your day.' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Pages', exact: true }).click();
  await page.getByRole('link', { name: 'Calendar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your calendar' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Pages', exact: true }).click();
  await page
    .getByRole('link', { name: 'Recipes & groceries', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Recipes & groceries', exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator('main > section')
      .first()
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBeGreaterThanOrEqual(296);
  const ingredientPanel = page
    .getByRole('heading', { name: 'Recipe library', exact: true })
    .locator('..');
  expect(
    await ingredientPanel.evaluate((el) => el.getBoundingClientRect().width),
  ).toBeGreaterThanOrEqual(296);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test('UX-07: the default app makes no requests to external origins', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (new URL(r.url()).origin !== 'http://127.0.0.1:4173')
      external.push(r.url());
  });
  await page.goto('/');
  await enterWorkspace(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page
    .getByRole('link', { name: 'Connections & privacy', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Connections & privacy', exact: true }),
  ).toBeVisible();
  expect(external).toEqual([]);
});
