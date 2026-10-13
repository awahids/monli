import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: `Masuk ke ${BRAND.name}`,
  description: `Masuk ke akun ${BRAND.name} untuk mencatat pemasukan dan pengeluaran, mengatur budget, dan memantau tabungan.`,
  alternates: { canonical: '/auth/sign-in' },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
