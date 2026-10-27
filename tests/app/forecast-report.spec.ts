import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

const tx = (userId: string, accountId: string, categoryId: string, date: string, month: string, type: string, amount: number, note = '') => ({
  user_id: userId,
  account_id: accountId,
  category_id: categoryId,
  type,
  amount,
  note,
  date,
  actual_date: date,
  budget_month: month,
});

test('PRO sees where the period is heading and which budget runs out first', async ({ page, user, admin }) => {
  await admin.from('profiles').update({ plan: 'PRO' }).eq('id', user.id);
  // 10 March: 10 days in, 100k spent (10k a day), 21 days to go.
  await page.clock.setFixedTime(new Date('2026-03-10T05:00:00Z'));
  const { error } = await admin.from('transactions').insert([
    tx(user.id, user.accountId, user.categoryId, '2026-03-02', '2026-03', 'expense', 40000),
    tx(user.id, user.accountId, user.categoryId, '2026-03-08', '2026-03', 'expense', 60000),
  ]);
  if (error) throw error;
  const { data: budget } = await admin.from('budgets').insert({ user_id: user.id, month: '2026-03', total_amount: 300000 }).select('id').single();
  await admin.from('budget_items').insert({ budget_id: budget!.id, category_id: user.categoryId, amount: 200000 });

  await signIn(page, user);
  const card = page.getByRole('region', { name: 'Prediksi akhir periode' });
  // 100k + 10k x 21 = 310k against a 300k budget.
  await expect(card.getByText(/Rp\s310\.000/)).toBeVisible({ timeout: 15_000 });
  await expect(card.getByText(/Diperkirakan melebihi budget Rp\s10\.000/)).toBeVisible();
  // Makan: 100k of 200k at 10k a day runs out 10 days later.
  await expect(card.getByText('Budget Makan habis sekitar')).toBeVisible();
  await expect(card.getByText('20 Mar')).toBeVisible();
});

test('the monthly report sums up the period that just ended', async ({ page, user, admin }) => {
  await page.clock.setFixedTime(new Date('2026-04-03T05:00:00Z'));
  const { error } = await admin.from('transactions').insert([
    tx(user.id, user.accountId, user.categoryId, '2026-02-10', '2026-02', 'expense', 100000),
    tx(user.id, user.accountId, user.categoryId, '2026-03-01', '2026-03', 'income', 5000000, 'Gaji'),
    tx(user.id, user.accountId, user.categoryId, '2026-03-05', '2026-03', 'expense', 150000, 'Makan malam'),
    tx(user.id, user.accountId, user.categoryId, '2026-03-20', '2026-03', 'expense', 50000),
  ]);
  if (error) throw error;
  const { data: budget } = await admin.from('budgets').insert({ user_id: user.id, month: '2026-03', total_amount: 150000 }).select('id').single();
  await admin.from('budget_items').insert({ budget_id: budget!.id, category_id: user.categoryId, amount: 150000 });

  await signIn(page, user);
  await page.getByRole('link', { name: /Laporan Maret sudah siap/ }).click();
  await expect(page).toHaveURL(/\/reports\/monthly\?month=2026-03$/);
  await expect(page.getByRole('heading', { name: 'Laporan Maret 2026' })).toBeVisible();
  await expect(page.getByText('Berhasil disisihkan')).toBeVisible();
  await expect(page.getByText(/^Rp\s4\.800\.000$/)).toBeVisible();
  await expect(page.getByText('96% dari pemasukan')).toBeVisible();
  // Spending doubled from 100k in February.
  await expect(page.getByText('+100%').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Melewati budget' })).toBeVisible();
  await expect(page.getByText(/^\+Rp\s50\.000$/)).toBeVisible();
  await expect(page.getByText(/Makan malam/)).toBeVisible();

  // Dismissed once opened.
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /Laporan Maret sudah siap/ })).toHaveCount(0);
});
