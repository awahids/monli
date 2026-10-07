import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });

test('opens offline with the last data, records offline and syncs back', async ({ page, context, user, admin }) => {
  await admin.from('transactions').insert({
    user_id: user.id, type: 'expense', amount: 12000, account_id: user.accountId, category_id: user.categoryId,
    note: 'Kopi pagi', date: '2026-10-01', actual_date: '2026-10-01', budget_month: '2026-10',
  });
  // TEMP: collect browser errors for the diagnosis below.
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  page.on('requestfailed', (r) => errors.push(`failed: ${r.url()} ${r.failure()?.errorText}`));
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
  errors.length = 0;
  await page.goto('/budgets');
  await expect(page.getByRole('heading', { name: 'Budget', exact: true })).toBeVisible().catch(async (e) => {
    // TEMP: the github reporter drops stdout, so surface the page state in the error.
    const state: Record<string, unknown> = await page.evaluate(async () => ({
      url: location.href,
      body: document.body.innerText.slice(0, 400),
      pages: (await (await caches.open('saku-pages-v1')).keys()).map((k) => k.url),
      statics: (await (await caches.open('saku-static-v1')).keys()).map((k) => k.url.split('/_next/')[1]),
      html: await (async () => {
        const r = await (await caches.open('saku-pages-v1')).match(location.origin + '/budgets');
        const text = r ? await r.text() : '';
        return { status: r?.status, length: text.length, head: text.slice(0, 300), tail: text.slice(-300) };
      })(),
      dom: document.documentElement.outerHTML.length,
    }));
    state.errors = errors.slice(0, 15);
    throw new Error(`${e.message}\nOFFLINE_DEBUG ${JSON.stringify(state)}`);
  });

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
