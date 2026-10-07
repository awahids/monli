import { test, expect } from '@playwright/test';

test('landing page shows the hero and sign-up CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Atur bulanan');
  await expect(page.getByRole('link', { name: /Mulai gratis/ }).first()).toHaveAttribute('href', '/auth/sign-up');
});
