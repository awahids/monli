import { test, expect, signIn } from '../fixtures';
import { budgetPeriod, currentBudgetMonth, periodRange, shiftMonth } from '../../lib/date';

test.use({ viewport: { width: 390, height: 844 } });

test('a pay-day period (starts on the 26th) drives Beranda and Transaksi', async ({ page, user, admin }) => {
  await admin.from('profiles').update({ budget_start_day: 26 }).eq('id', user.id);
  const month = currentBudgetMonth(26);
  const { start } = budgetPeriod(month, 26);
  const prevEnd = budgetPeriod(shiftMonth(month, -1), 26).end;
  const row = (actual_date: string, budget_month: string, amount: number) => ({
    user_id: user.id, type: 'expense', amount, account_id: user.accountId, category_id: user.categoryId,
    actual_date, date: actual_date, budget_month,
  });
  // First day of this period (often still last calendar month) counts; the day before does not.
  await admin.from('transactions').insert([row(start, month, 11000), row(prevEnd, shiftMonth(month, -1), 7000)]);

  await signIn(page, user);
  await expect(page.getByText(`periode ${periodRange(month, 26)}`)).toBeVisible();
  await expect(page.getByText('Rp 11.000').first()).toBeVisible();

  await page.goto('/transactions');
  await expect(page.getByRole('button', { name: 'Periode ini' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(`Periode ${periodRange(month, 26)}`)).toBeVisible();
  await expect(page.getByText('Rp 11.000').first()).toBeVisible();
  await expect(page.getByText('Rp 7.000')).toHaveCount(0);
});

test('changing the start day moves automatic budget months only', async ({ page, user, admin }) => {
  const row = (note: string, actual_date: string, budget_month: string) => ({
    user_id: user.id, type: 'expense', amount: 5000, account_id: user.accountId, category_id: user.categoryId,
    actual_date, date: actual_date, budget_month, note,
  });
  await admin.from('transactions').insert([
    row('otomatis', '2026-09-27', '2026-09'), // start day 1: September; start day 26: October
    row('manual', '2026-09-27', '2026-11'), // moved by hand: stays
    row('awal bulan', '2026-09-03', '2026-09'), // September either way
  ]);
  await signIn(page, user);

  const res = await page.request.patch('/api/settings/profile', { data: { budgetStartDay: 26 } });
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).moved).toBe(1);

  const { data } = await admin.from('transactions').select('note, budget_month').eq('user_id', user.id).order('note');
  expect(data).toEqual([
    { note: 'awal bulan', budget_month: '2026-09' },
    { note: 'manual', budget_month: '2026-11' },
    { note: 'otomatis', budget_month: '2026-10' },
  ]);
});
