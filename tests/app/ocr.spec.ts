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
