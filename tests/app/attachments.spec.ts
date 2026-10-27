import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

async function seed(admin: any, user: any) {
  const date = today();
  const { error } = await admin.from('transactions').insert({
    user_id: user.id, account_id: user.accountId, category_id: user.categoryId, type: 'expense', amount: 3500000,
    note: 'Kulkas', date, actual_date: date, budget_month: date.slice(0, 7),
  });
  if (error) throw error;
}

test('PRO keeps a warranty PDF and a photo with a transaction', async ({ page, user, admin }) => {
  await admin.from('profiles').update({ plan: 'PRO' }).eq('id', user.id);
  await seed(admin, user);
  await signIn(page, user);
  await page.goto('/transactions');
  await page.getByRole('button', { name: /Kulkas/ }).click();
  const form = page.getByRole('dialog');

  await form.getByLabel('Pilih lampiran').setInputFiles([
    { name: 'garansi.pdf', mimeType: 'application/pdf', buffer: PDF },
    { name: 'nota.png', mimeType: 'image/png', buffer: PNG },
  ]);
  const list = form.getByRole('list', { name: 'Lampiran' });
  await expect(list.getByRole('listitem')).toHaveCount(2, { timeout: 15_000 });
  await expect(list.getByRole('link', { name: 'Buka PDF' })).toBeVisible();

  const stored = async () =>
    ((await admin.from('transactions').select('attachments').eq('user_id', user.id).single()).data?.attachments ?? []) as string[];
  await expect.poll(async () => (await stored()).length).toBe(2);
  const paths = await stored();
  expect(paths.every((p) => p.startsWith(`${user.id}/`))).toBe(true);
  expect(paths.some((p) => p.endsWith('.pdf'))).toBe(true);
  expect((await admin.storage.from('receipts').download(paths[0])).error).toBeNull();

  await list.getByRole('button', { name: 'Hapus lampiran' }).first().click();
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect.poll(async () => (await stored()).length).toBe(1);
});

test('FREE is told extra attachments are PRO', async ({ page, user, admin }) => {
  await seed(admin, user);
  await signIn(page, user);
  await page.goto('/transactions');
  await page.getByRole('button', { name: /Kulkas/ }).click();
  await expect(page.getByRole('dialog').getByText(/Lampiran lain \(garansi, invoice PDF\) khusus PRO/)).toBeVisible();
  await expect(page.getByRole('dialog').getByLabel('Pilih lampiran')).toHaveCount(0);
});
