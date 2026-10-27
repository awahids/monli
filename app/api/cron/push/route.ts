import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';
import { pushPayload, STALE_MS } from '@/lib/push';

export const dynamic = 'force-dynamic';

/**
 * Sends the reminders that are due to every browser of their user, then
 * forgets them. Called every 5 minutes by pg_cron (saku.request_push_send)
 * with the shared secret; reminders more than STALE_MS late are dropped
 * unsent, and subscriptions the push service no longer knows are removed.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!publicKey || !privateKey) return NextResponse.json({ error: 'Web Push is not configured' }, { status: 503 });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'https://monli.fun', publicKey, privateKey);

  const admin = createAdminClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const { data: due, error } = await admin
    .from('push_schedule')
    .select('user_id, id, title, body, url, send_at')
    .lte('send_at', nowIso)
    .order('send_at')
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!due?.length) return NextResponse.json({ sent: 0 });

  const fresh = due.filter((n) => now - Date.parse(n.send_at) <= STALE_MS);
  const userIds = Array.from(new Set(fresh.map((n) => n.user_id)));
  const { data: subs } = userIds.length
    ? await admin.from('push_subscriptions').select('endpoint, user_id, p256dh, auth').in('user_id', userIds)
    : { data: [] };

  let sent = 0;
  const gone = new Set<string>();
  await Promise.all(
    fresh.flatMap((n) =>
      (subs ?? [])
        .filter((s) => s.user_id === n.user_id)
        .map(async (s) => {
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              pushPayload(n),
              { TTL: 60 * 60 }
            );
            sent++;
          } catch (e) {
            const status = (e as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) gone.add(s.endpoint);
          }
        })
    )
  );

  if (gone.size) await admin.from('push_subscriptions').delete().in('endpoint', Array.from(gone));
  for (const userId of Array.from(new Set(due.map((n) => n.user_id)))) {
    await admin
      .from('push_schedule')
      .delete()
      .eq('user_id', userId)
      // A plan uploaded meanwhile may reuse an id for a later time: keep that.
      .lte('send_at', nowIso)
      .in('id', due.filter((n) => n.user_id === userId).map((n) => n.id));
  }
  return NextResponse.json({ sent, dropped: due.length - fresh.length, removed: gone.size });
}
