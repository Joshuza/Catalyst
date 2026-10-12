import { expect, type Page } from '@playwright/test';
export async function enterWorkspace(page: Page) {
  await expect(page.locator('[data-startup-survey]')).toBeVisible();
  const saved = page.getByRole('button', {
    name: 'Continue with saved answers',
    exact: true,
  });
  if (await saved.count()) await saved.click();
  else
    await page
      .getByRole('button', { name: 'Skip all and start', exact: true })
      .click();
  await expect(
    page.getByRole('heading', {
      name: 'Initializing Catalyst Command Engine...',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('[data-startup-survey]')).toHaveCount(0, {
    timeout: 10000,
  });
}
