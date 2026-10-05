import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { DB_SCHEMA } from '@/lib/supabase/schema';
import { ensureProfile } from '@/lib/profile';
import { ensureDefaultCategories } from '@/lib/categories';

export const dynamic = 'force-dynamic';

/** Only same-site paths, so the callback can't be used as an open redirect. */
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
}

/**
 * Google sign-in lands here with ?code=…. Exchange it for a session (stored
 * in cookies), make sure the user has a Qala Saku profile, then continue.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));
  const failed = (reason: string) =>
    NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent(reason)}`);

  if (!code) return failed(searchParams.get('error_description') ?? 'missing_code');

  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: DB_SCHEMA },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return failed('oauth');

  const profile = await ensureProfile(supabase, data.user);
  if (!profile) return failed('profile');
  await ensureDefaultCategories(supabase, data.user.id);

  return NextResponse.redirect(`${origin}${next}`);
}
