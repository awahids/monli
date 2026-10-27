import { test, expect, signIn } from '../fixtures';

test.use({ viewport: { width: 390, height: 844 } });

test('on the web a budget alert shows once when a category passes 80%', async ({ page, user, admin }) => {
  await page.clock.setFixedTime(new Date('2026-03-10T05:00:00Z'));
  const { data: budget } = await admin.from('budgets').insert({ user_id: user.id, month: '2026-03', total_amount: 100000 }).select('id').single();
  await admin.from('budget_items').insert({ budget_id: budget!.id, category_id: user.categoryId, amount: 100000 });
  await admin.from('transactions').insert({
    user_id: user.id, account_id: user.accountId, category_id: user.categoryId, type: 'expense', amount: 85000,
    note: '', date: '2026-03-09', actual_date: '2026-03-09', budget_month: '2026-03',
  });

  await signIn(page, user);
  await expect(page.getByText('Budget Makan tinggal 20%')).toBeVisible({ timeout: 15_000 });

  // Raised once per period.
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.getByText('Budget Makan tinggal 20%')).toHaveCount(0);

  // Phone-only reminders aren't offered on the web; budget alerts can be turned off.
  await page.goto('/settings');
  await expect(page.getByText('Pengingat ke HP tersedia di aplikasi Qala Saku')).toBeVisible();
  await expect(page.getByLabel('Tagihan besok')).toHaveCount(0);
  await page.getByLabel('Budget hampir habis').click();
  await expect(page.getByLabel('Budget hampir habis')).not.toBeChecked();
});
