import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

test('split a bill: my share is spending, friends owe the rest', async ({ page, user, admin }) => {
  await signIn(page, user);
  await page.goto('/transactions');
  await page.getByRole('button', { name: 'Bagi tagihan' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Dibayar dari')).toHaveValue(user.accountId);
  await dialog.getByLabel('Total tagihan').fill('300000');
  await dialog.getByLabel('Catatan').fill('Makan bareng');
  await dialog.getByRole('button', { name: 'Teman' }).click();
  await dialog.getByLabel('Kategori bagian 1').selectOption({ label: 'Makan' });
  await dialog.getByLabel('Nama teman 2').fill('Budi');
  await dialog.getByLabel('Nama teman 3').fill('Ani');
  await expect(dialog.getByRole('status')).toHaveText('Belum dibagi Rp 300.000');
  await dialog.getByRole('button', { name: 'Bagi rata' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Pas dengan total.');
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(page.getByText('Tersimpan, 2 piutang dicatat')).toBeVisible({ timeout: 15_000 });

  // The account paid the whole bill; only my share is an expense.
  const { data: account } = await admin.from('accounts').select('current_balance').eq('id', user.accountId).single();
  expect(Number(account?.current_balance)).toBe(200000);
  const { data: txs } = await admin.from('transactions').select('type, amount, note').eq('user_id', user.id);
  expect(txs?.map((t) => [t.type, Number(t.amount), t.note])).toEqual([['expense', 100000, 'Makan bareng']]);
  const { data: debts } = await admin.from('debts').select('kind, person, amount').eq('user_id', user.id).order('person');
  expect(debts?.map((d) => [d.kind, d.person, Number(d.amount)])).toEqual([
    ['receivable', 'Ani', 100000],
    ['receivable', 'Budi', 100000],
  ]);
  await expect(page.getByRole('button', { name: /Makan bareng/ })).toBeVisible();
});
