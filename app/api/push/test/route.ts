import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { configureWebPush, sendPush } from '@/lib/push-send';
import { serverT } from '@/lib/locale-server';

export const dynamic = 'force-dynamic';

/** "Kirim notifikasi uji": a notification to this browser right away. */
export async function POST(req: Request) {
  const body = z.object({ endpoint: z.string().max(1000) }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  let userId: string;
  try {
    userId = (await getUser()).id;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
  if (!configureWebPush()) return NextResponse.json({ error: 'Web Push is not configured' }, { status: 503 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('endpoint', body.data.endpoint)
    .eq('user_id', userId)
    .maybeSingle();
  if (!sub) return NextResponse.json({ error: 'not subscribed' }, { status: 404 });

  const t = await serverT();
  const sent = await sendPush(admin, [sub], {
    title: t('Tes notifikasi Qala Saku', 'Qala Saku test notification'),
    body: t('Notifikasi sudah sampai. Pengingatmu akan muncul seperti ini.', 'Notifications work. Your reminders will show up like this.'),
    url: '/settings',
  });
  return sent ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'not delivered' }, { status: 502 });
}
