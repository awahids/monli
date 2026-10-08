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

test('the warm-up caches the build files of pages not opened yet', async ({ page, user }) => {
  await signIn(page, user);
  await page.goto('/transactions');
  // A page is cached only after its build files, so once /budgets is in, its chunk must be too.
  await expect
    .poll(() => page.evaluate(async () => !!(await (await caches.open('saku-pages-v1')).match(location.origin + '/budgets'))), { timeout: 30_000 })
    .toBe(true);
  const chunks = await page.evaluate(async () =>
    (await (await caches.open('saku-static-v1')).keys()).map((k) => decodeURIComponent(k.url))
  );
  expect(chunks.some((u) => u.includes('/app/(dashboard)/budgets/page-'))).toBe(true);
});

test('the installed app opens through the logo splash, online and offline', async ({ page, context, user }) => {
  const manifest = await (await page.request.get('/manifest.json')).json();
  expect(manifest.start_url).toBe('/launch.html');

  await signIn(page, user);
  await page.goto(manifest.start_url);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Saldo total')).toBeVisible();

  // The service worker keeps the splash, so it still opens without a connection.
  await expect
    .poll(() => page.evaluate(async () => !!(await caches.match('/launch.html'))), { timeout: 30_000 })
    .toBe(true);
  await expect
    .poll(() => page.evaluate(async () => !!(await (await caches.open('saku-pages-v1')).match(location.origin + '/dashboard'))), { timeout: 30_000 })
    .toBe(true);
  await context.setOffline(true);
  await page.goto('/launch.html');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Saldo total')).toBeVisible();
});
