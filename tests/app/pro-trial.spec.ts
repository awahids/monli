import { createClient } from '@supabase/supabase-js';
import { test, expect, signIn } from '../fixtures';
import { env } from '../utils/env';

test.use({ viewport: { width: 390, height: 844 } });

test('a trial shows its days left, can be bought, and ends back on FREE', async ({ page, user, admin }) => {
  const inTenDays = new Date(Date.now() + 9.5 * 86_400_000).toISOString();
  await admin.from('profiles').update({ plan: 'PRO', pro_until: inTenDays }).eq('id', user.id);
  await signIn(page, user);

  await page.getByRole('button', { name: 'Lainnya' }).click();
  await expect(page.getByText('PRO gratis: sisa 10 hari')).toBeVisible();
  await page.keyboard.press('Escape');

  // Trial users still get the offer instead of "Kamu sudah PRO".
  await page.goto('/upgrade');
  await expect(page.getByText(/Masa coba PRO: sisa 10 hari/)).toBeVisible();
  await expect(page.getByText('Kamu sudah PRO')).toBeHidden();

  // The hourly job ends trials that are over, and leaves the others alone.
  await admin.from('profiles').update({ pro_until: new Date(Date.now() - 60_000).toISOString() }).eq('id', user.id);
  const { error } = await admin.rpc('end_pro_trials');
  expect(error).toBeNull();
  const { data } = await admin.from('profiles').select('plan, pro_until').eq('id', user.id).single();
  expect(data).toEqual({ plan: 'FREE', pro_until: null });
});

test('users cannot extend their own trial', async ({ user, admin }) => {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
  await admin.from('profiles').update({ plan: 'PRO', pro_until: tomorrow }).eq('id', user.id);

  // Straight to Supabase with the user's own session, past the app.
  const own = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { db: { schema: 'saku' } });
  await own.auth.signInWithPassword({ email: user.email, password: user.password });
  await own.from('profiles').update({ pro_until: new Date(Date.now() + 365 * 86_400_000).toISOString() }).eq('id', user.id);

  const { data } = await admin.from('profiles').select('plan, pro_until').eq('id', user.id).single();
  expect(data?.plan).toBe('PRO');
  expect(new Date(data!.pro_until!).toISOString()).toBe(tomorrow);
});

test('a profile made with the user own session (Google sign-in) starts the trial too', async ({ admin }) => {
  const email = `trial-${Date.now()}@example.com`;
  const { data: created } = await admin.auth.admin.createUser({ email, password: 'Password123', email_confirm: true });
  const id = created.user!.id;
  try {
    const own = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { db: { schema: 'saku' } });
    await own.auth.signInWithPassword({ email, password: 'Password123' });
    // What lib/profile.ts ensureProfile does on a first visit; plan is ignored.
    const { error } = await own.from('profiles').insert({ id, email, name: 'Baru', plan: 'FREE' });
    expect(error).toBeNull();
    const { data } = await admin.from('profiles').select('plan, pro_until').eq('id', id).single();
    expect(data?.plan).toBe('PRO');
    const days = (new Date(data!.pro_until!).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(13.9);
  } finally {
    await admin.auth.admin.deleteUser(id);
  }
});
