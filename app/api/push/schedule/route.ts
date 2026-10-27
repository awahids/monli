import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { pushScheduleSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * Replaces the user's pending reminders with the ones the home screen just
 * planned, the way the phone app reschedules its local notifications.
 */
export async function PUT(req: Request) {
  let body: z.infer<typeof pushScheduleSchema>;
  try {
    body = pushScheduleSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  }
  try {
    const user = await getUser();
    const supabase = createClient();
    const { error: clearError } = await supabase.from('push_schedule').delete().eq('user_id', user.id);
    if (clearError) return NextResponse.json({ error: clearError.message }, { status: 400 });
    // One row per id: two events hashing to the same id keep the first.
    const unique = body.notifications.filter((n, i, all) => all.findIndex((m) => m.id === n.id) === i);
    if (unique.length) {
      const { error } = await supabase.from('push_schedule').insert(
        unique.map((n) => ({
          user_id: user.id,
          id: n.id,
          kind: n.kind ?? 'other',
          title: n.title,
          body: n.body,
          url: n.url,
          send_at: n.at,
        }))
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
