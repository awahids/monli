import { test, expect, signIn } from '../fixtures';

test('new users see the onboarding once, and it can be previewed again', async ({ page, newUser }) => {
  await signIn(page, newUser);
  const onboarding = page.getByRole('dialog', { name: 'Panduan awal Qala Saku' });
  await expect(onboarding).toBeVisible();
  await onboarding.getByRole('button', { name: 'Lewati' }).click();
  await expect(onboarding).toBeHidden();

  await page.reload();
  await expect(page.getByRole('heading', { name: /Selamat/ })).toBeVisible();
  await expect(onboarding).toBeHidden();

  await page.goto('/dashboard?onboarding=preview');
  await expect(onboarding.getByText('Pratinjau')).toBeVisible();
});
