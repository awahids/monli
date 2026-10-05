import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { AI_MONTHLY_LIMITS, getAiUsageCount } from '@/lib/ai-usage';

export const dynamic = 'force-dynamic';

/** Remaining AI quota for this month, shown in the chat panel and OCR button. */
export async function GET() {
  try {
    const user = await getUser();
    const supabase = createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, ai_unlimited')
      .eq('id', user.id)
      .single();
    const unlimited = Boolean(profile?.ai_unlimited);
    const email = user.email ?? '';
    const [chat, ocr] = await Promise.all([
      email ? getAiUsageCount(supabase, email, 'chat') : 0,
      email ? getAiUsageCount(supabase, email, 'ocr') : 0,
    ]);
    return NextResponse.json({
      plan: profile?.plan ?? 'FREE',
      unlimited,
      chat: { used: chat, limit: AI_MONTHLY_LIMITS.chat },
      ocr: { used: ocr, limit: AI_MONTHLY_LIMITS.ocr },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
