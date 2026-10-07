import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

test('add, edit and delete a transaction', async ({ page, user, admin }) => {
  await signIn(page, user);
  await page.goto('/transactions');

  // Add from the + button in the bottom bar.
  await page.getByRole('button', { name: 'Catat transaksi' }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Nominal').fill('25000');
  await form.getByRole('button', { name: 'Makan' }).click();
  await form.getByRole('button', { name: 'Dompet' }).click();
  await form.getByLabel('Catatan').fill('Makan siang');
  await form.getByRole('button', { name: 'Simpan' }).click();
  await expect(page.getByText('Transaksi tersimpan')).toBeVisible();

  const rows = () => admin.from('transactions').select('id, amount, note').eq('user_id', user.id);
  await expect.poll(async () => (await rows()).data).toEqual([expect.objectContaining({ amount: 25000, note: 'Makan siang' })]);

  // Edit: rows from the database carry null for unused accounts (see #151).
  await page.reload();
  await page.getByRole('button', { name: /Makan siang/ }).click();
  await form.getByLabel('Nominal').fill('30000');
  await form.getByRole('button', { name: 'Simpan' }).click();
  await expect(page.getByText('Transaksi diperbarui')).toBeVisible();
  await expect.poll(async () => (await rows()).data?.[0]?.amount).toBe(30000);

  // Delete through the confirmation, which must sit above the form (see #151).
  await page.getByRole('button', { name: /Makan siang/ }).click();
  await form.getByRole('button', { name: 'Hapus', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus' }).click();
  await expect(page.getByText('Transaksi dihapus')).toBeVisible();
  await expect.poll(async () => (await rows()).data).toEqual([]);

  // The account balance follows the transactions back to its opening amount.
  const { data: account } = await admin.from('accounts').select('current_balance').eq('id', user.accountId).single();
  expect(Number(account?.current_balance)).toBe(500000);
});
