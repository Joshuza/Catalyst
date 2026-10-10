import { enterWorkspace } from './startup-helper';
import { expect, test, type Page } from '@playwright/test';
async function start(page: Page) {
  await page.goto('/#profile');
  await expect(
    page.getByRole('button', { name: 'Skip all and start' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Skip all and start' }).click();
  await expect(
    page.getByRole('button', { name: 'Save preferences', exact: true }),
  ).toBeVisible();
}
async function go(page: Page, name: string) {
  await page.getByRole('link', { name, exact: true }).click();
  if (name === 'Financial Core')
    await expect(
      page.getByRole('heading', { name: 'Financial core', exact: true }),
    ).toBeVisible();
}
async function income(page: Page) {
  await page.getByLabel('Net income per pay period after taxes').fill('4.5k');
  await page.getByLabel('Current liquid savings').fill('12000');
  await page
    .getByRole('button', { name: 'Save preferences', exact: true })
    .click();
  await expect(page.getByText('Record saved', { exact: true })).toBeVisible();
}
test('ONB / UX override: complete profile, real live pay graph, persisted preferences and left pages', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#profile');
  await page.getByRole('button', { name: 'Begin survey', exact: true }).click();
  await page.getByRole('radio', { name: 'Bi-Weekly', exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Net income per pay period after taxes').fill('4.5k');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Current liquid savings').fill('12000');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  for (let i = 0; i < 15; i++)
    await page
      .getByRole('button', { name: 'Skip this question', exact: true })
      .click();
  await page
    .getByRole('button', { name: 'Initialize my workspace', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Your preferences', exact: true }),
  ).toBeVisible();
  await go(page, 'Financial Core');
  await expect(
    page.getByRole('img', { name: /Financial projection/ }),
  ).toBeVisible();
  await go(page, 'Profile & preferences');
  await page.getByRole('radio', { name: 'Monthly', exact: true }).check();
  await page
    .getByRole('button', { name: 'Save preferences', exact: true })
    .click();
  await expect(page.getByText('Record saved', { exact: true })).toBeVisible();
  await page.reload();
  await enterWorkspace(page);
  await expect(
    page.getByRole('radio', { name: 'Monthly', exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole('link', { name: 'Pet Tracker', exact: true }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('FIN / SUR / TERM: plan, printer, immutable scenario, required survey and bought cash flow', async ({
  page,
}) => {
  await start(page);
  await income(page);
  await go(page, 'Financial Core');
  await page.getByLabel('Purchase name', { exact: true }).fill('Test keyboard');
  await page.getByLabel('Estimated cost').fill('150');
  const date = await page
    .getByLabel('Purchase date', { exact: true })
    .inputValue();
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Receipt printer' }),
  ).toBeVisible();
  await expect(
    page.getByRole('slider', { name: 'Move Test keyboard purchase date' }),
  ).toBeVisible();
  await page
    .getByRole('slider', { name: 'Move Test keyboard purchase date' })
    .focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByLabel('Date for Test keyboard')).not.toHaveValue(date);
  await page.keyboard.press('Control+z');
  await expect(page.getByLabel('Date for Test keyboard')).toHaveValue(date);
  await page.getByLabel('New scenario name').fill('Holiday');
  await page.getByRole('button', { name: 'Duplicate current plan' }).click();
  await expect(page.getByLabel('Scenario', { exact: true })).toHaveValue(
    'Holiday',
  );
  await page.keyboard.press('Control+j');
  const terminal = page.getByRole('dialog', { name: 'Command terminal' });
  await terminal
    .getByLabel('Command', { exact: true })
    .fill('I bought headphones $212.40 today');
  await terminal.getByRole('button', { name: 'Confirm command' }).click();
  await expect(
    terminal.getByRole('region', { name: 'Receipt printer' }),
  ).toBeVisible();
  await terminal
    .getByRole('button', { name: 'Return to financial core' })
    .click();
  await page.getByLabel('Scenario', { exact: true }).selectOption('Main');
  await page.getByLabel('Purchase name', { exact: true }).fill('Due purchase');
  await page.getByLabel('Estimated cost').fill('25');
  const today = new Date().toISOString().slice(0, 10);
  await page.getByLabel('Purchase date', { exact: true }).fill(today);
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  const survey = page.getByRole('dialog', {
    name: 'Post-purchase survey: Due purchase',
  });
  await expect(survey).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(survey).toBeVisible();
  await page.keyboard.press('Control+k');
  await expect(
    page.getByRole('dialog', { name: 'Search this device' }),
  ).toHaveCount(0);
  await survey
    .getByLabel('Did you purchase the scheduled item?')
    .selectOption('postponed');
  await survey.getByRole('button', { name: 'Save survey' }).click();
  await expect(survey).not.toBeVisible();
  await go(page, 'Notes & records');
  await page.keyboard.press('Control+k');
  await page.getByRole('searchbox').fill('headphones');
  await expect(
    page.getByRole('button', { name: /headphones.*212.40/ }),
  ).toBeVisible();
});
test('RCP: background multi-file PDF parsing, low-confidence review and safe report downloads', async ({
  page,
}) => {
  await start(page);
  await income(page);
  await go(page, 'Receipts & reports');
  await page
    .getByLabel('Receipt files')
    .setInputFiles([
      'src/fixtures/receipts/sample-receipt.pdf',
      'src/fixtures/receipts/sample-low-confidence.txt',
    ]);
  await expect(
    page.getByRole('heading', { name: /Review sample-receipt.pdf/ }),
  ).toBeVisible({ timeout: 15000 });
  const review = page
    .getByRole('heading', { name: /Review sample-receipt.pdf/ })
    .locator('..');
  await expect(review.getByLabel('Receipt total')).toHaveValue('212.4');
  await expect(review.getByLabel('Receipt tax')).toHaveValue('16.4');
  await review
    .getByRole('button', { name: 'Accept receipt', exact: true })
    .click();
  await expect(page.getByText('Accepted', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Review sample-low-confidence.txt/ }),
  ).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('nexus-expenses.csv');
  const excel = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Excel', exact: true }).click();
  expect((await excel).suggestedFilename()).toBe('nexus-expenses.xlsx');
});
test('INB / TASK: two sorting corrections persist; selected task plan needs approval and fits the calendar', async ({
  page,
}) => {
  await start(page);
  await go(page, 'Inbox');
  for (let i = 0; i < 2; i++) {
    await page.getByLabel('Message sender').fill('Newsletter');
    await page.getByLabel('Message subject').fill(`50% off ${i}`);
    await page.getByLabel('Message body').fill('Unsubscribe');
    await page
      .getByRole('button', { name: 'Import message', exact: true })
      .click();
    await page.getByRole('button', { name: /3 · Promo/ }).click();
    const detail = page.locator('details').filter({
      has: page.getByText(`Unread · 50% off ${i} · Newsletter`, {
        exact: true,
      }),
    });
    await detail.locator('summary').click();
    if (i === 0) {
      await detail
        .getByRole('button', { name: 'Save to research vault', exact: true })
        .click();
      await go(page, 'Research vault');
      await expect(
        page.getByRole('heading', { name: '50% off 0', exact: true }),
      ).toBeVisible();
      await go(page, 'Inbox');
      await page.getByRole('button', { name: /3 · Promo/ }).click();
      await detail.locator('summary').click();
    }
    await detail
      .getByLabel(`Move 50% off ${i} to stream`)
      .selectOption('personal');
    await page.getByRole('button', { name: /2 · Personal/ }).click();
  }
  await page.reload();
  await enterWorkspace(page);
  await expect(
    page.getByText('Newsletter → personal · 2 corrections'),
  ).toBeVisible();
  await go(page, 'Tasks');
  await page.getByLabel('New task title').fill('History essay');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await page.getByLabel('Use Sample AI provider').check();
  await page.getByRole('button', { name: 'Small Steps', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Sample proposed plan' }),
  ).toBeVisible();
  await go(page, 'Calendar');
  await expect(page.getByText(/History essay:/)).toHaveCount(0);
  await go(page, 'Tasks');
  await page.getByLabel('Use Sample AI provider').check();
  await page.getByRole('button', { name: 'Small Steps', exact: true }).click();
  await page
    .getByRole('button', { name: 'Approve & schedule', exact: true })
    .click();
  await expect(
    page.getByText('Task plan approved', { exact: true }),
  ).toBeVisible();
  await go(page, 'Calendar');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(
    page.getByRole('button', { name: /History essay:/ }).first(),
  ).toBeVisible();
});
test('FOOD / TRN / OUT: pantry-aware groceries, hard walking filters, real outing and gear purchase', async ({
  page,
}) => {
  await page.goto('/#connections');
  await enterWorkspace(page);
  await page
    .getByRole('link', { name: 'Profile & preferences', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Commuter Trains', exact: true })
    .click();
  await page.getByRole('button', { name: 'Bicycle', exact: true }).click();
  await page.getByRole('button', { name: 'Gluten-Free', exact: true }).click();
  for (const activity of ['Hike', 'Bike ride', 'Run'])
    await page.getByRole('button', { name: activity, exact: true }).click();
  await income(page);
  await go(page, 'Connections & privacy');
  await page
    .getByRole('button', { name: 'Load product sample data', exact: true })
    .click();
  await expect(
    page.getByText(
      'Sample workspace loaded. Remove all Sample data from Notes & records when finished.',
    ),
  ).toBeVisible();
  await go(page, 'Recipes & groceries');
  await page
    .getByRole('button', { name: 'Sample: lentil & rice bowl', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Add to Grocery List', exact: true })
    .click();
  await expect(page.getByText('100 g rice', { exact: true })).toBeVisible();
  await go(page, 'Discovery & transit');
  await page
    .getByRole('button', { name: 'Sample: Garden bakery', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'train · 12 min' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'walk · 38 min' }),
  ).toHaveCount(0);
  await go(page, 'Outdoors & activities');
  await page
    .getByLabel('Outing date')
    .fill(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  await page
    .getByLabel('Allow an outing inside protected working hours')
    .check();
  await expect(
    page.getByRole('button', { name: 'Plan this outing', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Plan this outing', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Planned gear & sharing' }),
  ).toBeVisible();
  await expect(page.getByText(/Planned Sample: Ridge loop/)).toBeVisible();
  await page.getByLabel('Cost for Sunscreen').fill('15');
  await page.getByRole('button', { name: /Add gear to cart/ }).click();
  await go(page, 'Financial Core');
  await expect(page.getByText('Sunscreen', { exact: true })).toBeVisible();
});
test('PET / CRM / SCR / RST: maintenance records and a complete skippable weekly reset', async ({
  page,
}) => {
  await start(page);
  await page.getByLabel('Enable Pet Tracker').check();
  await page.getByLabel('Pet name', { exact: true }).fill('Milo');
  await page.getByLabel('Pet species', { exact: true }).fill('Dog');
  await page
    .getByRole('button', { name: 'Save preferences', exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: 'Pet Tracker', exact: true }),
  ).toBeVisible();
  await go(page, 'Pet Tracker');
  await page.getByLabel('Care reminder title').fill('Food restock');
  await page.getByLabel('Care category').selectOption('Food');
  await page.getByRole('button', { name: 'Save care reminder' }).click();
  await page.getByRole('button', { name: 'Add food to groceries' }).click();
  await go(page, 'People & relationships');
  await page.getByLabel('Contact name').fill('Sam');
  await page.getByRole('button', { name: 'Save contact', exact: true }).click();
  await page.getByRole('button', { name: 'Log check-in today' }).click();
  await expect(page.getByText('Sam', { exact: true })).toBeVisible();
  await go(page, 'Screen time');
  await page.getByLabel('Screen hours', { exact: true }).fill('4');
  await page.getByRole('button', { name: 'Save screen sample' }).click();
  await expect(page.getByText(/No reliable pattern yet/)).toBeVisible();
  await go(page, 'Weekly reset');
  await expect(page.getByText('Skipped setup questions:')).toBeVisible();
  await page
    .getByRole('button', { name: 'Complete step', exact: true })
    .click();
  await page.getByRole('button', { name: 'Skip step', exact: true }).click();
  await page.getByRole('button', { name: 'Finish reset', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Reset complete', exact: true }),
  ).toBeVisible();
  await page.reload();
  await enterWorkspace(page);
  await go(page, 'Notes & records');
  await page.keyboard.press('Control+k');
  await page.getByRole('searchbox').fill('Sam');
  await expect(page.getByRole('button', { name: /Sam contact/ })).toBeVisible();
});
