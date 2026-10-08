import { test, expect, signIn } from '../fixtures';

// What the iOS/Android shell (mobile/) sends: a phone WebView user agent tagged QalaSakuApp.
const IOS_APP = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 QalaSakuApp/1.0';
const ANDROID_APP = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36 QalaSakuApp/1.0';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('inside the iOS app', () => {
  test.use({ userAgent: IOS_APP });

  test('starts at sign-in, offers Apple, and hides web payments and install prompts', async ({ page, user }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
    await expect(page.locator('html')).toHaveAttribute('data-app', 'ios');
    await expect(page.getByRole('button', { name: 'Lanjutkan dengan Apple' })).toBeVisible();

    await signIn(page, user);
    await page.getByRole('button', { name: 'Lainnya' }).click();
    await expect(page.getByText('Coba Qala Saku PRO')).toBeHidden();
    await expect(page.getByText('Pasang Qala Saku')).toBeHidden();

    // PRO is bought on the website only.
    await page.goto('/upgrade');
    await expect(page).toHaveURL(/\/settings$/);
    await page.goto('/payments');
    await expect(page).toHaveURL(/\/settings$/);
  });
});

test.describe('inside the Android app', () => {
  test.use({ userAgent: ANDROID_APP });

  test('has no Apple button', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await expect(page.locator('html')).toHaveAttribute('data-app', 'android');
    await expect(page.getByRole('button', { name: 'Lanjutkan dengan Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lanjutkan dengan Apple' })).toBeHidden();
  });
});

test('the website keeps its landing page, upgrade offer and no Apple button', async ({ page, user }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-app', /.*/);
  await page.goto('/auth/sign-in');
  await expect(page.getByRole('button', { name: 'Lanjutkan dengan Apple' })).toBeHidden();

  await signIn(page, user);
  await page.getByRole('button', { name: 'Lainnya' }).click();
  await expect(page.getByText('Coba Qala Saku PRO')).toBeVisible();
  await page.goto('/upgrade');
  await expect(page).toHaveURL(/\/upgrade$/);
});
