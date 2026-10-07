import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

test('PRO: the form suggests a category and tags from past transactions', async ({ page, user, admin }) => {
  const { data: transport } = await admin
    .from('categories')
    .insert({ user_id: user.id, name: 'Transport', type: 'expense', color: '#3B82F6', icon: 'Fuel' })
    .select('id')
    .single();
  const row = (note: string, categoryId: string, tags: string[]) => ({
    user_id: user.id, type: 'expense', amount: 20000, account_id: user.accountId, category_id: categoryId,
    note, tags, date: '2026-10-01', actual_date: '2026-10-01', budget_month: '2026-10',
  });
  await admin.from('transactions').insert([
    row('Bensin motor', transport!.id, ['motor']),
    row('Makan siang', user.categoryId, []),
  ]);

  // FREE: no suggestions.
  await signIn(page, user);
  await page.getByRole('button', { name: 'Catat transaksi' }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Catatan').fill('isi bensin');
  await expect(form.getByRole('group', { name: 'Saran' })).toBeHidden();

  await admin.from('profiles').update({ plan: 'PRO' }).eq('id', user.id);
  await page.reload();
  await page.getByRole('button', { name: 'Catat transaksi' }).click();
  await form.getByLabel('Catatan').fill('isi bensin');
  const suggestions = form.getByRole('group', { name: 'Saran' });
  await suggestions.getByRole('button', { name: 'Pakai kategori Transport' }).click();
  await expect(form.getByRole('button', { name: 'Transport', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await suggestions.getByRole('button', { name: 'Tambah tag motor' }).click();
  await expect(form.getByText('Tag: motor')).toBeVisible();
  // Chosen suggestions disappear.
  await expect(suggestions).toBeHidden();
});
