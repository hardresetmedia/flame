// End-to-end smoke tests: boots the real server + built client and walks the
// critical paths (home render, login, app creation → home grid). This is the
// safety net for the client toolchain migration — keep it green.
//
// All e2e specs share ONE server + SQLite DB (single Playwright webServer),
// and Playwright runs files alphabetically. This file is prefixed "0-" so it
// runs first, while the DB is still empty — its welcome-message test depends
// on that. Later specs (1-profiles) seed their own data.
import { test, expect } from '@playwright/test';

const PASSWORD = 'e2e-password-123';

test('home page boots with the default title and welcome message', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Flame');
  // Fresh install, anonymous visitor, nothing pinned → onboarding message.
  await expect(page.getByText('Welcome to Flame!')).toBeVisible();
});

test('settings login form authenticates through the UI', async ({ page }) => {
  await page.goto('/settings/app');

  await page.locator('#password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByText('You are logged in')).toBeVisible();
});

test('every settings tab renders content after login', async ({ page }) => {
  await page.goto('/settings/app');
  await page.locator('#password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('You are logged in')).toBeVisible();

  for (const tab of [
    'Theme',
    'General',
    'Interface',
    'Weather',
    'Docker',
    'CSS',
    'App',
  ]) {
    await page.getByRole('link', { name: tab, exact: true }).click();
    // the settings content pane must render something for every tab
    await expect(page.locator('section > *').first()).toBeVisible();
  }
});

test('an app created via the API appears pinned on the home screen', async ({
  page,
  request,
}) => {
  const login = await request.post('/api/auth', {
    data: { password: PASSWORD, duration: '1h' },
  });
  expect(login.ok()).toBe(true);
  const { token } = (await login.json()).data;

  const created = await request.post('/api/apps', {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: 'SmokeApp', url: 'example.com' },
  });
  expect(created.status()).toBe(201);

  await page.goto('/');
  // pinAppsByDefault: true → the new app must show on the home grid.
  await expect(page.getByText('SmokeApp')).toBeVisible();

  const themeColor = await page.evaluate(() =>
    getComputedStyle(document.body).getPropertyValue('--color-background')
  );
  expect(themeColor.trim()).not.toBe('');
});
