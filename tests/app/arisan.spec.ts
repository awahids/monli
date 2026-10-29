import { test, expect, signIn } from '../fixtures';
import { formatDate } from '@/lib/date';

test.use({ viewport: { width: 390, height: 844 } });

test('an arisan: members in turn, who has paid, and swapping turns', async ({ page, user }) => {
  const today = formatDate(new Date());
  await signIn(page, user);
  await page.goto('/arisan');
  await page.getByRole('button', { name: 'Buat arisan' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nama arisan').fill('Arisan RT 05');
  await dialog.getByLabel('Setoran per orang').fill('100000');
  await dialog.getByLabel('Putaran pertama').fill(today);
  await dialog.getByLabel('Anggota, sesuai urutan giliran').fill('Bu Sari, Pak Budi');
  await dialog.getByRole('button', { name: 'Tambah' }).click();
  // The user is listed first; move them to the second turn.
  await dialog.getByRole('button', { name: 'Turunkan Uji' }).click();
  await dialog.getByRole('button', { name: 'Buat arisan' }).click();

  const card = page.getByRole('link', { name: /Arisan RT 05/ });
  await expect(card).toContainText(/Rp\s100\.000\/orang · pot Rp\s300\.000 · 3 anggota/);
  await expect(card).toContainText('Putaran 1');
  await expect(card).toContainText('Bu Sari');
  await expect(card).toContainText('0/3 sudah setor');
  await expect(card).toContainText('Kamu belum setor');

  await card.click();
  await expect(page.getByRole('heading', { name: 'Arisan RT 05' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Uji sudah setor' }).click();
  await page.getByRole('checkbox', { name: 'Bu Sari sudah setor' }).click();
  await expect(page.getByText('2/3 sudah setor')).toBeVisible();

  // Turns: Bu Sari, Uji, Pak Budi. Swap the last two.
  await page.getByRole('button', { name: 'Ubah urutan' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Turunkan Uji' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Simpan urutan' }).click();
  const turns = page.locator('section', { has: page.getByRole('heading', { name: 'Jadwal giliran' }) }).getByRole('listitem');
  await expect(turns.nth(1)).toContainText('Pak Budi');
  await expect(turns.nth(2)).toContainText('Uji');
  await expect(turns.nth(2)).toContainText('Giliranmu');
  // Payments stayed with their member and round.
  await expect(page.getByText('2/3 sudah setor')).toBeVisible();

  await page.goto('/arisan');
  await expect(page.getByRole('link', { name: /Arisan RT 05/ })).toContainText('Kamu sudah setor');
});

test('payments are checked against the arisan', async ({ page, user }) => {
  await signIn(page, user);
  const res = await page.request.post('/api/arisan', {
    data: { name: 'Kantor', amount: 50000, frequency: 'weekly', startDate: '2026-01-05', members: [{ name: 'A' }, { name: 'B' }] },
  });
  expect(res.status()).toBe(201);
  const { id } = await res.json();
  expect((await page.request.post('/api/arisan', { data: { name: 'Sendiri', amount: 1, frequency: 'weekly', startDate: '2026-01-05', members: [{ name: 'A' }] } })).status()).toBe(400);
  const pay = (memberId: string, round: number) => page.request.post(`/api/arisan/${id}/payments`, { data: { memberId, round, paid: true } });
  expect((await pay('00000000-0000-4000-8000-000000000000', 1)).status()).toBe(400);
  const { data } = await (await page.request.get('/api/arisan')).json();
  const member = data[0].members[0].id;
  expect((await pay(member, 3)).status()).toBe(400);
  expect((await pay(member, 2)).ok()).toBe(true);
  expect((await pay(member, 2)).ok()).toBe(true);
  expect((await page.request.patch(`/api/arisan/${id}`, { data: { memberOrder: [member] } })).status()).toBe(400);
});
