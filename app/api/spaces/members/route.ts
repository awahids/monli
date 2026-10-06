import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { SPACE_MEMBER_LIMIT, inviteErrorMessage } from '@/lib/space';

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email tidak valid'),
  role: z.enum(['editor', 'viewer']).default('editor'),
});

/** People the caller invited to their own space. Always the caller's own, never the active space. */
export async function GET() {
  const supabase = createClient();
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from('space_members')
      .select('id, email, role, status, token, member_name, created_at, accepted_at')
      .eq('owner_id', user.id)
      .order('created_at');
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data: data ?? [], limit: SPACE_MEMBER_LIMIT });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  const parsed = inviteSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }, { status: 400 });
  }
  const supabase = createClient();
  try {
    const user = await getUser();
    const { email, role } = parsed.data;
    if (email === user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'Itu email kamu sendiri.' }, { status: 400 });
    }
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
    if (profile?.plan !== 'PRO') {
      return NextResponse.json({ error: 'Kelola bersama hanya untuk paket PRO.' }, { status: 403 });
    }
    const { data, error } = await supabase
      .from('space_members')
      .insert({ owner_id: user.id, email, role })
      .select('id, email, role, status, token, member_name, created_at, accepted_at')
      .single();
    if (error) {
      const message =
        error.code === '23505' ? 'Email ini sudah diundang.' : error.message.includes('member_limit') ? inviteErrorMessage(error.message) : error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
