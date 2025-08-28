import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { createSumopodClient, getSumopodModel } from '@/lib/sumopod';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const supabase = createClient();
    const user = await getUser();

    if (!user.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { count } = await supabase
      .from('ai_logs')
      .select('*', { count: 'exact', head: true })
      .eq('email', user.email)
      .eq('feature', 'chat');
    if ((count ?? 0) >= 10) {
      return NextResponse.json(
        { error: 'Chat usage limit reached' },
        { status: 403 }
      );
    }

    await supabase.from('ai_logs').insert({
      email: user.email,
      feature: 'chat',
    });

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, default_currency')
      .eq('id', user.id)
      .single();
    const { data: transactions } = await supabase
      .from('transactions')
      .select('date, amount, note')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10);

    const context = JSON.stringify({ profile, transactions });

    const client = createSumopodClient();
    const model = getSumopodModel();
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful financial assistant. Use the provided user data to answer questions.',
        },
        {
          role: 'user',
          content: `User data: ${context}\n\n${message}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const answer = completion.choices[0]?.message?.content || '';
    return NextResponse.json({ answer });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : 'Failed to process chat';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
