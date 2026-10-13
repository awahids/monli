import { test, expect } from '@playwright/test';

test('landing page shows the hero and sign-up CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Atur bulanan');
  await expect(page.getByRole('link', { name: /Coba gratis 14 hari/ }).first()).toHaveAttribute('href', '/auth/sign-up');
});

test('landing page tells search engines what it is', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Aplikasi Catat Keuangan/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /gratis 14 hari/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://monli.fun');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://monli.fun');
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '[]');
  const faq = ld.find((x: { '@type': string }) => x['@type'] === 'FAQPage');
  expect(faq.mainEntity.length).toBeGreaterThan(5);
});
