import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSpace } from '@/lib/auth/server';

export async function GET() {
  const supabase = createServerClient();
  try {
    const space = await getSpace();
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, type, color, icon')
      .eq('user_id', space.ownerId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
