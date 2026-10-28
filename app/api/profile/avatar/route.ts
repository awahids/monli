import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { toFile } from 'openai';
import { getUser } from '@/lib/auth/server';
import { AI_MONTHLY_LIMITS, getAiUsageCount, logAiUsage } from '@/lib/ai-usage';
import { CARTOON_PROMPT, imageType, newAvatarSeed } from '@/lib/cartoon-avatar';
import { createSumopodClient, getSumopodImageModel } from '@/lib/sumopod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Redrawing a photo takes the image model up to a minute; 60s is the most
// this Vercel plan allows (as for app/api/chat).
export const maxDuration = 60;

const BUCKET = 'avatars';
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const STYLE_REFERENCE = path.join(process.cwd(), 'lib/avatar/style-reference.png');

/**
 * PRO: turns the uploaded photo into a cartoon in the Qala Saku avatar style
 * and makes it the profile picture. The photo is only passed to the image
 * model, never stored; the cartoon replaces any earlier one.
 */
export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const user = await getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, ai_unlimited, avatar_path')
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

    const client = createSumopodClient();
    const result = await client.images.edit({
      model: getSumopodImageModel(),
      image: [
        await toFile(photo, 'photo', { type: photo.type }),
        await toFile(await readFile(STYLE_REFERENCE), 'style.png', { type: 'image/png' }),
      ],
      prompt: CARTOON_PROMPT,
      size: '1024x1024',
      output_format: 'webp',
    });
    const image = result.data?.[0];
    const bytes = image?.b64_json
      ? Buffer.from(image.b64_json, 'base64')
      : image?.url
        ? Buffer.from(await (await fetch(image.url)).arrayBuffer())
        : null;
    const type = bytes && imageType(bytes);
    if (!bytes || !type) {
      return NextResponse.json({ error: 'AI tidak mengembalikan gambar. Coba lagi dengan foto lain.' }, { status: 502 });
    }

    const admin = createAdminClient();
    const avatarPath = `${user.id}/${crypto.randomUUID()}.${type === 'image/png' ? 'png' : 'webp'}`;
    const upload = await admin.storage.from(BUCKET).upload(avatarPath, bytes, { contentType: type });
    if (upload.error) throw upload.error;
    const { error } = await supabase.from('profiles').update({ avatar_path: avatarPath }).eq('id', user.id);
    if (error) {
      await admin.storage.from(BUCKET).remove([avatarPath]);
      throw error;
    }
    if (profile.avatar_path) await admin.storage.from(BUCKET).remove([profile.avatar_path]);
    // Only cartoons that were made count towards the quota.
    if (user.email) await logAiUsage(supabase, user.email, 'avatar');
    return NextResponse.json({ avatarPath });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : '';
    // A gateway without the image model answers with 404, "model not found" or
    // (LiteLLM, when the key has no access to it) 400 "Invalid model name".
    if (/404|not found|does not exist|unsupported|invalid model/i.test(message)) {
      return NextResponse.json({ error: 'Layanan AI gambar belum tersedia. Coba lagi nanti.' }, { status: 503 });
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
