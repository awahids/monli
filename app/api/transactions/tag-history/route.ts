import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/**
 * The user's recent tagged transactions (note, category, tags only), used
 * to suggest tags in the transaction form.
 */
export async function GET() {
  const supabase = createServerClient();
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from('transactions')
      .select('note, category_id, tags')
      .eq('user_id', user.id)
      .neq('tags', '{}')
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
