import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSpace, readOnlyResponse } from '@/lib/auth/server';
import { arisanSchema } from '@/lib/validation';
import { loadArisans } from '@/lib/arisan-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  try {
    const space = await getSpace();
    const { data, error } = await loadArisans(supabase, space.ownerId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  const supabase = createClient();
  let body: z.infer<typeof arisanSchema>;
  try {
    body = arisanSchema.parse(await req.json());
  } catch (e) {
    const issue = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: issue ?? 'Data tidak valid' }, { status: 400 });
  }
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    const { data, error } = await supabase
      .from('arisans')
      .insert({
        user_id: space.ownerId,
        name: body.name,
        amount: body.amount,
        frequency: body.frequency,
        start_date: body.startDate,
        note: body.note || null,
      })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const { error: membersError } = await supabase.from('arisan_members').insert(
      body.members.map((m, i) => ({ arisan_id: data.id, user_id: space.ownerId, name: m.name, turn: i + 1, is_me: !!m.isMe }))
    );
    if (membersError) {
      await supabase.from('arisans').delete().eq('id', data.id);
      return NextResponse.json({ error: membersError.message }, { status: 400 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
