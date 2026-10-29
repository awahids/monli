import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

test('the weekly summary compares a week with the one before', async ({ page, user, admin }) => {
  const snacks = await admin
    .from('categories')
    .insert({ user_id: user.id, name: 'Jajan', type: 'expense', color: '#22C55E', icon: 'Coffee' })
    .select('id')
    .single();
  if (snacks.error) throw snacks.error;
  const tx = (date: string, amount: number, categoryId: string) => ({
    user_id: user.id,
    account_id: user.accountId,
    category_id: categoryId,
    type: 'expense',
    amount,
    note: '',
    date,
    actual_date: date,
    budget_month: date.slice(0, 7),
  });
  const { error } = await admin.from('transactions').insert([
    // Week of Monday 2 March: 200k on Makan.
    tx('2026-03-02', 200000, user.categoryId),
    // Week of Monday 9 March: 100k on Makan, 50k on Jajan.
    tx('2026-03-09', 100000, user.categoryId),
    tx('2026-03-14', 50000, snacks.data.id),
  ]);
  if (error) throw error;

  await signIn(page, user);
  await page.goto('/reports');
  await page.getByRole('link', { name: /Ringkasan mingguan/ }).click();
  await expect(page).toHaveURL(/\/reports\/weekly/);

  await page.goto('/reports/weekly?week=2026-03-11');
  await expect(page.getByText('9 Mar – 15 Mar 2026')).toBeVisible();
  await expect(page.getByText(/^Rp\s150\.000$/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/25% lebih hemat dari minggu lalu/)).toBeVisible();
  const rising = page.locator('section', { has: page.getByRole('heading', { name: 'Paling naik' }) });
  await expect(rising.getByText('Jajan')).toBeVisible();
  await expect(rising.getByText(/\+Rp\s50\.000/)).toBeVisible();
});
