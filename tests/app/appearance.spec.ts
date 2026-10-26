import { test, expect, signIn } from '../fixtures';
import { formatDate } from '@/lib/date';

test.use({ viewport: { width: 390, height: 844 } });

test('every plan picks an accent colour; themes are PRO only', async ({ page, user, admin }) => {
  await signIn(page, user);
  await page.goto('/settings');
  const html = page.locator('html');

  await page.getByRole('radio', { name: 'Ungu' }).click();
  await expect(html).toHaveAttribute('data-accent', 'violet');
  await page.reload();
  await expect(html).toHaveAttribute('data-accent', 'violet');

  // FREE: the PRO themes are locked.
  const soft = page.getByRole('radio', { name: /^Lembut/ });
  await expect(soft).toHaveAttribute('aria-disabled', 'true');
  await soft.click({ force: true });
  await expect(html).not.toHaveAttribute('data-style', /.+/);

  // PRO can pick one; it goes away again when PRO ends.
  await admin.from('profiles').update({ plan: 'PRO' }).eq('id', user.id);
  await page.reload();
  await page.getByRole('radio', { name: /^Lembut/ }).click();
  await expect(html).toHaveAttribute('data-style', 'soft');
  await admin.from('profiles').update({ plan: 'FREE' }).eq('id', user.id);
  await page.reload();
  await expect(html).not.toHaveAttribute('data-style', /.+/);
  await expect(html).toHaveAttribute('data-accent', 'violet');
});

test('the Islami and Kartun themes change more than colours', async ({ page, user, admin }) => {
  await admin.from('profiles').update({ plan: 'PRO' }).eq('id', user.id);
  await signIn(page, user);
  await page.goto('/settings');
  await page.getByRole('radio', { name: /^Islami/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-style', 'islamic');
  await expect(page.getByText('Tema ini memakai warnanya sendiri.', { exact: false })).toBeVisible();

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Assalamu'alaikum, Uji");

  await page.goto('/settings');
  await page.getByRole('radio', { name: /^Kartun/ }).click();
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Halo, Uji');
});

test("savings left out of the daily allowance don't count as spending money", async ({ page, user, admin }) => {
  const month = formatDate(new Date()).slice(0, 7);
  const { data: savings } = await admin
    .from('categories')
    .insert({ user_id: user.id, name: 'Tabungan', type: 'expense', color: '#22c55e', icon: 'PiggyBank', daily_allowance: false })
    .select('id')
    .single();
  const { data: budget } = await admin
    .from('budgets')
    .insert({ user_id: user.id, month, total_amount: 1000000 })
    .select('id')
    .single();
  await admin.from('budget_items').insert([
    { budget_id: budget!.id, category_id: user.categoryId, amount: 300000 },
    { budget_id: budget!.id, category_id: savings!.id, amount: 700000 },
  ]);

  await signIn(page, user);
  const hero = page.locator('section').filter({ hasText: 'Saldo total' });
  await expect(hero.getByText(/Sisa belanja Rp\s300\.000 untuk \d+ hari lagi/)).toBeVisible({ timeout: 15_000 });

  // Turning it back on in Settings puts the savings budget into the allowance.
  await page.goto('/settings');
  await page.getByText('Di luar jatah harian').locator('xpath=ancestor::div[contains(@class,"border")][1]').getByRole('button').first().click();
  const dialog = page.getByRole('dialog', { name: 'Edit kategori' });
  await dialog.getByRole('switch').click();
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(page.getByText('Kategori tersimpan').first()).toBeVisible();
  await page.goto('/dashboard');
  await expect(hero.getByText(/Sisa belanja Rp\s1\.000\.000 untuk \d+ hari lagi/)).toBeVisible({ timeout: 15_000 });
});
