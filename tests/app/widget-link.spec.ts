import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

// The home screen widget's "+ Catat" opens qalasaku://add, which leads here.
test('?action=add opens the add form', async ({ page, user }) => {
  await signIn(page, user);
  await page.goto('/transactions?action=add');
  await expect(page.getByRole('dialog', { name: 'Tambah transaksi' })).toBeVisible();
  await expect(page).toHaveURL(/\/transactions$/);
});
