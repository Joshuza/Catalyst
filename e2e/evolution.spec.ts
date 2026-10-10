import { test, expect, type Page } from '@playwright/test';
async function open(page: Page) {
  await page.goto('/#profile');
  await page.getByRole('button', { name: 'Skip all and start' }).click();
  await expect(
    page.getByRole('button', { name: 'Save preferences', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Current liquid savings').fill('12000');
  await page
    .getByRole('button', { name: 'Save preferences', exact: true })
    .click();
  await expect(page.getByText('Record saved', { exact: true })).toBeVisible();
}
async function go(page: Page, name: string) {
  await page.getByRole('link', { name, exact: true }).click();
  if (name === 'Financial Core')
    await expect(
      page.getByRole('heading', { name: 'Financial core', exact: true }),
    ).toBeVisible();
}
test('Gemini research and goals: visual capture, local tags, cart link, search and honest reservations', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page);
  await go(page, 'Research vault');
  await page
    .getByLabel('Research title', { exact: true })
    .fill('Camera field notes');
  await page
    .getByLabel('Idea, quote or notes')
    .fill('Camera lens for outdoor photography');
  await page.getByLabel('Research estimated cost').fill('300');
  await page.getByLabel('Research image', { exact: true }).setInputFiles({
    name: 'sample.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCisAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await page
    .getByRole('button', { name: 'Save research', exact: true })
    .click();
  await expect(
    page.getByRole('img', { name: 'Camera field notes', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Plan purchase \$300/ }).click();
  await expect(
    page.getByText('Linked to your cart', { exact: true }),
  ).toBeVisible();
  await go(page, 'Financial Core');
  await expect(
    page.getByText('Camera field notes', { exact: true }),
  ).toBeVisible();
  await go(page, 'Savings goals');
  await page.getByLabel('Goal name').fill('Emergency savings');
  await page.getByLabel('Goal target').fill('5000');
  await page.getByLabel('Reserve now').fill('1000');
  await page.getByRole('button', { name: 'Save goal', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Emergency savings', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('$11,000.00', { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Emergency savings', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Control+k');
  await page.getByRole('searchbox').fill('photography');
  await page
    .getByRole('button', { name: /Camera field notes research/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Research vault', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test('Gemini habits, health and audio: persisted check-ins, recurring care and context matching', async ({
  page,
}) => {
  await open(page);
  await go(page, 'Habits & streaks');
  await page.getByLabel('Habit name').fill('Evening reset');
  await page.getByRole('button', { name: 'Save habit', exact: true }).click();
  await page
    .getByRole('button', { name: 'Check in today', exact: true })
    .click();
  await expect(page.getByText('1 day streak', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('1 day streak', { exact: true })).toBeVisible();
  await go(page, 'Health & care');
  await page.getByLabel('Care title').fill('Dental cleaning');
  await page.getByLabel('Care category').selectOption('Dental');
  await page.getByLabel('Repeat after months').fill('6');
  await page
    .getByRole('button', { name: 'Save care reminder', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Add calendar reminder', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'View in Calendar', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Mark completed', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Dental cleaning', exact: true }),
  ).toHaveCount(2);
  await go(page, 'Listen');
  await page.getByLabel('Audio title').fill('Quiet study playlist');
  await page.getByLabel('Audio link').fill('https://example.com/study');
  await page.getByLabel('Best for').selectOption('Deep work');
  await page.getByRole('button', { name: 'Save audio', exact: true }).click();
  await page.getByLabel('Listening context').selectOption('Chores');
  await expect(
    page.getByRole('link', { name: 'Quiet study playlist' }),
  ).toHaveCount(0);
  await page.getByLabel('Listening context').selectOption('Deep work');
  await expect(
    page.getByRole('link', { name: 'Quiet study playlist' }),
  ).toBeVisible();
});
test('Gemini itinerary: original ticket reminder links calendar and planned financial cost atomically', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page);
  await go(page, 'Itineraries & tickets');
  await page.getByLabel('Itinerary name').fill('Weekend conference');
  await page
    .getByRole('button', { name: 'Create itinerary', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Add stop or ticket', exact: true })
    .click();
  const modal = page.getByRole('dialog', {
    name: 'Add stop to Weekend conference',
  });
  await modal.getByLabel('Stop or ticket title').fill('Conference entry');
  await modal.getByLabel('Stop start time').fill('18:00');
  await modal.getByLabel('Confirmation reference').fill('USER-REF-123');
  await modal
    .getByLabel('Original ticket link')
    .fill('https://example.com/original-ticket');
  await modal.getByLabel('Future ticket cost').fill('50');
  await modal
    .getByRole('button', { name: 'Add stop to itinerary', exact: true })
    .click();
  await expect(modal).not.toBeVisible();
  await expect(
    page.getByRole('article', { name: 'Ticket reminder for Conference entry' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Open original ticket' }),
  ).toHaveAttribute('href', 'https://example.com/original-ticket');
  await go(page, 'Financial Core');
  await expect(
    page.getByText('Conference entry', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await go(page, 'Itineraries & tickets');
  await expect(page.getByText('USER-REF-123')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Gemini subscription history: cleared bill, anchored renewal, actual cash flow, audit export and undo', async ({
  page,
}) => {
  await open(page);
  await go(page, 'Financial Core');
  await page.getByText('Add subscription or trial', { exact: true }).click();
  await page
    .getByLabel('Subscription name', { exact: true })
    .fill('Studio membership');
  await page.getByLabel('Subscription charge', { exact: true }).fill('12');
  await page
    .getByRole('button', { name: 'Save subscription', exact: true })
    .click();
  await expect(
    page.getByText('Studio membership', { exact: true }),
  ).toBeVisible();
  await page.getByText('Log cleared charge', { exact: true }).click();
  await page.getByLabel('Final charge for Studio membership').fill('13.20');
  await page
    .getByRole('button', { name: 'Record cleared charge', exact: true })
    .click();
  await expect(
    page.getByText('1 logged bills. Included in expense exports.'),
  ).toBeVisible();
  await expect(
    page
      .getByText('Cleared balance', { exact: true })
      .locator('..')
      .getByText('$11,986.80', { exact: true }),
  ).toBeVisible();
  await go(page, 'Receipts & reports');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  const file = await download;
  const stream = await file.createReadStream();
  if (!stream) throw new Error('No report stream');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString('utf8');
  expect(csv).toContain('Studio membership');
  expect(csv).toContain('Subscription');
  expect(csv).toContain('13.20');
  await page.keyboard.press('Control+z');
  await go(page, 'Financial Core');
  await expect(
    page
      .getByLabel("Today's balances")
      .getByText('$12,000.00', { exact: true })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByText('1 logged bills. Included in expense exports.'),
  ).toHaveCount(0);
});

test('BRF / UX-02: focus suppresses reading, collapses the inbox, keeps pinned sections, and saves its calendar block', async ({
  page,
}) => {
  await open(page);
  await go(page, 'Briefing');
  const finance = page
    .getByRole('heading', { name: 'Financial velocity', exact: true })
    .locator('..');
  await finance
    .getByRole('button', { name: 'Pin section', exact: true })
    .click();
  await expect(
    finance.getByRole('button', { name: 'Unpin section', exact: true }),
  ).toBeVisible();
  await expect(
    finance.getByRole('button', { name: 'Hide section', exact: true }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Start deep work', exact: true })
    .click();
  await page.getByRole('button', { name: 'Begin focus', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Room for focused work.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Three things to read', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Inbox, quietly', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'End deep work', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'End deep work', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Three things to read', exact: true }),
  ).toBeVisible();
  await go(page, 'Calendar');
  await expect(
    page.getByRole('button', { name: /Deep work/ }).first(),
  ).toBeVisible();
});

test('RST-04: weekly alignment proposes and schedules a draft only after approval', async ({
  page,
}) => {
  await open(page);
  await go(page, 'Tasks');
  await page
    .getByLabel('New task title', { exact: true })
    .fill('Outline next week');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Outline next week', exact: true }),
  ).toBeVisible();
  await go(page, 'Weekly reset');
  await page.getByRole('button', { name: 'Skip step', exact: true }).click();
  await page.getByRole('button', { name: 'Skip step', exact: true }).click();
  await expect(
    page.getByLabel('Weekly day for Outline next week'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Approve weekly draft', exact: true })
    .click();
  await expect(
    page.getByText('Approved task blocks are now on the calendar.'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Review Calendar', exact: true })
    .click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Working week', exact: true }).click();
  await expect(
    page.getByRole('button', { name: /Outline next week/ }).first(),
  ).toBeVisible();
});
