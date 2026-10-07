import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

test('search finds notes, tags, categories and amounts across all time', async ({ page, user, admin }) => {
  const { data: transport } = await admin
    .from('categories')
    .insert({ user_id: user.id, name: 'Transport', type: 'expense', color: '#0EA5E9', icon: 'Car' })
    .select('id')
    .single();
  const row = (note: string, amount: number, date: string, categoryId: string, tags: string[] = []) => ({
    user_id: user.id,
    type: 'expense',
    amount,
    note,
    tags,
    account_id: user.accountId,
    category_id: categoryId,
    actual_date: date,
    date,
    budget_month: date.slice(0, 7),
  });
  expect(
    (
      await admin.from('transactions').insert([
        row('Kopi kenangan', 18000, '2025-01-15', user.categoryId, ['ngopi']),
        row('Isi bensin', 50000, today(), transport!.id),
      ])
    ).error
  ).toBeNull();
  await signIn(page, user);

  await page.getByRole('link', { name: 'Cari transaksi' }).click();
  await expect(page).toHaveURL(/\/transactions\?search=/);
  const box = page.getByRole('textbox', { name: 'Cari transaksi' });
  await expect(box).toBeFocused();

  const expectOnly = async (query: string, shown: string, hidden: string) => {
    await box.fill(query);
    await expect(page.getByRole('button', { name: new RegExp(shown) })).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(hidden) })).toHaveCount(0);
  };
  // Last year's coffee is found although the default view is this period.
  await expectOnly('kopi', 'Kopi kenangan', 'Isi bensin');
  await expectOnly('ngopi', 'Kopi kenangan', 'Isi bensin');
  await expectOnly('transport', 'Isi bensin', 'Kopi kenangan');
  await expectOnly('50rb', 'Isi bensin', 'Kopi kenangan');
  await expectOnly('Rp 18.000', 'Kopi kenangan', 'Isi bensin');
});
