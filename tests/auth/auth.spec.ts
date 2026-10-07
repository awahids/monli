import { test, expect, signIn } from '../fixtures';
import { genEmail } from '../utils/genEmail';

test('protected pages send signed-out visitors to sign in', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/sign-in/);
});

test('sign in, then the sign-in page redirects to the dashboard', async ({ page, user }) => {
  await signIn(page, user);
  await expect(page.getByRole('heading', { name: /Selamat (pagi|siang|sore|malam)/ })).toBeVisible();
  await page.goto('/auth/sign-in');
  await expect(page).toHaveURL(/\/dashboard/);
});

test('wrong password shows an error', async ({ page, user }) => {
  await page.goto('/auth/sign-in');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Kata sandi', { exact: true }).fill('SalahSandi123');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByText('Email atau kata sandi salah').first()).toBeVisible();
});

test('sign up creates the user and profile', async ({ page, admin }) => {
  const email = genEmail();
  await page.goto('/auth/sign-up');
  await page.getByLabel('Nama lengkap').fill('Pengguna Baru');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Kata sandi', { exact: true }).fill('Password123');
  await page.getByLabel('Ulangi kata sandi').fill('Password123');
  await page.getByRole('button', { name: 'Buat akun' }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);

  const { data: profile } = await admin.from('profiles').select('id, name').eq('email', email).single();
  expect(profile?.name).toBe('Pengguna Baru');
  await admin.auth.admin.deleteUser(profile!.id);
});

test('sign up validates the form', async ({ page }) => {
  await page.goto('/auth/sign-up');
  await page.getByRole('button', { name: 'Buat akun' }).click();
  await expect(page.getByText('Nama minimal 2 karakter')).toBeVisible();
  await expect(page.getByText('Format email tidak valid')).toBeVisible();
  await expect(page.getByText('Kata sandi minimal 6 karakter')).toBeVisible();
});
