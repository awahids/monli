import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { STALE_MS } from '@/lib/push';
import { configureWebPush, isCronRequest, sendPush } from '@/lib/push-send';
import { formatDate } from '@/lib/date';

export const dynamic = 'force-dynamic';

/**
 * Sends the reminders that are due to every browser of their user, then
 * forgets them. Called every 5 minutes by pg_cron (saku.request_push_send)
 * with the shared secret; reminders more than STALE_MS late are dropped
 * unsent, and so is the evening nudge once that day has a transaction,
 * whichever device recorded it.
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
    sent += await sendPush(admin, (subs ?? []).filter((s) => s.user_id === n.user_id), n);
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
