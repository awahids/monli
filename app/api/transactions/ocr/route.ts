import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { createSumopodClient, getSumopodModel } from '@/lib/sumopod';
import { createClient } from '@/lib/supabase/server';
import { AI_MONTHLY_LIMITS, getAiUsageCount, logAiUsage } from '@/lib/ai-usage';
import { OCR_PROMPT, parseOcrReply } from '@/lib/ocr';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const user = await getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, ai_unlimited')
      .eq('id', user.id)
      .single();
    if (profile?.plan !== 'PRO') {
      return NextResponse.json(
        { error: 'Receipt OCR is available for PRO plan only' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const client = createSumopodClient();
    const model = getSumopodModel();

    if (user.email && !profile?.ai_unlimited) {
      const count = await getAiUsageCount(supabase, user.email, 'ocr');
      if (count >= AI_MONTHLY_LIMITS.ocr) {
        return NextResponse.json(
          { error: `Kuota scan struk bulan ini (${AI_MONTHLY_LIMITS.ocr}x) sudah habis. Kuota direset tiap awal bulan.` },
          { status: 403 }
        );
      }
    }

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You extract transactions from receipts and bank or e-wallet transaction history screenshots. Respond in JSON.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: OCR_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${file.type};base64,${base64}`,
              },
            },
          ],
        },
      ],
      temperature: 0,
      // A history screenshot can hold a dozen rows; 500 cut the JSON off.
      max_tokens: 2000,
    });

    const result = parseOcrReply(completion.choices[0]?.message?.content ?? '');
    if (!result.items.length && !result.total) {
      return NextResponse.json(
        { error: 'Tidak ada transaksi yang terbaca. Coba foto yang lebih jelas dan tegak.' },
        { status: 422 }
      );
    }
    // Only successful scans count towards the quota.
    if (user.email) await logAiUsage(supabase, user.email, 'ocr');
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : 'Failed to parse receipt';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
