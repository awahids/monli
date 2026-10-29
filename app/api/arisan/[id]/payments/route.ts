import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSpace, readOnlyResponse } from '@/lib/auth/server';
import { formatDate } from '@/lib/date';
import { arisanPaymentSchema } from '@/lib/validation';
import { loadArisans } from '@/lib/arisan-server';

export const dynamic = 'force-dynamic';

/** Ticks a member's setoran for a round as paid (today), or unticks it. */
export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  let body: z.infer<typeof arisanPaymentSchema>;
  try {
    body = arisanPaymentSchema.parse(await req.json());
  } catch (e) {
    const issue = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: issue ?? 'Data tidak valid' }, { status: 400 });
  }
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    const { data } = await loadArisans(supabase, space.ownerId, params.id);
    const arisan = data?.[0];
    if (!arisan) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
    if (!arisan.members.some((m) => m.id === body.memberId) || body.round > arisan.members.length) {
      return NextResponse.json({ error: 'Anggota atau putaran tidak ditemukan' }, { status: 400 });
    }
    const { error } = body.paid
      ? await supabase.from('arisan_payments').upsert(
          { member_id: body.memberId, round: body.round, arisan_id: arisan.id, user_id: space.ownerId, paid_on: formatDate(new Date()) },
          { onConflict: 'member_id,round', ignoreDuplicates: true }
        )
      : await supabase.from('arisan_payments').delete().eq('member_id', body.memberId).eq('round', body.round).eq('user_id', space.ownerId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
