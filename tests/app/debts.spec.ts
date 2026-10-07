import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

test('lending and repayments move the account balance, not income or expenses', async ({ page, user, admin }) => {
  const balance = async () =>
    Number((await admin.from('accounts').select('current_balance').eq('id', user.accountId).single()).data?.current_balance);
  expect(await balance()).toBe(500000);
  await signIn(page, user);
  await page.goto('/debts');

  await page.getByRole('button', { name: 'Tambah' }).click();
  const form = page.getByRole('dialog');
  await form.getByRole('radio', { name: 'Saya meminjamkan' }).click();
  await form.getByLabel('Dipinjam oleh').fill('Budi');
  await form.getByLabel('Nominal').fill('200000');
  await form.getByLabel('Uang keluar dari akun').selectOption({ label: 'Dompet' });
  await form.getByRole('button', { name: 'Simpan' }).click();
  await expect(page.getByText('Piutang dicatat')).toBeVisible();
  await expect(page.getByTestId('total-receivable')).toHaveText('Rp 200.000');
  expect(await balance()).toBe(300000);

  await page.getByRole('tab', { name: /Piutang/ }).click();
  await page.getByRole('button', { name: 'Terima pembayaran' }).click();
  const pay = page.getByRole('dialog');
  await expect(pay.getByLabel('Masuk ke akun')).toHaveValue(user.accountId);
  await pay.getByLabel('Nominal').fill('50000');
  await pay.getByRole('button', { name: 'Catat pembayaran' }).click();
  await expect(page.getByTestId('debt-remaining')).toHaveText('Rp 150.000');
  expect(await balance()).toBe(350000);

  // Paying more than what is left is refused.
  const over = await page.request.post(`/api/debts/${(await admin.from('debts').select('id').eq('user_id', user.id).single()).data!.id}/payments`, {
    data: { amount: 150001 },
  });
  expect(over.status()).toBe(400);

  // No transaction was created, so income and expenses are untouched.
  const { count } = await admin.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  expect(count).toBe(0);

  await page.getByRole('button', { name: 'Batalkan pembayaran' }).click();
  await expect(page.getByTestId('debt-remaining')).toHaveText('Rp 200.000');
  expect(await balance()).toBe(300000);

  await page.getByRole('button', { name: 'Opsi Budi' }).click();
  await page.getByRole('menuitem', { name: 'Hapus' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus' }).click();
  await expect(page.getByText('Belum ada hutang atau piutang')).toBeVisible();
  expect(await balance()).toBe(500000);
});

test('a record-only debt leaves balances alone', async ({ page, user, admin }) => {
  await signIn(page, user);
  await page.goto('/debts');
  await page.getByRole('button', { name: 'Tambah' }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Pinjam dari').fill('Ani');
  await form.getByLabel('Nominal').fill('1000000');
  await form.getByRole('button', { name: 'Simpan' }).click();
  await expect(page.getByTestId('total-payable')).toHaveText('Rp 1.000.000');
  await page.getByRole('button', { name: 'Bayar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Catat pembayaran' }).click();
  await expect(page.getByText('Lunas!')).toBeVisible();
  await expect(page.getByTestId('total-payable')).toHaveText('Rp 0');
  const { data } = await admin.from('accounts').select('current_balance').eq('id', user.accountId).single();
  expect(Number(data?.current_balance)).toBe(500000);
});
