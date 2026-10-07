import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

async function addWithPlusButton(page: import('@playwright/test').Page, amount: string) {
  await page.getByRole('button', { name: 'Catat transaksi' }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Nominal').fill(amount);
  await form.getByRole('button', { name: 'Makan' }).click();
  await form.getByRole('button', { name: 'Dompet' }).click();
  await form.getByRole('button', { name: 'Simpan' }).click();
  await expect(page.getByText('Transaksi tersimpan')).toBeVisible();
}

test('totals on the open page follow a transaction added with the + button', async ({ page, user, admin }) => {
  await admin.from('budgets').insert({ user_id: user.id, month: today().slice(0, 7), total_amount: 1000000 });
  await signIn(page, user);

  // Opened directly, so the form must load accounts and categories itself.
  await page.goto('/budgets');
  await expect(page.getByText('Sisa Rp 1.000.000')).toBeVisible();
  await addWithPlusButton(page, '25000');
  await expect(page.getByText('Sisa Rp 975.000')).toBeVisible();

  await page.goto('/accounts');
  await expect(page.getByText('Rp 475.000').first()).toBeVisible();
  await addWithPlusButton(page, '25000');
  await expect(page.getByText('Rp 450.000').first()).toBeVisible();

  await page.goto('/transactions');
  await expect(page.getByText('Rp 50.000').first()).toBeVisible();
  await addWithPlusButton(page, '25000');
  await expect(page.getByText('Rp 75.000').first()).toBeVisible();
});

test('budget total follows its category limits', async ({ page, user, admin }) => {
  await admin.from('profiles').update({ plan: 'PRO' }).eq('id', user.id);
  const { data: budget } = await admin
    .from('budgets')
    .insert({ user_id: user.id, month: today().slice(0, 7), total_amount: 600000 })
    .select('id')
    .single();
  // 500.000 for Makan plus a 100.000 buffer outside categories.
  await admin.from('budget_items').insert({ budget_id: budget!.id, category_id: user.categoryId, amount: 500000 });
  await signIn(page, user);

  await page.goto('/budgets');
  await page.getByRole('button', { name: /Lihat detail budget/ }).click();
  const detail = page.getByRole('dialog');
  await expect(detail.getByText('Terpakai Rp 0 dari Rp 600.000')).toBeVisible();
  await detail.getByRole('button', { name: 'Atur kategori' }).click();
  await detail.getByLabel('Batas Makan').fill('700000');
  await detail.getByLabel('Batas Makan').blur();
  await expect(detail.getByText('Terpakai Rp 0 dari Rp 800.000')).toBeVisible();
  await expect
    .poll(async () => Number((await admin.from('budgets').select('total_amount').eq('id', budget!.id).single()).data?.total_amount))
    .toBe(800000);
});

test('totals count every transaction, not just the first 1000', async ({ page, user, admin }) => {
  const day = today();
  const month = day.slice(0, 7);
  const rows = Array.from({ length: 1100 }, () => ({
    user_id: user.id,
    type: 'expense',
    amount: 1000,
    account_id: user.accountId,
    category_id: user.categoryId,
    actual_date: day,
    date: day,
    budget_month: month,
  }));
  expect((await admin.from('transactions').insert(rows)).error).toBeNull();
  await admin.from('budgets').insert({ user_id: user.id, month, total_amount: 5000000 });
  await signIn(page, user);

  const get = async (url: string) => (await page.request.get(url)).json();
  const expected = 1100 * 1000;
  expect((await get('/api/budgets?year=all')).data[0].actual).toBe(expected);
  expect((await get(`/api/dashboard?month=${month}`)).budget.totalActual).toBe(expected);
  expect((await get(`/api/reports/monthly?month=${month}`)).totalActual).toBe(expected);
  const year = (await get(`/api/reports/income-expense?year=${month.slice(0, 4)}`)).data;
  expect(year.find((m: { month: string }) => m.month === month).expense).toBe(expected);
  expect((await get(`/api/reports/trend?from=${month}&to=${month}`)).data[0].expense).toBe(expected);
  expect((await get(`/api/transactions?summary=1&from=${month}-01&to=${day}`)).summary.expense).toBe(expected);
});
