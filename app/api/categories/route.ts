import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSpace, readOnlyResponse } from '@/lib/auth/server';
import { categorySchema } from '@/lib/validation';
import { z } from 'zod';
import { ensureDefaultCategories } from '@/lib/categories';

export async function GET() {
  const supabase = createServerClient();
  try {
    const space = await getSpace();
    await ensureDefaultCategories(supabase, space.ownerId);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', space.ownerId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
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
      .select('*')
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
