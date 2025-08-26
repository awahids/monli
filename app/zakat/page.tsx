import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import ZakatCalculator from './zakat-calculator';

export const metadata: Metadata = {
  title: 'Kalkulator Zakat - Monli',
  description: 'Hitung kewajiban zakatmu dengan kalkulator zakat Monli.',
  robots: { index: false, follow: false },
};

export default async function ZakatPage() {
  const supabase = createServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/auth/sign-in?next=/zakat');

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, live_price_used_at')
    .eq('id', auth.user.id)
    .single();
  const plan = profile?.plan === 'PRO' ? 'PRO' : 'FREE';

  const usedAt = profile?.live_price_used_at
    ? new Date(profile.live_price_used_at)
    : null;
  const now = new Date();
  const canUseLivePrice =
    plan === 'PRO' && (!usedAt || usedAt.getUTCFullYear() !== now.getUTCFullYear());

  return <ZakatCalculator plan={plan} canUseLivePrice={canUseLivePrice} />;
}
