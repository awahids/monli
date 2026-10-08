import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

test('Beranda: balance hero, hide amounts, quick actions', async ({ page, user, admin }) => {
  await admin.from('profiles').update({ plan: 'PRO' }).eq('id', user.id);
  await signIn(page, user);

  // Opening "/" (the installed app's start page) lands on Beranda when signed in.
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard$/);

  const hero = page.locator('section').filter({ hasText: 'Saldo total' });
  await expect(hero.getByText('Rp 500.000')).toBeVisible();
  await expect(page.getByRole('link', { name: /Dompet Rp 500\.000/ })).toBeVisible();

  // Hiding amounts covers the hero and the account cards, and is remembered.
  await page.getByRole('button', { name: 'Sembunyikan saldo' }).click();
  await expect(hero.getByText('Rp 500.000')).toBeHidden();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Tampilkan saldo' })).toBeVisible();
  await expect(page.getByText('Rp 500.000')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tampilkan saldo' }).click();

  const actions = page.getByRole('navigation', { name: 'Aksi cepat' });
  await actions.getByRole('button', { name: 'Catat' }).click();
  await expect(page.getByRole('dialog', { name: 'Tambah transaksi' })).toBeVisible();
  await page.keyboard.press('Escape');

  await actions.getByRole('link', { name: 'Patungan' }).click();
  await expect(page.getByRole('dialog', { name: 'Bagi tagihan' })).toBeVisible();
  await expect(page).toHaveURL(/\/transactions$/);
  await page.keyboard.press('Escape');

  await page.goto('/dashboard');
  const chooser = page.waitForEvent('filechooser');
  await actions.getByRole('link', { name: 'Scan struk' }).click();
  await chooser;
});
