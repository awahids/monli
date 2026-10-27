import { test, expect, signIn } from '../fixtures';
import { currentBudgetMonth, formatDate } from '@/lib/date';

// CI sets the VAPID keys and CRON_SECRET for each run (.github/workflows/ci.yml).
const secret = process.env.CRON_SECRET;
test.skip(!secret || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, 'Web Push is not configured for this run');
// Full Chromium in its new headless mode: the default headless shell always
// reports notifications as denied. Allowed here, as a user would.
test.use({ channel: 'chromium', permissions: ['notifications'] });
// The cron routes send everything that is due, for every user: one test at a time.
test.describe.configure({ mode: 'serial' });

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

test('the evening nudge is skipped once that day has a transaction', async ({ request, user, admin }) => {
  const now = Date.now();
  const day = formatDate(new Date(now - 60_000));
  await admin.from('push_schedule').insert([
    { user_id: user.id, id: 10, kind: 'daily', title: 'Sudah catat hari ini?', body: 'b', url: '/dashboard', send_at: new Date(now - 60_000).toISOString() },
  ]);
  await admin.from('transactions').insert({
    user_id: user.id, account_id: user.accountId, category_id: user.categoryId, type: 'expense', amount: 15000,
    note: 'Kopi', date: day, actual_date: day, budget_month: day.slice(0, 7),
  });

  const res = await request.post('/api/cron/push', { headers: { Authorization: `Bearer ${secret}` } });
  expect(await res.json()).toMatchObject({ sent: 0, skipped: 1 });
  const { count } = await admin.from('push_schedule').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  expect(count).toBe(0);
});

test('budget alerts are sent once per level from the server', async ({ request, user, admin }) => {
  const month = currentBudgetMonth(1);
  const day = formatDate(new Date());
  await admin.from('push_subscriptions').insert({
    endpoint: `https://push.invalid/${user.id}`, user_id: user.id, p256dh: 'not-a-key', auth: 'not-a-secret',
  });
  const { data: budget } = await admin.from('budgets').insert({ user_id: user.id, month, total_amount: 100000 }).select('id').single();
  await admin.from('budget_items').insert({ budget_id: budget!.id, category_id: user.categoryId, amount: 100000 });
  const spend = (amount: number) =>
    admin.from('transactions').insert({
      user_id: user.id, account_id: user.accountId, category_id: user.categoryId, type: 'expense', amount,
      note: '', date: day, actual_date: day, budget_month: month,
    });
  const check = () =>
    request.post('/api/cron/budget-alerts', { headers: { Authorization: `Bearer ${secret}` }, data: { userIds: [user.id] } });
  const levels = async () => (await admin.from('push_budget_alerts').select('level').eq('user_id', user.id)).data;

  expect((await request.post('/api/cron/budget-alerts', { data: { userIds: [user.id] } })).status()).toBe(401);

  await spend(85000);
  expect((await check()).ok()).toBe(true);
  expect(await levels()).toEqual([{ level: 80 }]);

  // Already raised at 80%: nothing new until the budget is used up.
  await check();
  expect(await levels()).toEqual([{ level: 80 }]);
  await spend(20000);
  await check();
  expect(await levels()).toEqual([{ level: 100 }]);

  // Turned off on this browser: no more checks for this user.
  await admin.from('push_budget_alerts').delete().eq('user_id', user.id);
  await admin.from('push_subscriptions').update({ budget_alerts: false }).eq('user_id', user.id);
  await check();
  expect(await levels()).toEqual([]);
});

test('the test notification only goes to the signed-in user\'s own browser', async ({ page, user, request }) => {
  expect((await request.post('/api/push/test', { data: { endpoint: 'https://push.invalid/x' } })).status()).toBe(401);
  await signIn(page, user);
  const res = await page.request.post('/api/push/test', { data: { endpoint: 'https://push.invalid/someone-else' } });
  expect(res.status()).toBe(404);
});
