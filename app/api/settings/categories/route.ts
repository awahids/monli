import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSpace, readOnlyResponse } from '@/lib/auth/server';
import { categorySchema } from '@/lib/validation';
import { z } from 'zod';
import { ensureDefaultCategories } from '@/lib/categories';

const querySchema = z.object({
  type: z.enum(['expense', 'income', 'all']).optional(),
  q: z.string().optional(),
});

export async function GET(req: Request) {
  const supabase = createServerClient();
  let params: z.infer<typeof querySchema>;
  try {
    params = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
  try {
    const space = await getSpace();
    await ensureDefaultCategories(supabase, space.ownerId);
    let query = supabase
      .from('categories')
      .select('id, name, type, color, icon')
      .eq('user_id', space.ownerId);
    if (params.type && params.type !== 'all') {
      query = query.eq('type', params.type);
    }
    if (params.q) {
      query = query.ilike('name', `%${params.q}%`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  let body: z.infer<typeof categorySchema>;
  try {
    body = categorySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: space.ownerId,
        name: body.name,
        type: body.type,
        color: body.color,
        icon: body.icon,
      })
      .select('id, name, type, color, icon')
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
