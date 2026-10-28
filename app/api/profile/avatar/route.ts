import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { AI_MONTHLY_LIMITS, getAiUsageCount, logAiUsage } from '@/lib/ai-usage';
import { PHOTO_TRAITS_PROMPT, newAvatarSeed, parsePhotoTraits, seedForTraits } from '@/lib/cartoon-avatar';
import { createSumopodAvatarClient, getSumopodAvatarModel } from '@/lib/sumopod';
import { createClient } from '@/lib/supabase/server';

// Reading a photo takes seconds, but allow as long as app/api/chat in case the model is slow.
export const maxDuration = 60;

const BUCKET = 'avatars';
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/**
 * PRO: a drawn avatar that looks like the uploaded photo. The AI only reads
 * the photo (skin, hair or hijab, glasses, clothes, expression); the look is
 * kept as the seed that draws it and the photo is never stored. Drops an
 * earlier AI cartoon, if any.
 */
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
      return NextResponse.json({ error: 'Foto kartun dari AI khusus paket PRO.' }, { status: 403 });
    }
    if (user.email && !profile.ai_unlimited) {
      const count = await getAiUsageCount(supabase, user.email, 'avatar');
      if (count >= AI_MONTHLY_LIMITS.avatar) {
        return NextResponse.json(
          { error: `Kuota foto kartun bulan ini (${AI_MONTHLY_LIMITS.avatar}x) sudah habis. Kuota direset tiap awal bulan.` },
          { status: 403 }
        );
      }
    }

    const photo = (await req.formData()).get('file');
    if (!(photo instanceof File) || !PHOTO_TYPES.includes(photo.type)) {
      return NextResponse.json({ error: 'Pilih foto JPG, PNG, atau WebP.' }, { status: 400 });
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: 'Foto terlalu besar, maksimal 8 MB.' }, { status: 400 });
    }

    const completion = await createSumopodAvatarClient().chat.completions.create({
      model: getSumopodAvatarModel(),
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PHOTO_TRAITS_PROMPT },
            {
              type: 'image_url',
              // Low detail is enough to tell hair, glasses and colours apart, at a fraction of the cost.
              image_url: { url: `data:${photo.type};base64,${Buffer.from(await photo.arrayBuffer()).toString('base64')}`, detail: 'low' },
            },
          ],
        },
      ],
    });
    const traits = parsePhotoTraits(completion.choices[0]?.message?.content ?? '');
    if (traits === null) {
      return NextResponse.json({ error: 'Wajah di foto kurang jelas. Coba foto lain yang menghadap ke depan.' }, { status: 422 });
    }
    if (!traits) {
      return NextResponse.json({ error: 'AI tidak bisa membaca foto ini. Coba lagi dengan foto lain.' }, { status: 502 });
    }

    const res = await reset(seedForTraits(traits));
    // Only cartoons that were made count towards the quota.
    if (res.ok && user.email) await logAiUsage(supabase, user.email, 'avatar');
    return res;
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : '';
    // A model the key cannot use: 404, "model not found", or LiteLLM's 400 "Invalid model name".
    if (/404|not found|does not exist|unsupported|invalid model/i.test(message)) {
      return NextResponse.json({ error: 'Layanan AI foto kartun belum tersedia. Coba lagi nanti.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Gagal membuat foto kartun. Coba lagi.' }, { status: 500 });
  }
}

/** "Acak lagi": a new drawn avatar. Also drops the AI cartoon, if any. */
export async function PATCH() {
  return reset(newAvatarSeed());
}

/** Back to the drawn avatar, keeping the same face. */
export async function DELETE() {
  return reset(undefined);
}

async function reset(seed: string | undefined) {
  try {
    const supabase = createClient();
    const user = await getUser();
    const { data: profile } = await supabase.from('profiles').select('avatar_path').eq('id', user.id).single();
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_path: null, ...(seed ? { avatar_seed: seed } : {}) })
      .eq('id', user.id)
      .select('avatar_seed')
      .single();
    if (error) throw error;
    if (profile?.avatar_path) await supabase.storage.from(BUCKET).remove([profile.avatar_path]);
    return NextResponse.json({ avatarSeed: data.avatar_seed, avatarPath: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Gagal mengganti foto profil.' }, { status: 500 });
  }
}
