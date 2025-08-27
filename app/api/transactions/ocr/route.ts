import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { createSumopodClient, getSumopodModel } from '@/lib/sumopod';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const user = await getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
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

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are an OCR assistant that extracts transaction details from shopping receipts. Respond in JSON.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract line items with description and amount, the total amount (in numbers) and purchase date (yyyy-mm-dd) from this receipt image. Reply with JSON {"items":[{"description":string,"amount":number}],"total":number,"date":string|null}.',
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
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let data: any = {};
    try {
      data = JSON.parse(content);
    } catch {
      data = {};
    }

    const items = Array.isArray(data.items)
      ? data.items.map((it: any) => ({
          description: it.description ?? '',
          amount: it.amount ?? 0,
        }))
      : [];

    return NextResponse.json({
      items,
      total: data.total ?? 0,
      date: data.date ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Failed to parse receipt' },
      { status: 500 }
    );
  }
}
