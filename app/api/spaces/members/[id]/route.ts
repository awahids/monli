import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';

const patchSchema = z.object({ role: z.enum(['editor', 'viewer']) });

/** Owner changes a member's role. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Peran tidak valid' }, { status: 400 });
  const supabase = createClient();
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from('space_members')
      .update({ role: parsed.data.role })
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .select('id, email, role, status, token, member_name, created_at, accepted_at')
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

/** Owner removes someone (or cancels an invite); a member leaves. RLS allows exactly those two. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  try {
    await getUser();
    const { data, error } = await supabase.from('space_members').delete().eq('id', params.id).select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data?.length) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
