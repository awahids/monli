import { AI_MONTHLY_LIMITS } from '@/lib/ai-usage';
import { SPACE_MEMBER_LIMIT } from '@/lib/space';

/** PRO price in Rupiah (promo) and the price shown struck through. */
export const PRO_PRICE = 9000;
export const PRO_ORIGINAL_PRICE = 49000;

/** New accounts get PRO free for this long (also in the pro_trial migration). */
export const TRIAL_DAYS = 14;

/** When a trial starting at `from` ends. */
export const trialEnd = (from = new Date()) => new Date(from.getTime() + TRIAL_DAYS * 86_400_000);

/** Whole days left of a PRO trial (rounded up), or null when not on a trial. */
export function trialDaysLeft(proUntil: string | null | undefined, now = new Date()): number | null {
  if (!proUntil) return null;
  return Math.max(0, Math.ceil((new Date(proUntil).getTime() - now.getTime()) / 86_400_000));
}

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

/** String values come as [Indonesian, English]. */
type Value = [string, string] | boolean;
export type PlanFeature = { label: string; labelEn: string; free: Value; pro: Value };

/**
 * What each plan includes, matching the limits enforced in the API
 * (accounts/budgets in /api/accounts and /api/budgets, PRO checks in the
 * reports, OCR and chat routes).
 */
export const PLAN_FEATURES: PlanFeature[] = [
  { label: 'Catat pemasukan, pengeluaran & transfer', labelEn: 'Record income, expenses & transfers', free: true, pro: true },
  {
    label: 'Akun (bank, e-wallet, tunai)',
    labelEn: 'Accounts (bank, e-wallet, cash)',
    free: [`${FREE_LIMITS.accounts} akun`, `${FREE_LIMITS.accounts} account`],
    pro: ['Tanpa batas', 'Unlimited'],
  },
  {
    label: 'Budget bulanan',
    labelEn: 'Monthly budgets',
    free: [`${FREE_LIMITS.budgets} budget`, `${FREE_LIMITS.budgets} budgets`],
    pro: ['Tanpa batas', 'Unlimited'],
  },
  {
    label: 'Transaksi rutin otomatis',
    labelEn: 'Automatic recurring transactions',
    free: [`${FREE_LIMITS.recurring} aturan`, `${FREE_LIMITS.recurring} rules`],
    pro: ['Tanpa batas', 'Unlimited'],
  },
  {
    label: 'Target tabungan',
    labelEn: 'Savings goals',
    free: [`${FREE_LIMITS.goals} target`, `${FREE_LIMITS.goals} goal`],
    pro: ['Tanpa batas', 'Unlimited'],
  },
  { label: 'Rincian budget per kategori', labelEn: 'Budget by category', free: false, pro: true },
  { label: 'Laporan & grafik lengkap', labelEn: 'Full reports & charts', free: false, pro: true },
  { label: 'Saran kategori & tag saat mencatat', labelEn: 'Category & tag suggestions while recording', free: false, pro: true },
  {
    label: 'Scan struk otomatis (OCR)',
    labelEn: 'Automatic receipt scan (OCR)',
    free: false,
    pro: [`${AI_MONTHLY_LIMITS.ocr}x / bulan`, `${AI_MONTHLY_LIMITS.ocr}x / month`],
  },
  {
    label: 'Asisten keuangan AI',
    labelEn: 'AI finance assistant',
    free: false,
    pro: [`${AI_MONTHLY_LIMITS.chat}x / bulan`, `${AI_MONTHLY_LIMITS.chat}x / month`],
  },
  { label: 'Kalkulator zakat dengan harga emas terkini', labelEn: 'Zakat calculator with the live gold price', free: false, pro: true },
  {
    label: 'Kelola bersama keluarga',
    labelEn: 'Share with family',
    free: false,
    pro: [`Hingga ${SPACE_MEMBER_LIMIT} orang`, `Up to ${SPACE_MEMBER_LIMIT} people`],
  },
];
