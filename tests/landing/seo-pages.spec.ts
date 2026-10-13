import { test, expect } from '@playwright/test';

const faqSchema = async (page: import('@playwright/test').Page) => {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((b) => [JSON.parse(b)].flat()).find((x) => x['@type'] === 'FAQPage');
};

test('the zakat calculator works without signing in', async ({ page }) => {
  await page.goto('/kalkulator-zakat');
  await expect(page).toHaveURL(/\/kalkulator-zakat$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Kalkulator zakat penghasilan');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://monli.fun/kalkulator-zakat');
  await page.getByLabel('Penghasilan kotor per bulan').fill('20000000');
  await expect(page.getByTestId('income-zakat')).toHaveText(/Rp\s500\.000/);
  expect((await faqSchema(page)).mainEntity.length).toBeGreaterThan(3);
});

for (const [slug, heading] of [
  ['patungan', 'Patungan tanpa ribet'],
  ['hutang-piutang', 'Catatan hutang piutang'],
]) {
  test(`feature page /fitur/${slug}`, async ({ page }) => {
    await page.goto(`/fitur/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://monli.fun/fitur/${slug}`);
    await expect(page.getByRole('main').getByRole('img').first()).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: /Coba gratis 14 hari/ }).first()).toHaveAttribute('href', '/auth/sign-up');
    expect((await faqSchema(page)).mainEntity.length).toBeGreaterThan(2);
  });
}

test('sign-in and sign-up have their own titles', async ({ page }) => {
  await page.goto('/auth/sign-in');
  await expect(page).toHaveTitle('Masuk ke Qala Saku');
  await page.goto('/auth/sign-up');
  await expect(page).toHaveTitle(/Coba PRO gratis 14 hari/);
});

test('the income zakat guide states the BAZNAS nisab and calculates', async ({ page }) => {
  await page.goto('/panduan/cara-menghitung-zakat-penghasilan');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cara menghitung zakat penghasilan');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://monli.fun/panduan/cara-menghitung-zakat-penghasilan');
  await expect(page.getByRole('main')).toContainText(/Rp\s7\.640\.144 per bulan/);
  await page.getByLabel('Penghasilan kotor per bulan').fill('10000000');
  await expect(page.getByTestId('income-zakat')).toHaveText(/Rp\s250\.000/);
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = blocks.flatMap((b) => [JSON.parse(b)].flat()).map((x) => x['@type']);
  expect(types).toEqual(expect.arrayContaining(['Article', 'BreadcrumbList', 'FAQPage']));
});

test('the sitemap lists the public pages only', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const path of ['/kalkulator-zakat', '/panduan/cara-menghitung-zakat-penghasilan', '/fitur/patungan', '/fitur/hutang-piutang']) expect(xml).toContain(`https://monli.fun${path}`);
  expect(xml).not.toContain('/dashboard');
});
