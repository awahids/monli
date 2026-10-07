import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSpace } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/**
 * The space's recent transactions with a note or tags (note, category, tags
 * only), used to suggest tags and a category in the transaction form. PRO only.
 */
export async function GET() {
  const supabase = createServerClient();
  try {
    const space = await getSpace();
    // A shared space is always PRO (getSpace checks the owner's plan).
    if (space.role === 'owner') {
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', space.ownerId).maybeSingle();
      if (profile?.plan !== 'PRO') return NextResponse.json({ error: 'PRO only', rows: [] }, { status: 403 });
    }
    const { data, error } = await supabase
      .from('transactions')
      .select('note, category_id, tags')
      .eq('user_id', space.ownerId)
      .or('note.neq.,tags.neq.{}')
      .order('actual_date', { ascending: false })
      .limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({
      rows: (data ?? []).map((r) => ({ note: r.note, categoryId: r.category_id, tags: r.tags ?? [] })),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
