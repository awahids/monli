import { test, expect, signIn } from '../fixtures';
import { formatDate } from '@/lib/date';

test.use({ viewport: { width: 390, height: 844 } });

const daysAgo = (n: number) => formatDate(new Date(Date.now() - n * 86_400_000));

test('the streak and a challenge, with Kanto reacting to a slip', async ({ page, user, admin }) => {
  const tx = (date: string, amount: number) => ({
    user_id: user.id,
    account_id: user.accountId,
    category_id: user.categoryId,
    type: 'expense',
    amount,
    note: '',
    date,
    actual_date: date,
    budget_month: date.slice(0, 7),
  });
  // Recorded on each of the last three days, today included.
  const { error } = await admin.from('transactions').insert([tx(daysAgo(2), 10000), tx(daysAgo(1), 20000), tx(daysAgo(0), 5000)]);
  if (error) throw error;

  await signIn(page, user);
  const card = page.getByRole('link', { name: 'Tantangan hemat' });
  await expect(card).toContainText('Streak 3 hari', { timeout: 15_000 });
  await card.click();
  await expect(page).toHaveURL(/\/challenges$/);
  await expect(page.getByTestId('streak-days')).toHaveText('3 hari');

  await page.getByRole('button', { name: 'Tantangan', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Hindari').selectOption({ label: 'Makan' });
  await dialog.getByRole('radio', { name: '7 hari' }).click();
  await expect(dialog.getByText('5 dari 7 hari tanpa Makan')).toBeVisible();
  await dialog.getByRole('button', { name: 'Mulai tantangan' }).click();

  const challenge = page.getByTestId('challenge');
  await expect(challenge).toContainText('5 dari 7 hari tanpa Makan');
  // Something was already spent on Makan today: a slip on day one.
  await expect(challenge).toContainText('0 dari 5 hari tercapai · boleh bolong 1 hari lagi');
  await expect(challenge.getByText('Hari 1: ada pengeluaran')).toBeAttached();
  await expect(page.locator('.kanto[data-mood="sad"]')).toBeVisible();

  // Three at once at most.
  for (let i = 0; i < 2; i++) {
    expect((await page.request.post('/api/challenges', { data: { categoryId: null, lengthDays: 7, targetDays: 5 } })).ok()).toBe(true);
  }
  const fourth = await page.request.post('/api/challenges', { data: { categoryId: null, lengthDays: 7, targetDays: 5 } });
  expect(fourth.status()).toBe(400);
  expect((await page.request.post('/api/challenges', { data: { categoryId: null, lengthDays: 7, targetDays: 8 } })).status()).toBe(400);

  await page.reload();
  await expect(page.getByTestId('challenge')).toHaveCount(3);
  await page.getByTestId('challenge').first().getByRole('button', { name: 'Hapus tantangan' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus' }).click();
  await expect(page.getByTestId('challenge')).toHaveCount(2);
});
