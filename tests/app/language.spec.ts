import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

test('the app switches between Indonesian and English', async ({ page, user }) => {
  await signIn(page, user);
  await page.goto('/settings');
  await page.getByRole('combobox', { name: 'Bahasa' }).click();
  await page.getByRole('option', { name: 'English' }).click();

  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Transactions', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');

  await page.goto('/settings');
  await page.getByRole('combobox', { name: 'Language' }).click();
  await page.getByRole('option', { name: 'Bahasa Indonesia' }).click();
  await expect(page.getByRole('heading', { name: 'Pengaturan' })).toBeVisible();
});
