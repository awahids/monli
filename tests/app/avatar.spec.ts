import { test, expect, signIn } from '../fixtures';

test('every account has a drawn cartoon avatar that "Acak lagi" redraws', async ({ page, user, admin }) => {
  await signIn(page, user);
  await page.goto('/settings');
  const card = page.locator('div').filter({ has: page.getByText('Foto profil', { exact: true }) }).last();
  const before = await card.locator('svg').first().innerHTML();

  await page.getByRole('button', { name: 'Acak lagi' }).click();
  await expect.poll(async () => (await admin.from('profiles').select('avatar_seed').eq('id', user.id).single()).data?.avatar_seed).toMatch(/^[0-9a-f]{8}$/);
  await expect.poll(() => card.locator('svg').first().innerHTML()).not.toBe(before);
});

test('turning a photo into a cartoon is PRO only', async ({ page, user }) => {
  await signIn(page, user);
  await page.goto('/settings');
  await expect(page.getByRole('button', { name: /Ubah fotoku jadi kartun/ })).toBeDisabled();

  const res = await page.request.post('/api/profile/avatar', {
    multipart: { file: { name: 'me.png', mimeType: 'image/png', buffer: Buffer.from('not really a photo') } },
  });
  expect(res.status()).toBe(403);
});
