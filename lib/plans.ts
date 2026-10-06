import { AI_MONTHLY_LIMITS } from '@/lib/ai-usage';
import { SPACE_MEMBER_LIMIT } from '@/lib/space';

/** PRO price in Rupiah (promo) and the price shown struck through. */
export const PRO_PRICE = 9000;
export const PRO_ORIGINAL_PRICE = 49000;

/** FREE-plan caps enforced by the API routes of each feature. */
export const FREE_LIMITS = { accounts: 1, budgets: 2, recurring: 3, goals: 1 } as const;

/**
 * Plan that governs data features in the active space. A shared space always
 * belongs to a PRO owner, so members get PRO limits there; AI and zakat stay
 * tied to the member's own plan.
 */
export function spacePlan(
  user: { plan: 'FREE' | 'PRO' } | null,
  space: { isOwn: boolean } | null
): 'FREE' | 'PRO' {
  return space && !space.isOwn ? 'PRO' : user?.plan ?? 'FREE';
}

export type PlanFeature = { label: string; free: string | boolean; pro: string | boolean };

/**
 * What each plan includes, matching the limits enforced in the API
 * (accounts/budgets in /api/accounts and /api/budgets, PRO checks in the
 * reports, OCR and chat routes).
 */
export const PLAN_FEATURES: PlanFeature[] = [
  { label: 'Catat pemasukan, pengeluaran & transfer', free: true, pro: true },
  { label: 'Akun (bank, e-wallet, tunai)', free: `${FREE_LIMITS.accounts} akun`, pro: 'Tanpa batas' },
  { label: 'Budget bulanan', free: `${FREE_LIMITS.budgets} budget`, pro: 'Tanpa batas' },
  { label: 'Transaksi rutin otomatis', free: `${FREE_LIMITS.recurring} aturan`, pro: 'Tanpa batas' },
  { label: 'Target tabungan', free: `${FREE_LIMITS.goals} target`, pro: 'Tanpa batas' },
  { label: 'Rincian budget per kategori', free: false, pro: true },
  { label: 'Laporan & grafik lengkap', free: false, pro: true },
  { label: 'Scan struk otomatis (OCR)', free: false, pro: `${AI_MONTHLY_LIMITS.ocr}x / bulan` },
  { label: 'Asisten keuangan AI', free: false, pro: `${AI_MONTHLY_LIMITS.chat}x / bulan` },
  { label: 'Kalkulator zakat dengan harga emas terkini', free: false, pro: true },
  { label: 'Kelola bersama keluarga', free: false, pro: `Hingga ${SPACE_MEMBER_LIMIT} orang` },
];
