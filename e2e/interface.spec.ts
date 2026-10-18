import { test, expect } from '@playwright/test';
import { enterWorkspace } from './startup-helper';

test('UX / ONB: neutral survey reveals questions, preserves answers and follows native scrolling', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));
  await page.goto('/');
  await expect(page.locator('[data-startup-survey]')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
  const begin = page.getByRole('button', { name: 'Begin survey', exact: true });
  await expect(begin).toHaveCSS('background-color', 'rgb(0, 102, 204)');
  const frames = await begin.evaluate(async (button) => {
    const opacity: number[] = [];
    (button as HTMLButtonElement).click();
    for (let i = 0; i < 24; i++) {
      await new Promise(requestAnimationFrame);
      const body = document.querySelector('[data-survey-body]');
      if (body) opacity.push(Number(getComputedStyle(body).opacity));
    }
    return opacity;
  });
  expect(frames.some((value) => value > 0 && value < 1)).toBe(true);
  expect(frames.at(-1)).toBe(1);
  await expect(page.locator('[data-survey-active="true"]')).toHaveCount(1);
  await expect(page.locator('[data-survey-active="true"] h1')).toBeFocused();
  await page.getByRole('radio', { name: 'Monthly', exact: true }).check();
  await expect(
    page.getByRole('radio', { name: 'Monthly', exact: true }).locator('..'),
  ).toHaveCSS('background-color', 'rgb(232, 240, 252)');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Net income per pay period after taxes').fill('2500');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel('Next deposit date')).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(
    page.getByLabel('Net income per pay period after taxes'),
  ).toHaveValue(/2[,.]?500/);
  const active = page.locator('[data-survey-active="true"]');
  await expect(active.locator('[data-survey-body]')).toHaveCSS(
    'animation-duration',
    '0.25s',
  );
  // A native wheel gesture returns to the welcome without any delayed snap.
  await page.mouse.move(1100, 600);
  await page.mouse.wheel(0, -10000);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(page.getByAltText(/Renaissance-style painting/)).toBeVisible();
  await enterWorkspace(page);
  await expect(page.locator('#main-content')).toBeFocused();
  expect(errors).toEqual([]);
});

test('UX: app uses neutral chrome, consistent icons and finite transitions, with instant reduced-motion navigation', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await enterWorkspace(page);
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(245, 245, 247)',
  );
  const selected = page.getByRole('link', { name: 'Briefing', exact: true });
  await expect(selected).toHaveCSS('background-color', 'rgb(232, 240, 252)');
  await expect(selected.locator('svg')).toHaveCount(1);
  await page.getByRole('link', { name: 'Financial Core', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Financial core', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#main-content > section').first()).toHaveCSS(
    'animation-duration',
    '0.25s',
  );
  await expect(page.locator('#main-content')).toBeFocused();
  await page.getByRole('button', { name: /Command.*Ctrl/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveCSS('animation-duration', '0.25s');
  expect(
    await dialog.evaluate((node) => node.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: /Command.*Ctrl/ }),
  ).toBeFocused();
  await page.getByRole('radio', { name: 'Dark theme', exact: true }).check();
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(20, 20, 22)',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('link', { name: 'Briefing', exact: true }).click();
  await expect(page.locator('#main-content > section').first()).toHaveCSS(
    'animation-duration',
    '0s',
  );
  const panels = page.locator('[data-briefing-sections] > section');
  await expect(panels.nth(1)).toHaveCSS('animation-delay', '0s');
  await expect(panels.first()).toHaveCSS('animation-duration', '0s');
  await page.keyboard.press('Control+j');
  await expect(dialog).toHaveCSS('animation-duration', '0s');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 360, height: 800 });
  await page.getByRole('button', { name: 'Pages', exact: true }).click();
  await page.getByRole('link', { name: 'Add new', exact: true }).click();
  await expect(page.getByLabel('Entry title')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  const painting = page.getByAltText(/Renaissance-style painting/);
  await expect(painting).toHaveCSS('clip-path', 'inset(0% 0px 0px)');
  await expect(page.locator('[data-startup-survey]')).toHaveCSS(
    'background-color',
    'rgb(28, 28, 30)',
  );
  await page
    .getByRole('button', { name: 'Review my answers', exact: true })
    .click();
  await expect(page.locator('[data-survey-active="true"]')).toHaveCount(1);
  await expect(page.locator('[data-survey-body]')).toHaveCSS(
    'animation-duration',
    '0s',
  );
  await expect(painting).toHaveCSS('transition-duration', '0s');
  expect(errors).toEqual([]);
});
