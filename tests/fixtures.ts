import { test as base, expect, type Page } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './utils/env';
import { genEmail } from './utils/genEmail';

export type TestUser = { id: string; email: string; password: string; accountId: string; categoryId: string };

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: 'saku' },
});

/**
 * A confirmed user with a profile, one account and one expense category,
 * deleted again after the test. `onboarded: false` keeps the first-run
 * onboarding enabled.
 */
async function createUser({ onboarded = true } = {}): Promise<TestUser> {
  const email = genEmail();
  const password = 'Password123';
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error('createUser failed');
  const id = data.user.id;
  const { error: profileError } = await admin
    .from('profiles')
    .insert({ id, email, name: 'Uji Coba', default_currency: 'IDR', onboarding_completed: onboarded });
  if (profileError) throw profileError;
  const account = await must(
    admin.from('accounts').insert({ user_id: id, name: 'Dompet', type: 'cash', currency: 'IDR', opening_balance: 500000 }).select('id').single()
  );
  const category = await must(
    admin.from('categories').insert({ user_id: id, name: 'Makan', type: 'expense', color: '#F97316', icon: 'Utensils' }).select('id').single()
  );
  return { id, email, password, accountId: account.id, categoryId: category.id };
}

async function must<T>(query: PromiseLike<{ data: T; error: unknown }>): Promise<NonNullable<T>> {
  const { data, error } = await query;
  if (error || data == null) throw error ?? new Error('no data');
  return data;
}

export async function signIn(page: Page, user: Pick<TestUser, 'email' | 'password'>) {
  await page.goto('/auth/sign-in');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Kata sandi', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  // Generous: the dev server compiles the dashboard on first visit.
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
}

export const test = base.extend<{
  admin: SupabaseClient<any, 'saku'>;
  user: TestUser;
  newUser: TestUser;
}>({
  admin: async ({}, use) => use(admin),
  user: async ({}, use) => {
    const user = await createUser();
    await use(user);
    await admin.auth.admin.deleteUser(user.id);
  },
  newUser: async ({}, use) => {
    const user = await createUser({ onboarded: false });
    await use(user);
    await admin.auth.admin.deleteUser(user.id);
  },
});

export { expect };
