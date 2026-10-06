import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSpace } from '@/lib/auth/server';

export async function GET(req: Request) {
  const supabase = createServerClient();
  try {
    const space = await getSpace();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const type = (searchParams.get('type') as 'expense' | 'income') ?? 'expense';
    if (!month) {
      return NextResponse.json({ error: 'month is required' }, { status: 400 });
    }
    if (type !== 'expense' && type !== 'income') {
      return NextResponse.json({ error: 'invalid type' }, { status: 400 });
    }
    const { data, error } = await supabase.rpc('space_budget_vs_actual', {
      month_in: month,
      type_in: type,
      space_owner: space.ownerId,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ month, type, data: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
