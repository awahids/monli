import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSpace, readOnlyResponse } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/** Undoes a payment; the trigger reverses its balance change and `paid`. */
export async function DELETE(_req: Request, { params }: { params: { id: string; entryId: string } }) {
  const supabase = createClient();
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    const { error } = await supabase
      .from('debt_entries')
      .delete()
      .eq('id', params.entryId)
      .eq('debt_id', params.id)
      .eq('kind', 'payment')
      .eq('user_id', space.ownerId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
