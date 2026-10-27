import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { configureWebPush, isCronRequest, sendPush } from '@/lib/push-send';
import { budgetAlertText, budgetAlerts, type AlertState } from '@/lib/notifications';
import { currentBudgetMonth } from '@/lib/date';

export const dynamic = 'force-dynamic';

const indonesian = (id: string) => id;

/**
 * Budget alerts by Web Push: called by the database after expenses are saved
 * (saku.request_budget_alerts) with the owners to check. Each category that
 * reached 80% or 100% of this budget month's plan is sent once per level to
 * the owner's browsers that want budget alerts.
 */
export async function POST(req: Request) {
  if (!isCronRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = z.object({ userIds: z.array(z.string().uuid()).max(100) }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  if (!configureWebPush()) return NextResponse.json({ error: 'Web Push is not configured' }, { status: 503 });

  const admin = createAdminClient();
  let sent = 0;
  for (const userId of body.data.userIds) sent += await checkUser(admin, userId);
  return NextResponse.json({ sent });
}

async function checkUser(admin: ReturnType<typeof createAdminClient>, userId: string): Promise<number> {
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)
    .eq('budget_alerts', true);
  if (!subs?.length) return 0;

  const { data: profile } = await admin.from('profiles').select('budget_start_day').eq('id', userId).maybeSingle();
  const month = currentBudgetMonth(profile?.budget_start_day || 1);
  const { data: budget } = await admin.from('budgets').select('id').eq('user_id', userId).eq('month', month).maybeSingle();
  if (!budget) return 0;
  const [{ data: items }, { data: spent }, { data: raised }] = await Promise.all([
    admin.from('budget_items').select('category_id, amount').eq('budget_id', budget.id),
    admin.from('transactions').select('category_id, amount').eq('user_id', userId).eq('type', 'expense').eq('budget_month', month),
    admin.from('push_budget_alerts').select('category_id, level').eq('user_id', userId).eq('month', month),
  ]);

  const totals = new Map<string, number>();
  for (const t of spent ?? []) {
    if (t.category_id) totals.set(t.category_id, (totals.get(t.category_id) ?? 0) + Number(t.amount));
  }
  const usage = (items ?? [])
    .filter((i) => Number(i.amount) > 0)
    .map((i) => ({ categoryId: i.category_id, pct: ((totals.get(i.category_id) ?? 0) / Number(i.amount)) * 100 }));
  const state: AlertState = { month, sent: Object.fromEntries((raised ?? []).map((r) => [r.category_id, r.level as 80 | 100])) };
  const { alerts } = budgetAlerts(month, usage, state);
  if (!alerts.length) return 0;

  // Recorded before sending, so two saves close together alert only once.
  await admin
    .from('push_budget_alerts')
    .upsert(alerts.map((a) => ({ user_id: userId, month, category_id: a.categoryId, level: a.level, sent_at: new Date().toISOString() })));
  const { data: categories } = await admin
    .from('categories')
    .select('id, name')
    .in(
      'id',
      alerts.map((a) => a.categoryId)
    );
  const names = new Map((categories ?? []).map((c) => [c.id, c.name]));

  let sent = 0;
  for (const a of alerts) {
    const text = budgetAlertText(names.get(a.categoryId) ?? '', a.level, indonesian);
    sent += await sendPush(admin, subs, { ...text, url: '/budgets' });
  }
  return sent;
}
