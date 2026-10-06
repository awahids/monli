import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSpace, readOnlyResponse } from '@/lib/auth/server';
import { categorySchema } from '@/lib/validation';
import { z } from 'zod';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  let body: Partial<z.infer<typeof categorySchema>>;
  try {
    body = categorySchema.partial().parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    const { data: existing, error: existingError } = await supabase
      .from('categories')
      .select('user_id')
      .eq('id', params.id)
      .single();
    if (existingError || !existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (existing.user_id !== space.ownerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: body.name,
        type: body.type,
        color: body.color,
        icon: body.icon,
      })
      .eq('id', params.id)
      .select('id, name, type, color, icon')
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('user_id')
      .eq('id', params.id)
      .single();
    if (fetchError || !category) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (category.user_id !== space.ownerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { count: txnCount, error: txnError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', params.id)
      .eq('user_id', space.ownerId);
    if (txnError) {
      return NextResponse.json({ error: txnError.message }, { status: 500 });
    }
    if (txnCount && txnCount > 0) {
      return NextResponse.json(
        {
          error:
            'Category is in use. Reassign or remove references before deleting.',
        },
        { status: 409 },
      );
    }

    const { count: itemCount, error: itemError } = await supabase
      .from('budget_items')
      .select('id,budgets!inner(user_id)', { count: 'exact', head: true })
      .eq('category_id', params.id)
      .eq('budgets.user_id', space.ownerId);
    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }
    if (itemCount && itemCount > 0) {
      return NextResponse.json(
        {
          error:
            'Category is in use. Reassign or remove references before deleting.',
        },
        { status: 409 },
      );
    }

    const { error: delError } = await supabase
      .from('categories')
      .delete()
      .eq('id', params.id)
      .eq('user_id', space.ownerId);
    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
