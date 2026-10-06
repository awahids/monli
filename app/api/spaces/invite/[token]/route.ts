import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { SPACE_COOKIE, inviteErrorMessage, isUuid } from '@/lib/space';

/** Who invited whom, shown before accepting. */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  if (!isUuid(params.token)) return NextResponse.json({ error: inviteErrorMessage('invite_not_found') }, { status: 404 });
  const supabase = createClient();
  try {
    await getUser();
    const { data, error } = await supabase.rpc('space_invite_info', { invite_token: params.token });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const info = (data as { owner_name: string; email: string; role: string; status: string }[] | null)?.[0];
    if (!info || info.status !== 'pending') {
      return NextResponse.json({ error: inviteErrorMessage('invite_not_found') }, { status: 404 });
    }
    return NextResponse.json({ ownerName: info.owner_name, email: info.email, role: info.role });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

/** Accepts the invite and switches the caller into the shared space. */
export async function POST(_req: Request, { params }: { params: { token: string } }) {
  if (!isUuid(params.token)) return NextResponse.json({ error: inviteErrorMessage('invite_not_found') }, { status: 404 });
  const supabase = createClient();
  try {
    await getUser();
    const { data, error } = await supabase.rpc('accept_space_invite', { invite_token: params.token });
    if (error) return NextResponse.json({ error: inviteErrorMessage(error.message) }, { status: 400 });
    const ownerId = (data as { owner_id: string } | null)?.owner_id;
    const res = NextResponse.json({ ownerId });
    if (ownerId) {
      res.cookies.set(SPACE_COOKIE, ownerId, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
    }
    return res;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
