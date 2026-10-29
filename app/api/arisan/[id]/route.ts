import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSpace, readOnlyResponse } from '@/lib/auth/server';
import { arisanUpdateSchema } from '@/lib/validation';
import { loadArisans } from '@/lib/arisan-server';

export const dynamic = 'force-dynamic';

/** Renames, changes the setoran or note, or swaps turns (payments stay with their member and round). */
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  let body: z.infer<typeof arisanUpdateSchema>;
  try {
    body = arisanUpdateSchema.parse(await req.json());
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

    const fields = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.note !== undefined && { note: body.note || null }),
    };
    if (Object.keys(fields).length) {
      const { error } = await supabase.from('arisans').update(fields).eq('id', arisan.id).eq('user_id', space.ownerId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (body.memberOrder) {
      const ids = arisan.members.map((m) => m.id);
      const sameMembers = body.memberOrder.length === ids.length && new Set(body.memberOrder).size === ids.length && body.memberOrder.every((id) => ids.includes(id));
      if (!sameMembers) return NextResponse.json({ error: 'Urutan harus berisi semua anggota sekali' }, { status: 400 });
      // One statement, so the unique turn is only checked once every turn has moved.
      const { error } = await supabase.from('arisan_members').upsert(
        body.memberOrder.map((id, i) => {
          const m = arisan.members.find((x) => x.id === id)!;
          return { id, arisan_id: arisan.id, user_id: space.ownerId, name: m.name, is_me: m.isMe, turn: i + 1 };
        })
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    const { error } = await supabase.from('arisans').delete().eq('id', params.id).eq('user_id', space.ownerId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
