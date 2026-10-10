import { expect, test } from '@playwright/test';

test('Phase 0: fresh canvas, keyboard controls, dark theme, and reduced motion', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('article')).toHaveCount(3);
  await expect(page.getByText('Sample', { exact: true })).toHaveCount(3);
  await page.getByRole('radio', { name: 'Dark theme' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(
    await page
      .getByRole('article')
      .first()
      .evaluate((element) => {
        const probe = document.createElement('div');
        probe.style.backgroundColor = 'var(--color-surface)';
        document.body.append(probe);
        const expected = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return getComputedStyle(element).backgroundColor === expected;
      }),
  ).toBe(true);
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Dark theme' })).toBeChecked();
  const expand = page
    .getByRole('button', { name: 'Expand tile', exact: true })
    .first();
  await expand.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Collapse tile' }),
  ).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Collapse tile' }).press('Enter');
  await page
    .getByRole('button', { name: 'Dim A place to bring it together.' })
    .press('Space');
  await expect(
    page.getByRole('button', { name: 'Restore A place to bring it together.' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect
    .poll(() =>
      page
        .getByRole('article')
        .first()
        .evaluate((element) => getComputedStyle(element).transitionDuration),
    )
    .toBe('0s');
  expect(errors).toEqual([]);
});

test('UX-07: an offline reload works after the first visit', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('article')).toHaveCount(3);
  await page.getByRole('radio', { name: 'Dark theme' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('UX-09: all tiles fit a 360 px touch viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(page.getByRole('article')).toHaveCount(3);
  for (const tile of await page.getByRole('article').all()) {
    const rect = await tile.boundingBox();
    expect(rect).not.toBeNull();
    if (rect) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(360);
    }
  }
  await page.getByRole('button', { name: 'Expand tile' }).last().click();
  await expect(
    page.getByRole('button', { name: 'Collapse tile' }),
  ).toBeVisible();
});

test('UX-07: the default shell makes no requests to external origins', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173')
      external.push(request.url());
  });
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.getByRole('radio', { name: 'Light theme' }).check();
  await page.getByRole('button', { name: 'Expand tile' }).first().click();
  expect(external).toEqual([]);
});
