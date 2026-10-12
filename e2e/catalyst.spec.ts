import { test, expect } from '@playwright/test';
import { enterWorkspace } from './startup-helper';

test('Catalyst: native survey scrolling draws plans, reveals the oasis and preserves skipped questions', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));
  await page.goto('/');
  const scene = page.getByRole('complementary', {
    name: 'Your plans taking shape',
  });
  const painting = page.getByAltText(/Renaissance-style painting/);
  const blueprint = scene.locator('svg').first();
  await expect(scene).toHaveAttribute('data-scene-progress', '0.000');
  await expect(painting).toHaveCSS('clip-path', 'inset(100% 0px 0px)');
  await page.mouse.move(1100, 600);
  const firstStop = await page.locator('[data-survey-stop="0"]').boundingBox();
  if (!firstStop) throw new Error('Missing first survey question.');
  await page.mouse.wheel(0, firstStop.y - 96);
  await expect(
    page.getByRole('radio', { name: 'Monthly', exact: true }),
  ).toBeVisible();
  const initial = Number(await scene.getAttribute('data-scene-progress'));
  expect(initial).toBeGreaterThan(0);
  await page.getByRole('radio', { name: 'Monthly', exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Net income per pay period after taxes').fill('2500');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page
    .locator('[data-survey-stop="9"]')
    .evaluate((node) => node.scrollIntoView({ block: 'start' }));
  await expect(page.locator('[data-survey-stop="9"]')).toHaveAttribute(
    'data-survey-active',
    'true',
  );
  await expect
    .poll(async () => Number(await scene.getAttribute('data-scene-progress')))
    .toBeGreaterThan(initial + 0.2);
  expect(
    await painting.evaluate((node) => getComputedStyle(node).clipPath),
  ).not.toBe('inset(100% 0px 0px)');
  await page
    .locator('[data-survey-stop="19"]')
    .evaluate((node) => node.scrollIntoView({ block: 'start' }));
  await expect(
    page.getByRole('button', { name: 'Initialize my workspace', exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () => Number(await scene.getAttribute('data-scene-progress')))
    .toBeGreaterThan(0.95);
  await expect(painting).toHaveCSS('clip-path', 'inset(0% 0px 0px)');
  await expect(blueprint).toHaveCSS('opacity', '0');
  await page
    .getByRole('button', { name: 'Initialize my workspace', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Initializing Catalyst Command Engine...',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Catalyst pages' }),
  ).toBeVisible({ timeout: 6000 });
  await expect(page).toHaveTitle(/Catalyst$/);
  await page.getByRole('link', { name: 'Weekly reset', exact: true }).click();
  await expect(
    page.getByText('Skipped setup questions:', { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('Catalyst: unified capture persists real entries and quiet dashboard discloses optional content without hiding pins or urgent alerts', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));
  await page.goto('/');
  await enterWorkspace(page);
  await expect(page.locator('[data-briefing-sections] > section')).toHaveCount(
    3,
  );
  await expect(
    page.getByRole('heading', { name: 'Three things to read', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'More for today', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Three things to read', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Customize dashboard', exact: true })
    .click();
  const reading = page
    .getByRole('heading', { name: 'Three things to read', exact: true })
    .locator('..');
  await reading
    .getByRole('button', { name: 'Pin section', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Keep it simple', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Three things to read', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Add new', exact: true }).click();
  const date = await page.getByLabel('Planned date').inputValue();
  await page.getByLabel('Entry title').fill('Planned field camera');
  await page.getByLabel('Estimated cost', { exact: true }).fill('300');
  await page
    .getByRole('button', { name: 'Save purchase', exact: true })
    .click();
  await expect(
    page.getByRole('region', { name: 'Receipt printer' }),
  ).toBeVisible();
  await page.getByRole('radio', { name: 'Task', exact: true }).check();
  await page.getByLabel('Entry title').fill('Outline research essay');
  await page.getByRole('button', { name: 'Save task', exact: true }).click();
  await page.getByRole('radio', { name: 'Note', exact: true }).check();
  await page.getByLabel('Entry title').fill('Field observation');
  await page
    .getByLabel('Notes', { exact: true })
    .fill('A quiet place beside the water.');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await page.getByRole('radio', { name: 'Research', exact: true }).check();
  await page.getByLabel('Entry title').fill('Outdoor photography reference');
  await page.getByLabel('Source link').fill('https://example.com/camera');
  await page
    .getByRole('button', { name: 'Save research', exact: true })
    .click();
  await page.getByRole('radio', { name: 'Event', exact: true }).check();
  await page.getByLabel('Entry title').fill('Evening field trip');
  await page.getByLabel('Start time').fill('18:00');
  await page.getByRole('button', { name: 'Save event', exact: true }).click();
  await page.getByRole('radio', { name: 'Subscription', exact: true }).check();
  await page.getByLabel('Subscription name').fill('Studio trial');
  const today = await page.evaluate(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  await page.getByLabel('Next charge').fill(today);
  await page
    .getByRole('button', { name: 'Save subscription', exact: true })
    .click();
  await page.getByRole('link', { name: 'Briefing', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: 'A deadline needs your attention',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Three things to read', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Financial Core', exact: true }).click();
  await expect(page.getByLabel('Date for Planned field camera')).toHaveValue(
    date,
  );
  await page.getByRole('link', { name: 'Calendar', exact: true }).click();
  await page.getByLabel('Focused calendar date', { exact: true }).fill(date);
  await expect(
    page.getByRole('button', { name: /Evening field trip/ }).first(),
  ).toBeVisible();
  await page.reload();
  await enterWorkspace(page);
  await page.getByRole('link', { name: 'Tasks', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Outline research essay', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Control+k');
  await page.getByRole('searchbox').fill('Field observation');
  await expect(
    page.getByRole('button', { name: /Field observation/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('Catalyst: mobile scrolling retains one active input screen and reduced motion shows static finished art', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));
  await page.goto('/');
  const painting = page.getByAltText(/Renaissance-style painting/);
  await expect(painting).toHaveCSS('clip-path', 'inset(0% 0px 0px)');
  await page.getByRole('button', { name: 'Begin survey', exact: true }).click();
  await expect(page.locator('[data-survey-active="true"]')).toHaveCount(1);
  await page
    .locator('[data-survey-stop="2"]')
    .evaluate((node) => node.scrollIntoView({ block: 'start' }));
  await expect(page.locator('[data-survey-stop="2"]')).toHaveAttribute(
    'data-survey-active',
    'true',
  );
  await expect(page.locator('[data-survey-active="true"]')).toHaveCount(1);
  await expect(page.getByLabel('Next deposit date')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await painting.evaluate((node) => getComputedStyle(node).clipPath),
  ).toBe('inset(0% 0px 0px)');
});
