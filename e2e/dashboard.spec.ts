import { expect, test, type Page } from '@playwright/test';
import { enterWorkspace } from './startup-helper';

async function setup(page: Page) {
  await page.clock.setFixedTime(new Date('2026-01-01T12:00:00Z'));
  await page.goto('/#profile');
  await enterWorkspace(page);
  await page.getByRole('radio', { name: 'Weekly', exact: true }).check();
  await page.getByLabel('Net income per pay period after taxes').fill('1000');
  await page.getByLabel('Next deposit date').fill('2026-01-05');
  await page.getByLabel('Current liquid savings').fill('2000');
  await page
    .getByRole('button', { name: 'Save preferences', exact: true })
    .click();
  await expect(page.getByText('Record saved', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Briefing', exact: true }).click();
}
const series = (page: Page, key: string) =>
  page.locator(`path[data-series="${key}"]`);
async function paths(page: Page) {
  return Promise.all(
    ['baseline', 'cart', 'actual'].map((key) =>
      series(page, key).getAttribute('d'),
    ),
  );
}

test('FIN / BRF: squircle dashboard shows an event-only graph, keeps an unbought cart dotted, and reconciles a purchase once', async ({
  page,
}) => {
  // Exercise the complete ledger flow without waiting on decorative entrances;
  // normal-motion transitions are covered separately in interface.spec.ts.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await setup(page);
  await expect(page.locator('[data-briefing-sections] > section')).toHaveCount(
    3,
  );
  const finance = page
    .getByRole('heading', { name: 'Financial velocity', exact: true })
    .locator('..');
  await expect(finance).toHaveCSS('border-top-left-radius', '32px');
  await expect(
    page.getByRole('img', { name: /Financial projection/ }),
  ).toBeVisible();
  const before = await paths(page);
  expect(before[0]).toMatch(/ H[\d.]+ V[\d.]+/);
  expect(before[2]).not.toContain(' V');
  for (const path of before) expect(path).not.toContain('L');
  await page.getByRole('link', { name: 'Add new', exact: true }).click();
  await page.getByLabel('Entry title').fill('Camera lens');
  await page.getByLabel('Estimated cost', { exact: true }).fill('400');
  await page.getByLabel('Planned date').fill('2026-01-10');
  await page
    .getByRole('button', { name: 'Save purchase', exact: true })
    .click();
  await page.getByRole('link', { name: 'Briefing', exact: true }).click();
  const cart = page.getByLabel('Unbought cart, next 30 days');
  await expect(cart.getByText('$400.00', { exact: true })).toBeVisible();
  await expect(cart).toContainText('1 purchase not bought yet');
  const after = await paths(page);
  expect(after[0]).toBe(before[0]);
  expect(after[2]).toBe(before[2]);
  expect(after[1]).not.toBe(before[1]);
  const eventX = await page
    .getByRole('img', { name: /Financial projection/ })
    .evaluate((node) =>
      (
        50 +
        (9 / 29) * ((node as SVGSVGElement).viewBox.baseVal.width - 80)
      ).toFixed(2),
    );
  expect(after[1]).toContain(` H${eventX} V`); // Jan 10 at the current widget size, not an earlier interpolation.
  await expect(series(page, 'cart')).toHaveCSS('stroke-dasharray', '5px, 5px');
  await expect(series(page, 'cart')).toHaveCSS('transition-duration', '0s');
  const chart = page.getByRole('img', { name: /Financial projection/ });
  await chart.focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('status').filter({ hasText: /baseline.*cart.*actual/ }),
  ).toBeVisible();
  // Run each timer across the quiet interval, including the 30-second refresh,
  // rather than coalescing callbacks as if this tab had been suspended.
  await page.clock.runFor(31000);
  expect(await paths(page)).toEqual(after);
  await page.getByRole('link', { name: 'Add new', exact: true }).click();
  await page.getByRole('radio', { name: 'Note', exact: true }).check();
  await page.getByLabel('Entry title').fill('A nonfinancial thought');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await page.getByRole('link', { name: 'Briefing', exact: true }).click();
  expect(await paths(page)).toEqual(after);
  await page.getByRole('link', { name: 'Financial Core', exact: true }).click();
  const marker = page.getByRole('slider', {
    name: 'Move Camera lens purchase date',
    exact: true,
  });
  await marker.hover();
  const bounds = await marker.boundingBox();
  if (!bounds) throw new Error('Missing purchase marker.');
  const target = await page
    .getByRole('img', { name: /Financial projection/ })
    .evaluate((node) => {
      const matrix = (node as SVGSVGElement).getScreenCTM();
      if (!matrix) throw new Error('Missing graph transform.');
      const point = new DOMPoint(50 + (11 / 364) * 680, 100).matrixTransform(
        matrix,
      );
      return { x: point.x, y: point.y };
    });
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 4 });
  await page.mouse.up();
  await expect(page.getByLabel('Date for Camera lens')).toHaveValue(
    '2026-01-12',
  );
  await page.getByLabel('Date for Camera lens').fill('2026-01-01');
  const survey = page.getByRole('dialog', {
    name: 'Post-purchase survey: Camera lens',
  });
  await expect(survey).toBeVisible();
  await survey
    .getByLabel('Final exact cost including tax and shipping')
    .fill('410');
  await survey
    .getByRole('button', { name: 'Save survey', exact: true })
    .click();
  await expect(survey).toHaveCount(0, { timeout: 6000 });
  await page.getByRole('link', { name: 'Briefing', exact: true }).click();
  await expect(cart).toContainText('0 purchases not bought yet');
  await expect(finance.getByText('$1,590.00', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Customize dashboard', exact: true })
    .click();
  await finance
    .getByRole('button', { name: 'More detail', exact: true })
    .click();
  await expect(finance.locator('[data-money-expanded]')).toHaveAttribute(
    'data-money-expanded',
    'true',
  );
  await finance
    .getByRole('button', { name: 'Less detail', exact: true })
    .click();
  await expect(finance.locator('[data-money-expanded]')).toHaveAttribute(
    'data-money-expanded',
    'false',
  );
  expect((await paths(page))[0]).toBe(before[0]);
  expect((await paths(page))[2]).not.toBe(before[2]);
  await page.reload();
  await enterWorkspace(page);
  await expect(cart).toContainText('0 purchases not bought yet');
  await expect(finance.getByText('$1,590.00', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('BRF / UX: dashboard widgets remain readable in dark mode and at 360px with reduced motion', async ({
  page,
}) => {
  await setup(page);
  await page.getByRole('radio', { name: 'Dark theme', exact: true }).check();
  const finance = page
    .getByRole('heading', { name: 'Financial velocity', exact: true })
    .locator('..');
  await expect(finance).toHaveCSS('background-color', 'rgb(34, 34, 37)');
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(finance).toHaveCSS('border-top-left-radius', '24px');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await finance.boundingBox())?.width).toBeGreaterThan(280);
  await expect(
    page.getByRole('img', { name: /Financial projection/ }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'More for today', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Three things to read', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Keep it simple', exact: true })
    .click();
  await expect(page.locator('[data-briefing-sections] > section')).toHaveCount(
    3,
  );
});
