import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActiveSpace, JoinedSpace } from '@/types';
import { SPACE_COOKIE, isUuid } from './space';

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

/** Remembers the chosen space; API routes read the same cookie. */
export function writeSpaceCookie(ownerId: string | null) {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = ownerId
    ? `${SPACE_COOKIE}=${ownerId}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`
    : `${SPACE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export interface OwnerSettings {
  defaultCurrency: string;
  budgetStartDay: number;
}

/**
 * Resolves the active space for the signed-in user. A cookie pointing at a
 * space they no longer belong to (or whose owner left PRO) falls back to
 * their own, mirroring getSpace() on the server.
 */
export async function loadActiveSpace(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  userName: string
): Promise<{ space: ActiveSpace; owner?: OwnerSettings }> {
  const { data: rows } = await supabase
    .from('space_members')
    .select('id, owner_id, role')
    .eq('member_id', userId)
    .eq('status', 'active');

  let joined: JoinedSpace[] = [];
  const owners = new Map<string, { name: string; plan: string; default_currency: string; budget_start_day: number }>();
  if (rows?.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, plan, default_currency, budget_start_day')
      .in('id', rows.map((r) => r.owner_id));
    for (const p of profiles ?? []) owners.set(p.id, p);
    // Only PRO owners' spaces are open; the rest wait until they renew.
    joined = rows
      .filter((r) => owners.get(r.owner_id)?.plan === 'PRO')
      .map((r) => ({ membershipId: r.id, ownerId: r.owner_id, ownerName: owners.get(r.owner_id)!.name, role: r.role }));
  }

  const requested = readCookie(SPACE_COOKIE);
  const target = isUuid(requested) ? joined.find((j) => j.ownerId === requested) : undefined;
  if (!target) {
    if (requested && requested !== userId) writeSpaceCookie(null);
    const people = await loadPeople(supabase, userId);
    return { space: { ownerId: userId, ownerName: userName, role: 'owner', isOwn: true, canWrite: true, joined, people } };
  }

  const owner = owners.get(target.ownerId)!;
  return {
    space: {
      ownerId: target.ownerId,
      ownerName: target.ownerName,
      role: target.role,
      isOwn: false,
      canWrite: target.role === 'editor',
      joined,
      people: await loadPeople(supabase, target.ownerId),
    },
    owner: { defaultCurrency: owner.default_currency, budgetStartDay: owner.budget_start_day ?? 1 },
  };
}

/** Who is in a space, to label who recorded each transaction. Empty if unavailable. */
async function loadPeople(supabase: SupabaseClient<any, any, any>, spaceOwner: string): Promise<Record<string, string>> {
  const { data, error } = await supabase.rpc('space_people', { space_owner: spaceOwner });
  if (error || !Array.isArray(data)) return {};
  return Object.fromEntries((data as { id: string; name: string }[]).map((p) => [p.id, p.name]));
}

/** Switches space and reloads, so no data from the previous space lingers in memory. */
export function switchSpace(ownerId: string | null, to = '/dashboard') {
  writeSpaceCookie(ownerId);
  window.location.assign(to);
}
