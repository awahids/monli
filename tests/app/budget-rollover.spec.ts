import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
const shift = (month: string, by: number) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + by, 1)).toISOString().slice(0, 7);
};

test('leftover budget carries into the next period', async ({ page, user, admin }) => {
  // PRO: FREE accounts are limited to two budgets.
  await admin.from('profiles').update({ plan: 'PRO' }).eq('id', user.id);
  const month = today().slice(0, 7);
  const [twoAgo, prev, next] = [shift(month, -2), shift(month, -1), shift(month, 1)];
  const inserted = await admin.from('budgets').insert([
    { user_id: user.id, month: twoAgo, total_amount: 200000, rollover: true },
    { user_id: user.id, month: prev, total_amount: 1000000, rollover: true },
    { user_id: user.id, month, total_amount: 500000, rollover: false },
  ]);
  expect(inserted.error).toBeNull();
  const date = `${prev}-10`;
  await admin.from('transactions').insert({
    user_id: user.id,
    type: 'expense',
    amount: 300000,
    account_id: user.accountId,
    category_id: user.categoryId,
    actual_date: date,
    date,
    budget_month: prev,
  });
  // 500.000 + (1.000.000 + 200.000 carried from two periods ago − 300.000 spent).
  await signIn(page, user);
  await page.goto('/budgets');
  await expect(page.getByText('Sisa Rp 1.400.000')).toBeVisible();

  await page.getByRole('button', { name: `Lihat detail budget ${month}` }).click();
  const detail = page.getByRole('dialog');
  await expect(detail.getByText('termasuk sisa Rp 900.000 dari periode lalu')).toBeVisible();
  const toggle = detail.getByRole('switch', { name: /Bawa sisa ke periode berikutnya/ });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked();
  const rollover = async (m: string) =>
    (await admin.from('budgets').select('rollover').eq('user_id', user.id).eq('month', m).single()).data?.rollover;
  await expect.poll(() => rollover(month)).toBe(true);

  // The next period's new budget keeps the choice.
  const res = await page.request.post('/api/budgets', { data: { month: next, totalAmount: 100000, items: [] } });
  expect(res.ok()).toBeTruthy();
  expect(await rollover(next)).toBe(true);

  await page.goto('/dashboard');
  await expect(page.getByText('Rp 1.400.000').first()).toBeVisible();
});
