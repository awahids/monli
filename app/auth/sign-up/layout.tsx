import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { TRIAL_DAYS } from '@/lib/plans';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: `Daftar ${BRAND.name} — Coba PRO gratis ${TRIAL_DAYS} hari`,
  description: `Buat akun ${BRAND.name} dengan Google atau email. Akun baru langsung dapat semua fitur PRO gratis ${TRIAL_DAYS} hari, tanpa kartu kredit.`,
  alternates: { canonical: '/auth/sign-up' },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
