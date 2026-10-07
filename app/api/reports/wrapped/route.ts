import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSpace } from '@/lib/auth/server';
import { selectAll } from '@/lib/select-all';
import { buildWrapped, type WrappedTx } from '@/lib/wrapped';

export const dynamic = 'force-dynamic';

/** The year in numbers (calendar year, by actual date). */
export async function GET(req: Request) {
  const supabase = createServerClient();
  const year = Number(new URL(req.url).searchParams.get('year'));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: 'invalid year' }, { status: 400 });
  }
  try {
    const space = await getSpace();
    const { data, error } = await selectAll((from, to) =>
      supabase
        .from('transactions')
        .select('type, amount, actual_date, note, category:categories(name, color)')
        .eq('user_id', space.ownerId)
        .gte('actual_date', `${year}-01-01`)
        .lte('actual_date', `${year}-12-31`)
        .order('id')
        .range(from, to)
        .returns<WrappedTx[]>()
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(buildWrapped(year, data ?? []));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
