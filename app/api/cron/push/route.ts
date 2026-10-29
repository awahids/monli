import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { STALE_MS } from '@/lib/push';
import { configureWebPush, isCronRequest, sendPush } from '@/lib/push-send';
import { formatDate } from '@/lib/date';
import { formatMoney } from '@/lib/currency';
import { weekStart, weeklySummaryText, weeklyTitle } from '@/lib/weekly-summary';
import { loadWeeklySummary } from '@/lib/weekly-summary-server';

export const dynamic = 'force-dynamic';

/**
 * Sends the reminders that are due to every browser of their user, then
 * forgets them. Called every 5 minutes by pg_cron (saku.request_push_send)
 * with the shared secret; reminders more than STALE_MS late are dropped
 * unsent, and so is the evening nudge once that day has a transaction,
 * whichever device recorded it. The weekly summary gets the week's numbers.
 */
export async function POST(req: Request) {
  if (!isCronRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!configureWebPush()) return NextResponse.json({ error: 'Web Push is not configured' }, { status: 503 });

  const admin = createAdminClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const { data: due, error } = await admin
    .from('push_schedule')
    .select('user_id, id, kind, title, body, url, send_at')
    .lte('send_at', nowIso)
    .order('send_at')
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!due?.length) return NextResponse.json({ sent: 0 });

  const fresh = due.filter((n) => now - Date.parse(n.send_at) <= STALE_MS);
  const recorded = await recordedOn(
    admin,
    fresh.filter((n) => n.kind === 'daily').map((n) => ({ userId: n.user_id, day: formatDate(new Date(n.send_at)) }))
  );
  const toSend = fresh.filter((n) => n.kind !== 'daily' || !recorded.has(`${n.user_id}:${formatDate(new Date(n.send_at))}`));

  const userIds = Array.from(new Set(toSend.map((n) => n.user_id)));
  const { data: subs } = userIds.length
    ? await admin.from('push_subscriptions').select('endpoint, user_id, p256dh, auth').in('user_id', userIds)
    : { data: [] };

  let sent = 0;
  for (const n of toSend) {
    const targets = (subs ?? []).filter((s) => s.user_id === n.user_id);
    if (!targets.length) continue;
    sent += await sendPush(admin, targets, n.kind === 'weekly' ? await withWeekNumbers(admin, n) : n);
  }

  for (const userId of Array.from(new Set(due.map((n) => n.user_id)))) {
    await admin
      .from('push_schedule')
      .delete()
      .eq('user_id', userId)
      // A plan uploaded meanwhile may reuse an id for a later time: keep that.
      .lte('send_at', nowIso)
      .in('id', due.filter((n) => n.user_id === userId).map((n) => n.id));
  }
  return NextResponse.json({ sent, dropped: due.length - fresh.length, skipped: fresh.length - toSend.length });
}

/** `userId:day` for each (user, Jakarta day) that already has a transaction. */
async function recordedOn(admin: ReturnType<typeof createAdminClient>, checks: { userId: string; day: string }[]) {
  const found = new Set<string>();
  for (const key of Array.from(new Set(checks.map((c) => `${c.userId}:${c.day}`)))) {
    const [userId, day] = key.split(':');
    const { count } = await admin
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('actual_date', day);
    if (count) found.add(key);
  }
  return found;
}

/**
 * The weekly summary with this week's spending against last week's, in the
 * language it was planned in; as planned when the numbers cannot be read.
 */
async function withWeekNumbers<N extends { user_id: string; title: string; body: string; url: string; send_at: string }>(
  admin: ReturnType<typeof createAdminClient>,
  n: N
): Promise<N> {
  const day = formatDate(new Date(n.send_at));
  const [{ data }, { data: profile }] = await Promise.all([
    loadWeeklySummary(admin, n.user_id, weekStart(day), day),
    admin.from('profiles').select('default_currency').eq('id', n.user_id).maybeSingle(),
  ]);
  if (!data) return n;
  const english = n.title === weeklyTitle((_, en) => en);
  const money = (amount: number) => formatMoney(amount, profile?.default_currency || 'IDR');
  const text = weeklySummaryText(data, money, (id, en) => (english ? en : id));
  return { ...n, ...text };
}
