import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

// 1x1 PNG; the AI call is mocked, CI has no API key.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

test('scan a bank history screenshot from the gallery', async ({ page, user, admin }) => {
  await admin.from('profiles').update({ plan: 'PRO' }).eq('id', user.id);
  await page.route('**/api/transactions/ocr', (route) =>
    route.fulfill({
      json: {
        items: [
          { description: 'ANDI WIBOWO', amount: 40000, date: '2026-10-02', type: 'expense' },
          { description: 'KOMPLEK BCI C01-05', amount: 90000, date: '2026-10-02', type: 'expense' },
          { description: 'Gaji', amount: 1500000, date: '2026-10-01', type: 'income' },
        ],
        total: 0,
        date: null,
      },
    })
  );
  await signIn(page, user);
  await page.goto('/transactions');

  // No `capture` attribute: phones then offer the gallery as well as the camera.
  const input = page.locator('input[type="file"]');
  await expect(input).not.toHaveAttribute('capture');
  await input.setInputFiles({ name: 'mutasi.png', mimeType: 'image/png', buffer: PNG });

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Periksa hasil scan struk (3 item)')).toBeVisible();
  // Every row gets the only account, even if accounts load after the dialog opens.
  await expect(dialog.getByRole('button', { name: 'Dompet', pressed: true })).toHaveCount(3);
  await dialog.getByRole('button', { name: 'Simpan semua' }).click();
  // Three saves in a row: allow more than the default 5s.
  await expect(page.getByText('3 transaksi tersimpan')).toBeVisible({ timeout: 15_000 });

  const { data } = await admin
    .from('transactions')
    .select('note, amount, type, actual_date')
    .eq('user_id', user.id)
    .order('amount');
  expect(data?.map((t) => [t.note, Number(t.amount), t.type, t.actual_date])).toEqual([
    ['ANDI WIBOWO', 40000, 'expense', '2026-10-02'],
    ['KOMPLEK BCI C01-05', 90000, 'expense', '2026-10-02'],
    ['Gaji', 1500000, 'income', '2026-10-01'],
  ]);
});

test('the scanned photo is kept with the transactions and can be changed', async ({ page, user, admin }) => {
  await admin.from('profiles').update({ plan: 'PRO' }).eq('id', user.id);
  await page.route('**/api/transactions/ocr', (route) =>
    route.fulfill({
      json: {
        items: [
          { description: 'Kopi', amount: 25000, type: 'expense' },
          { description: 'Roti', amount: 15000, type: 'expense' },
        ],
        total: 40000,
        date: null,
      },
    })
  );
  await signIn(page, user);
  await page.goto('/transactions');
  await page.locator('input[type="file"]').setInputFiles({ name: 'struk.png', mimeType: 'image/png', buffer: PNG });
  const review = page.getByRole('dialog');
  await expect(review.getByRole('button', { name: 'Dompet', pressed: true })).toHaveCount(2);
  await review.getByRole('button', { name: 'Simpan semua' }).click();
  await expect(page.getByText('2 transaksi tersimpan')).toBeVisible({ timeout: 15_000 });

  const paths = async () =>
    ((await admin.from('transactions').select('note, receipt_path').eq('user_id', user.id).order('note')).data ?? []).map(
      (t) => [t.note, t.receipt_path]
    );
  // Both rows share the one uploaded photo, stored under the owner's folder.
  const [[, path], [, other]] = await paths();
  expect(path).toMatch(new RegExp(`^${user.id}/[0-9a-f-]{36}\\.png$`));
  expect(other).toBe(path);
  expect((await admin.storage.from('receipts').download(path!)).error).toBeNull();

  await page.getByRole('button', { name: /Kopi/ }).click();
  const form = page.getByRole('dialog');
  await expect(form.getByRole('img', { name: 'Foto struk' })).toBeVisible();
  await form.getByRole('button', { name: 'Hapus foto' }).click();
  await expect(form.getByRole('button', { name: 'Lampirkan foto struk' })).toBeVisible();
  await expect.poll(paths).toEqual([
    ['Kopi', null],
    ['Roti', path],
  ]);

  await form.getByLabel('Pilih foto struk').setInputFiles({ name: 'baru.png', mimeType: 'image/png', buffer: PNG });
  await expect(form.getByRole('img', { name: 'Foto struk' })).toBeVisible();
  await expect.poll(async () => (await paths())[0][1]).toMatch(new RegExp(`^${user.id}/`));
});
