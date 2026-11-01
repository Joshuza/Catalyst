import { expect, test, type Page } from '@playwright/test';
import { enterWorkspace } from './startup-helper';
import { navigation } from '../src/ui/product/navigation';

async function start(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));
  await page.goto('/');
  await enterWorkspace(page);
  await expect(
    page.locator('[data-widget-canvas] [data-widget-id]'),
  ).toHaveCount(6);
}
const card = (page: Page, id: string) =>
  page.locator(`[data-widget-canvas] [data-widget-id="${id}"]`);

test('Widgets: every enabled menu module has a live summary and opens one larger workspace window', async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await start(page);
  await page
    .getByRole('button', { name: 'Browse widgets', exact: true })
    .click();
  const library = page.getByRole('dialog', {
    name: 'Widget library',
    exact: true,
  });
  await expect(
    library.getByRole('region', { name: /widget preview$/ }),
  ).toHaveCount(23);
  await expect(
    library.getByRole('region', {
      name: 'Pet Tracker widget preview',
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Close Widget library', exact: true })
    .click();
  for (const [id, label] of navigation
    .flatMap((group) => group.links)
    .filter(([id]) => id !== 'pet')) {
    await page
      .getByRole('button', { name: 'Browse widgets', exact: true })
      .click();
    await page
      .getByRole('searchbox', { name: 'Find a widget', exact: true })
      .fill(label!);
    await library
      .getByRole('button', { name: `Open ${label} widget`, exact: true })
      .click();
    await expect(library).toHaveCount(0);
    await expect(page.locator('[data-module-window]')).toHaveAttribute(
      'data-module-window',
      id === 'briefing' ? 'briefing-detail' : id!,
    );
    await expect(page.locator('[data-module-window] h1').first()).toBeVisible();
    await expect(
      page.getByLabel(`${label} window controls`, { exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: `Close ${label} window`, exact: true })
      .click();
    await expect(page.locator('[data-module-window]')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('Widgets: sizes, chosen summaries and removals persist, support undo, and stay connected to real records', async ({
  page,
}) => {
  await start(page);
  await expect(card(page, 'finance')).toHaveAttribute(
    'data-widget-size',
    'large',
  );
  await page
    .getByRole('button', { name: 'Customize dashboard', exact: true })
    .click();
  await page
    .getByLabel('Size of Tasks widget', { exact: true })
    .selectOption('large');
  await expect(card(page, 'tasks')).toHaveAttribute(
    'data-widget-size',
    'large',
  );
  await page
    .getByRole('button', { name: 'Remove Research vault widget', exact: true })
    .click();
  await expect(card(page, 'research')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo change', exact: true }).click();
  await expect(card(page, 'research')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Finish customizing', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Browse widgets', exact: true })
    .click();
  await page
    .getByRole('searchbox', { name: 'Find a widget', exact: true })
    .fill('Savings goals');
  const preview = page.getByRole('region', {
    name: 'Savings goals widget preview',
    exact: true,
  });
  await preview
    .getByLabel('Size of Savings goals widget', { exact: true })
    .selectOption('small');
  await preview
    .getByRole('button', { name: 'Add to dashboard', exact: true })
    .click();
  await expect(
    preview.getByRole('button', { name: 'Remove from dashboard', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Close Widget library', exact: true })
    .click();
  await expect(card(page, 'goals')).toHaveAttribute(
    'data-widget-size',
    'small',
  );
  await page
    .getByRole('button', { name: 'Open Tasks widget', exact: true })
    .click();
  await page
    .getByLabel('New task title', { exact: true })
    .fill('Sample: organize project');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await page
    .getByRole('button', { name: 'Maximize window', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Restore window size', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('button', { name: 'Close Tasks window', exact: true })
    .click();
  await expect(card(page, 'tasks')).toContainText('1 open task');
  await expect(
    page.getByRole('button', { name: 'Open Tasks widget', exact: true }),
  ).toBeFocused();
  await page.reload();
  await enterWorkspace(page);
  await expect(card(page, 'tasks')).toHaveAttribute(
    'data-widget-size',
    'large',
  );
  await expect(card(page, 'goals')).toHaveAttribute(
    'data-widget-size',
    'small',
  );
  await expect(card(page, 'tasks')).toContainText('Sample: organize project');
});

test('Widgets: dark, reduced-motion mobile dashboard and expanded windows fit at 360px with keyboard closing', async ({
  page,
}) => {
  await start(page);
  await page.getByRole('radio', { name: 'Dark theme', exact: true }).check();
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(card(page, 'tasks')).toHaveCSS('animation-duration', '0s');
  await page
    .getByRole('button', { name: 'Open Inbox widget', exact: true })
    .click();
  await expect(page.locator('[data-module-window="inbox"]')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator('#main-content').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-module-window]')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Open Inbox widget', exact: true }),
  ).toBeFocused();
  await page
    .getByRole('button', { name: 'Browse widgets', exact: true })
    .click();
  const library = page.getByRole('dialog', {
    name: 'Widget library',
    exact: true,
  });
  await expect(library).toHaveCSS('animation-duration', '0s');
  await page
    .getByRole('searchbox', { name: 'Find a widget', exact: true })
    .fill('unmatched widget');
  await expect(
    library.getByText('No widgets match.', { exact: false }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(library).toHaveCount(0);
});
