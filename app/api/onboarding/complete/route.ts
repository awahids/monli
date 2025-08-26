import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';

export async function POST() {
  const supabase = createServerClient();
  try {
    const user = await getUser();
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
