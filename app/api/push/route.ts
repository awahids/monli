import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { pushSubscriptionSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * Saves this browser's push subscription for the signed-in user. A browser
 * used by someone else before keeps one subscription, now theirs, so it goes
 * through the admin client once the user is known.
 */
export async function POST(req: Request) {
  let body: z.infer<typeof pushSubscriptionSchema>;
  try {
    body = pushSubscriptionSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  }
  try {
    const user = await getUser();
    const { error } = await createAdminClient()
      .from('push_subscriptions')
      .upsert({ endpoint: body.endpoint, user_id: user.id, p256dh: body.keys.p256dh, auth: body.keys.auth });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

/** Turns push off for this browser; with no browser left, the schedule goes too. */
export async function DELETE(req: Request) {
  const endpoint = z.object({ endpoint: z.string().max(1000) }).safeParse(await req.json().catch(() => null));
  if (!endpoint.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  try {
    const user = await getUser();
    const supabase = createClient();
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint.data.endpoint);
    const { count } = await supabase
      .from('push_subscriptions')
      .select('endpoint', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (!count) await supabase.from('push_schedule').delete().eq('user_id', user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
