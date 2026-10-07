import type { User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '../supabase/server';
import { READ_ONLY_MESSAGE, SPACE_COOKIE, isUuid, type SpaceRole } from '../space';
import { serverT } from '../locale-server';

export async function getUser(): Promise<User> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error(error?.message ?? 'Unauthorized');
  }
  return data.user;
}

export interface Space {
  user: User;
  /** Profile id whose data this request works on (user_id of the rows). */
  ownerId: string;
  role: SpaceRole;
  canWrite: boolean;
}

/**
 * The space this request works in: the signed-in user's own, or a shared
 * space they joined (chosen with the saku_space cookie). Membership is checked
 * here and again by RLS, so a forged cookie only falls back to their own.
 */
export async function getSpace(): Promise<Space> {
  const user = await getUser();
  const requested = cookies().get(SPACE_COOKIE)?.value;

  if (isUuid(requested) && requested !== user.id) {
    const supabase = createClient();
    const { data: membership } = await supabase
      .from('space_members')
      .select('role')
      .eq('owner_id', requested)
      .eq('member_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (membership) {
      // Sharing is a PRO feature: it pauses while the owner is not on PRO.
      const { data: owner } = await supabase.from('profiles').select('plan').eq('id', requested).maybeSingle();
      if (owner?.plan === 'PRO') {
        return { user, ownerId: requested, role: membership.role, canWrite: membership.role === 'editor' };
      }
    }
  }

  return { user, ownerId: user.id, role: 'owner', canWrite: true };
}

export function readOnlyResponse() {
  return NextResponse.json({ error: serverT()(...READ_ONLY_MESSAGE) }, { status: 403 });
}
