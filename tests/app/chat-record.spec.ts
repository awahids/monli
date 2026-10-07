import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

test('record a transaction by voice through the assistant', async ({ page, user, admin }) => {
  await admin.from('profiles').update({ plan: 'PRO' }).eq('id', user.id);
  // Speech recognition that "hears" one sentence.
  await page.addInitScript(() => {
    class FakeRecognition {
      lang = '';
      interimResults = false;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        setTimeout(() => {
          this.onresult?.({ results: [[{ transcript: 'catat makan siang 25 ribu pakai dompet' }]] });
          this.onend?.();
        }, 50);
      }
      stop() {
        this.onend?.();
      }
    }
    // Newer Chromium has the unprefixed constructor too; replace both.
    Object.assign(window, { SpeechRecognition: FakeRecognition, webkitSpeechRecognition: FakeRecognition });
  });
  // The AI is mocked (CI has no key); /api/chat's own parsing is unit-tested.
  const sent: string[] = [];
  await page.route('**/api/chat', async (route) => {
    sent.push(route.request().postDataJSON().message);
    await route.fulfill({
      json: {
        answer: 'Siap, 1 transaksi siap dicatat. Periksa dulu sebelum disimpan.',
        drafts: [
          { description: 'Makan siang', amount: 25000, date: '2026-10-05', type: 'expense', categoryId: user.categoryId, accountId: user.accountId },
        ],
        usage: { used: 1, limit: 100, unlimited: false },
      },
    });
  });

  await signIn(page, user);
  await page.getByRole('button', { name: 'Buka asisten AI' }).click();
  await page.getByRole('button', { name: 'Bicara' }).click();
  await expect(page.getByText('Siap, 1 transaksi siap dicatat.')).toBeVisible();
  expect(sent).toEqual(['catat makan siang 25 ribu pakai dompet']);

  await page.getByRole('button', { name: 'Periksa & simpan' }).click();
  const review = page.getByRole('dialog', { name: /Periksa transaksi/ });
  await expect(review.getByRole('button', { name: 'Makan', pressed: true })).toBeVisible();
  await review.getByRole('button', { name: 'Simpan semua' }).click();
  await expect(page.getByText('1 transaksi tersimpan')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Tersimpan', { exact: true })).toBeVisible();

  const { data } = await admin
    .from('transactions')
    .select('note, amount, type, actual_date, category_id, account_id')
    .eq('user_id', user.id);
  expect(data).toEqual([
    { note: 'Makan siang', amount: 25000, type: 'expense', actual_date: '2026-10-05', category_id: user.categoryId, account_id: user.accountId },
  ]);
});
