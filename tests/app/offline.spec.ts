import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });

test('opens offline with the last data, records offline and syncs back', async ({ page, context, user, admin }) => {
  await admin.from('transactions').insert({
    user_id: user.id, type: 'expense', amount: 12000, account_id: user.accountId, category_id: user.categoryId,
    note: 'Kopi pagi', date: '2026-10-01', actual_date: '2026-10-01', budget_month: '2026-10',
  });
  await signIn(page, user);
  await page.goto('/transactions');
  await expect(page.getByText('Kopi pagi')).toBeVisible();
  // The service worker caches the main pages in the background after sign-in.
  await expect
    .poll(() => page.evaluate(async () => (await (await caches.open('saku-pages-v1')).keys()).length), { timeout: 30_000 })
    .toBeGreaterThanOrEqual(5);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Transaksi' })).toBeVisible();
  await expect(page.getByText('Kopi pagi')).toBeVisible();

  // A page opened only through the warm-up, never visited in this session.
  await page.goto('/budgets');
  // TEMP: diagnose the CI-only failure below.
  await page.waitForTimeout(3000);
  console.log('OFFLINE_DEBUG', JSON.stringify(await page.evaluate(async () => ({
    url: location.href,
    body: document.body.innerText.slice(0, 400),
    pages: (await (await caches.open('saku-pages-v1')).keys()).map((k) => k.url),
  }))));
  await expect(page.getByRole('heading', { name: 'Budget', exact: true })).toBeVisible();

  // Record while offline: queued locally.
  await page.getByRole('button', { name: 'Catat transaksi' }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Nominal').fill('8000');
  await form.getByRole('button', { name: 'Makan' }).click();
  await form.getByRole('button', { name: 'Dompet' }).click();
  await form.getByLabel('Catatan').fill('Parkir offline');
  await form.getByRole('button', { name: 'Simpan' }).click();
  await expect(page.getByText(/Disimpan offline/)).toBeVisible();

  // Back online: the queue is sent to the server.
  await context.setOffline(false);
  await expect
    .poll(async () => (await admin.from('transactions').select('note').eq('user_id', user.id).eq('note', 'Parkir offline')).data?.length, { timeout: 30_000 })
    .toBe(1);
});
