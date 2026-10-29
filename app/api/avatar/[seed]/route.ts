import { avatarSvg, avatarTraits } from '@/lib/cartoon-avatar';

/** A seed is a stored "Acak lagi" seed or an account id (components/brand/user-avatar.tsx). */
const SEED = /^[0-9A-Za-z-]{1,64}$/;

/**
 * The drawn avatar for a seed, as an image: drawn here rather than in the
 * browser so the illustrations stay out of every page's JavaScript.
 */
export async function GET(_req: Request, props: { params: Promise<{ seed: string }> }) {
  const { seed } = await props.params;
  if (!SEED.test(seed)) return new Response('Not found', { status: 404 });
  return new Response(avatarSvg(avatarTraits(seed)), {
    headers: {
      'Content-Type': 'image/svg+xml',
      // The same seed always draws the same picture, until a deploy changes the drawing.
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
