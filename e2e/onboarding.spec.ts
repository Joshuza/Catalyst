import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
async function next(page: Page) {
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}
test('ONB art direction: detailed survey drives finance, calendar, role, pet care, JSON export and every startup', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'A life with room to grow.' }),
  ).toBeVisible();
  await expect(page.getByAltText(/Renaissance-style painting/)).toBeVisible();
  await page.getByRole('button', { name: 'Begin survey', exact: true }).click();
  await page.getByRole('radio', { name: 'Monthly', exact: true }).check();
  await next(page);
  await page.getByLabel('Net income per pay period after taxes').fill('4.5k');
  await next(page);
  await next(page);
  await page.getByLabel('Current liquid savings').fill('12000');
  await next(page);
  const before = await page
    .locator('svg[aria-label^="Financial projection"] path')
    .nth(1)
    .getAttribute('d');
  await page
    .getByRole('button', { name: 'Rent/Mortgage', exact: true })
    .click();
  await page.getByLabel('Rent/Mortgage monthly estimate').fill('1500');
  await expect
    .poll(() =>
      page
        .locator('svg[aria-label^="Financial projection"] path')
        .nth(1)
        .getAttribute('d'),
    )
    .not.toBe(before);
  await next(page);
  await page.getByLabel('Minimum safe balance').fill('2000');
  await next(page);
  await page
    .getByRole('button', { name: 'Skip this question', exact: true })
    .click();
  await page.getByRole('button', { name: /Professional Deliverables/ }).click();
  await next(page);
  await next(page);
  await page.getByRole('radio', { name: '6h', exact: true }).check();
  await next(page);
  await page.getByLabel('Transit Pass', { exact: true }).check();
  await next(page);
  await page.getByLabel('Opt-Out of Walking', { exact: true }).check();
  await next(page);
  await page.getByRole('checkbox', { name: 'Light Rail', exact: true }).check();
  await next(page);
  await page.getByRole('button', { name: 'Nut Allergy', exact: true }).click();
  await next(page);
  await page.getByLabel('Search publications or paste a link').fill('Vox');
  await page.getByRole('button', { name: 'Vox', exact: true }).click();
  await next(page);
  await page.getByRole('button', { name: 'Finance', exact: true }).click();
  await page.getByLabel('Morning digest time').fill('08:30');
  await next(page);
  await next(page);
  await page.getByLabel('Enable Pet Tracker').check();
  await page.getByLabel('Pet name', { exact: true }).fill('Test companion');
  await page.getByLabel('Pet species', { exact: true }).fill('Dog');
  await page.getByLabel('Vet visit interval in months').fill('6');
  await page.getByLabel('Food restock interval in days').fill('21');
  await page.getByLabel('Next food restock').fill('2027-01-10');
  await next(page);
  await page.getByLabel('Weekly reset day').selectOption('6');
  await next(page);
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Export survey JSON', exact: true })
    .click();
  const file = await download;
  const path = await file.path();
  if (!path) throw new Error('Missing JSON download.');
  const exported: {
    responses: {
      persona: string;
      fixedExpenses: { amountCents: number }[];
      calendarZoom: string;
      walkingMiles: number;
      mediaTopics: string[];
      petFoodDays: number;
    };
  } = JSON.parse(await readFile(path, 'utf8'));
  expect(exported.responses).toMatchObject({
    persona: 'professional',
    calendarZoom: '6h',
    walkingMiles: 0,
    mediaTopics: ['Finance'],
    petFoodDays: 21,
  });
  expect(exported.responses.fixedExpenses[0]?.amountCents).toBe(150000);
  const started = performance.now();
  await page
    .getByRole('button', { name: 'Initialize my workspace', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Initializing Codex Command Engine...',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel('Initialization progress')).toHaveAttribute(
    'value',
    '1',
  );
  await expect(
    page.getByRole('navigation', { name: 'Nexus pages' }),
  ).toBeVisible({ timeout: 6000 });
  expect(performance.now() - started).toBeGreaterThanOrEqual(3000);
  expect(performance.now() - started).toBeLessThan(6000);
  await page.getByRole('link', { name: 'Calendar', exact: true }).click();
  await expect(page.getByLabel('Pacing interval')).toHaveValue('6');
  await page.getByRole('link', { name: 'Tasks', exact: true }).click();
  await page.getByLabel('New task title').fill('Test role default');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await page.getByText('Task settings', { exact: true }).click();
  await expect(page.getByLabel('Role for Test role default')).toHaveValue(
    'professional',
  );
  await page.getByRole('link', { name: 'Pet Tracker', exact: true }).click();
  await expect(
    page.getByText('Food · Every 21 days', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Add next food reminder', exact: true })
    .click();
  await expect(
    page.getByText('Test companion food reminder', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', {
      name: 'Continue with saved answers',
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Review my answers', exact: true })
    .click();
  await expect(
    page.getByRole('radio', { name: 'Monthly', exact: true }),
  ).toBeChecked();
  await next(page);
  await expect(
    page.getByLabel('Net income per pay period after taxes'),
  ).toHaveValue('4500');
  expect(errors).toEqual([]);
});
test('ONB: native validation, offline artwork and fonts, keyboard focus and mobile reduced motion', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin survey', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Give your income a rhythm.' }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await next(page);
  await page
    .getByLabel('Net income per pay period after taxes')
    .fill('invalid');
  await next(page);
  await expect(
    page.getByRole('heading', { name: 'What reaches your account?' }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Net income per pay period after taxes'),
  ).toHaveAttribute('aria-invalid', 'true');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Begin survey', exact: true }),
  ).toBeEnabled();
  await expect
    .poll(() =>
      page
        .getByAltText(/Renaissance-style painting/)
        .evaluate(
          (img) =>
            (img as HTMLImageElement).complete &&
            (img as HTMLImageElement).naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () =>
        document.fonts.check('16px "Cormorant Garamond"') &&
        document.fonts.check('12px "IBM Plex Mono"'),
    ),
  ).toBe(true);
  await page
    .getByRole('button', { name: 'Skip all and start', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Initializing Codex Command Engine...',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Pages', exact: true }),
  ).toBeVisible({ timeout: 6000 });
  await page.getByRole('button', { name: 'Pages', exact: true }).click();
  await expect(
    page.getByRole('navigation', { name: 'Nexus pages' }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Profile & preferences', exact: true })
    .click();
  await page.getByRole('radio', { name: '1 Day', exact: true }).check();
  await page
    .getByRole('button', { name: 'Save preferences', exact: true })
    .click();
  await page.getByRole('button', { name: 'Pages', exact: true }).click();
  await page.getByRole('link', { name: 'Calendar', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '1 Day', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});
