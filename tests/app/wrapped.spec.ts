import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

test('the yearly summary shows the year in numbers', async ({ page, user, admin }) => {
  const year = new Date().getFullYear();
  const row = (type: string, amount: number, date: string, note: string, categoryId: string | null) => ({
    user_id: user.id,
    type,
    amount,
    note,
    account_id: user.accountId,
    category_id: categoryId,
    actual_date: date,
    date,
    budget_month: date.slice(0, 7),
  });
  expect(
    (
      await admin.from('transactions').insert([
        row('income', 1000000, `${year}-01-25`, 'Gaji', null),
        row('expense', 300000, `${year}-01-26`, 'Sepatu', user.categoryId),
        row('expense', 100000, `${year}-02-03`, 'Makan siang', user.categoryId),
      ])
    ).error
  ).toBeNull();
  await signIn(page, user);

  await page.getByRole('button', { name: 'Lainnya' }).click();
  await page.getByRole('link', { name: 'Ringkasan tahunan' }).click();
  await expect(page.getByText('3 transaksi')).toBeVisible();
  await expect(page.getByText('Kamu menyisihkan 60% dari pemasukan.')).toBeVisible();
  await expect(page.getByText('Paling banyak untuk')).toBeVisible();
  await expect(page.getByText('Februari', { exact: true })).toBeVisible();
  await expect(page.getByText('Sepatu ·')).toBeVisible();

  await page.getByRole('button', { name: String(year - 1) }).click();
  await expect(page.getByText(`Belum ada catatan di ${year - 1}`)).toBeVisible();
});
