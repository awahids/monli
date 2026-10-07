import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

test('a PIN locks the app on this device', async ({ page, user }) => {
  await signIn(page, user);
  await page.goto('/settings');
  await page.getByRole('switch', { name: 'Kunci dengan PIN' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('PIN', { exact: true }).fill('123456');
  await dialog.getByLabel('Ulangi PIN').fill('654321');
  await dialog.getByRole('button', { name: 'Aktifkan' }).click();
  await expect(dialog.getByText('PIN tidak sama')).toBeVisible();
  await dialog.getByLabel('Ulangi PIN').fill('123456');
  await dialog.getByRole('button', { name: 'Aktifkan' }).click();
  await expect(page.getByText('Kunci aplikasi aktif')).toBeVisible();
  // Only a salted hash is kept, never the PIN.
  expect(await page.evaluate(() => localStorage.getItem('qala-app-lock'))).not.toContain('123456');

  await page.goto('/dashboard');
  const gate = page.getByRole('dialog', { name: 'Aplikasi terkunci' });
  await expect(gate).toBeVisible();
  await gate.getByLabel('PIN').fill('111111');
  await expect(gate.getByRole('alert')).toHaveText('PIN salah. Sisa 4 kali coba.');
  await gate.getByLabel('PIN').fill('123456');
  await expect(gate).toBeHidden();

  // Turning it off asks for the current PIN.
  await page.goto('/settings');
  await page.getByRole('dialog', { name: 'Aplikasi terkunci' }).getByLabel('PIN').fill('123456');
  await page.getByRole('switch', { name: 'Kunci dengan PIN' }).click();
  await page.getByRole('dialog').getByLabel('PIN', { exact: true }).fill('123456');
  await page.getByRole('dialog').getByRole('button', { name: 'Matikan' }).click();
  await expect(page.getByText('Kunci aplikasi dimatikan')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Aplikasi terkunci' })).toHaveCount(0);
});

test('forgetting the PIN signs out and removes the lock', async ({ page, user }) => {
  await signIn(page, user);
  await page.goto('/settings');
  await page.getByRole('switch', { name: 'Kunci dengan PIN' }).click();
  await page.getByRole('dialog').getByLabel('PIN', { exact: true }).fill('123456');
  await page.getByRole('dialog').getByLabel('Ulangi PIN').fill('123456');
  await page.getByRole('dialog').getByRole('button', { name: 'Aktifkan' }).click();
  await page.reload();
  await page.getByRole('button', { name: /Lupa PIN/ }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  expect(await page.evaluate(() => localStorage.getItem('qala-app-lock'))).toBeNull();
});

test('fingerprint / Face ID unlocks with a platform authenticator', async ({ page, user }) => {
  // A virtual fingerprint sensor that always verifies the user.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
    },
  });
  await signIn(page, user);
  await page.goto('/settings');
  await page.getByRole('switch', { name: 'Kunci dengan PIN' }).click();
  await page.getByRole('dialog').getByLabel('PIN', { exact: true }).fill('123456');
  await page.getByRole('dialog').getByLabel('Ulangi PIN').fill('123456');
  await page.getByRole('dialog').getByRole('button', { name: 'Aktifkan' }).click();
  const biometric = page.getByRole('switch', { name: 'Buka dengan sidik jari / Face ID' });
  await biometric.click();
  await expect(biometric).toBeChecked();

  await page.reload();
  const gate = page.getByRole('dialog', { name: 'Aplikasi terkunci' });
  await gate.getByRole('button', { name: /sidik jari/ }).click();
  await expect(gate).toBeHidden();
});
