import { test, expect, signIn } from '../fixtures';

// CI sets the VAPID keys and CRON_SECRET for each run (.github/workflows/ci.yml).
const secret = process.env.CRON_SECRET;
test.skip(!secret || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, 'Web Push is not configured for this run');

test('the web app offers push and stores the planned reminders', async ({ page, user, admin }) => {
  await signIn(page, user);
  await page.goto('/settings');
  await expect(page.getByText('Nyalakan notifikasi agar pengingat sampai walau Qala Saku ditutup.')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Nyalakan' })).toBeVisible();
  // With push possible here, the phone reminders can be chosen too.
  await expect(page.getByLabel('Tagihan besok')).toBeVisible();

  const res = await page.request.put('/api/push/schedule', {
    data: {
      notifications: [
        { id: 7, title: 'Sudah catat hari ini?', body: 'Catat pengeluaran hari ini.', url: '/dashboard', at: '2030-01-01T13:00:00Z' },
        { id: 7, title: 'Duplikat', body: 'x', url: '/dashboard', at: '2030-01-02T13:00:00Z' },
      ],
    },
  });
  expect(res.ok()).toBe(true);
  const { data } = await admin.from('push_schedule').select('id, title').eq('user_id', user.id);
  expect(data).toEqual([{ id: 7, title: 'Sudah catat hari ini?' }]);

  // A new plan replaces the old one.
  await page.request.put('/api/push/schedule', { data: { notifications: [] } });
  const { count } = await admin.from('push_schedule').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  expect(count).toBe(0);
});

test('the sender needs the secret and clears what was due', async ({ request, user, admin }) => {
  expect((await request.post('/api/cron/push')).status()).toBe(401);
  expect((await request.post('/api/cron/push', { headers: { Authorization: 'Bearer wrong' } })).status()).toBe(401);

  const now = Date.now();
  await admin.from('push_subscriptions').insert({
    endpoint: `https://push.invalid/${user.id}`,
    user_id: user.id,
    p256dh: 'not-a-key',
    auth: 'not-a-secret',
  });
  await admin.from('push_schedule').insert([
    { user_id: user.id, id: 1, title: 'Due', body: 'b', url: '/dashboard', send_at: new Date(now - 60_000).toISOString() },
    { user_id: user.id, id: 2, title: 'Stale', body: 'b', url: '/dashboard', send_at: new Date(now - 5 * 3600_000).toISOString() },
    { user_id: user.id, id: 3, title: 'Later', body: 'b', url: '/dashboard', send_at: new Date(now + 3600_000).toISOString() },
  ]);

  const res = await request.post('/api/cron/push', { headers: { Authorization: `Bearer ${secret}` } });
  expect(res.ok()).toBe(true);
  // The fake subscription can't be delivered to, but the due and stale reminders are done with.
  expect(await res.json()).toMatchObject({ sent: 0 });
  const { data } = await admin.from('push_schedule').select('id').eq('user_id', user.id);
  expect(data).toEqual([{ id: 3 }]);
});
