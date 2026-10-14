'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { PLAN_FEATURES, PRO_PLANS, YEARLY_SAVING, type ProPeriod, trialDaysLeft } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatIDR } from '@/lib/currency';
import { useAppStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import type { SnapResult } from '@/types/snap';
import { useT } from '@/lib/i18n';

export default function UpgradePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const { t, dateLocale } = useT();
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
  const [checkingOut, setCheckingOut] = useState(false);
  const [period, setPeriod] = useState<ProPeriod>('yearly');

  useEffect(() => {
    const script = document.createElement('script');
    const snapUrl =
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.src = snapUrl;
    script.setAttribute('data-client-key', clientKey);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [clientKey]);

  async function handleUpgrade() {
    setCheckingOut(true);
    try {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast({ description: error || 'Gagal memulai pembayaran', variant: 'destructive' });
        return;
      }
      const { token, orderId } = await res.json();
      if (window.snap) {
        // The server re-checks every status with Midtrans; the browser only
        // asks it to refresh.
        const refresh = async (id: string) => {
          const r = await fetch(`/api/payments/${id}`);
          const data = await r.json().catch(() => ({}));
          if (data.payment?.status === 'success') {
            const current = await getCurrentUser();
            if (current) setUser(current);
          }
          return data.payment?.status as string | undefined;
        };
        window.snap.pay(token, {
          onSuccess: async (result: SnapResult) => {
            const status = await refresh(result.order_id);
            toast({
              description:
                status === 'success'
                  ? t('Pembayaran berhasil, PRO sudah aktif', 'Payment successful, PRO is active')
                  : t('Pembayaran diterima, menunggu konfirmasi', 'Payment received, waiting for confirmation'),
            });
            router.push(`/payments/${result.order_id}`);
          },
          onPending: async (result: SnapResult) => {
            await refresh(result.order_id);
            toast({ description: t('Menunggu pembayaran diselesaikan', 'Waiting for the payment to complete') });
            router.push(`/payments/${result.order_id}`);
          },
          onError: async (result: SnapResult) => {
            await refresh(result.order_id);
            toast({ description: t('Pembayaran gagal', 'Payment failed'), variant: 'destructive' });
          },
          onClose: async () => {
            await refresh(orderId);
            toast({ description: t('Jendela pembayaran ditutup', 'Payment window closed') });
          },
        });
      } else {
        toast({ description: t('Modul pembayaran belum termuat, coba lagi sebentar', 'The payment module has not loaded yet, try again shortly'), variant: 'destructive' });
      }
    } catch (e) {
      toast({
        description: (e as Error).message || t('Gagal memulai pembayaran', 'Could not start the payment'),
        variant: 'destructive',
      });
    } finally {
      setCheckingOut(false);
    }
  }

  if (!user) return null;

  const renderValue = (value: [string, string] | boolean) =>
    value === true ? (
      <Check className="mx-auto h-4 w-4 text-primary" aria-label={t('Termasuk', 'Included')} />
    ) : value === false ? (
      <Minus className="mx-auto h-4 w-4 text-muted-foreground/60" aria-label={t('Tidak termasuk', 'Not included')} />
    ) : (
      <span className="text-xs">{t(...value)}</span>
    );

  // PRO with an end date (trial or a paid period) can always buy more time.
  if (user.plan === 'PRO' && !user.proUntil) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-gold" /> {t('Kamu sudah PRO', "You're on PRO")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">{t('Semua fitur ini sudah aktif di akunmu:', 'All these features are active on your account:')}</p>
            <ul className="space-y-2">
              {PLAN_FEATURES.filter((f) => f.free !== true).map((f) => (
                <li key={f.label} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  <span>
                    {t(f.label, f.labelEn)}
                    {Array.isArray(f.pro) && (
                      <span className="text-muted-foreground"> · {t(...f.pro)}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full">
              <Link href="/payments">{t('Riwayat pembayaran', 'Payment history')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {user.plan === 'PRO' ? t('Perpanjang Qala Saku PRO', 'Extend Qala Saku PRO') : t('Upgrade ke Qala Saku PRO', 'Upgrade to Qala Saku PRO')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t(
            'Scan struk, asisten AI, laporan lengkap, dan akun maupun budget tanpa batas.',
            'Receipt scan, AI assistant, full reports, and unlimited accounts and budgets.'
          )}
        </p>
        {user.proUntil && (
          <p className="mt-3 inline-block rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
            {t(
              `PRO aktif sampai ${format(new Date(user.proUntil), 'd MMM yyyy', { locale: dateLocale })} · sisa ${trialDaysLeft(user.proUntil)} hari`,
              `PRO until ${format(new Date(user.proUntil), 'd MMM yyyy', { locale: dateLocale })} · ${trialDaysLeft(user.proUntil)} days left`
            )}
          </p>
        )}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium">{t('Fitur', 'Feature')}</th>
              <th className="w-24 px-2 py-3 text-center font-medium">FREE</th>
              <th className="w-28 px-2 py-3 text-center font-semibold text-primary">PRO</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {PLAN_FEATURES.map((f) => (
              <tr key={f.label}>
                <td className="px-4 py-3">{t(f.label, f.labelEn)}</td>
                <td className="px-2 py-3 text-center text-muted-foreground">{renderValue(f.free)}</td>
                <td className="bg-accent/40 px-2 py-3 text-center font-medium">{renderValue(f.pro)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div role="radiogroup" aria-label={t('Pilih periode', 'Choose a period')} className="grid grid-cols-2 gap-3">
            {(['monthly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={period === p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'rounded-xl border p-4 text-left transition-colors',
                  period === p ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'
                )}
              >
                <span className="flex items-center justify-between gap-2 text-sm font-medium">
                  {p === 'monthly' ? t('Bulanan', 'Monthly') : t('Tahunan', 'Yearly')}
                  {p === 'yearly' && (
                    <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                      {t(`Hemat ${YEARLY_SAVING}%`, `Save ${YEARLY_SAVING}%`)}
                    </span>
                  )}
                </span>
                <span className="mt-1 block font-display text-2xl font-bold">{formatIDR(PRO_PLANS[p].price)}</span>
                <span className="text-xs text-muted-foreground">
                  {p === 'monthly' ? t('untuk 1 bulan', 'for 1 month') : t('untuk 12 bulan', 'for 12 months')}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              'Bayar sekali per periode, tanpa tagihan otomatis. Kalau PRO masih aktif, masa barunya ditambahkan setelah masa sekarang.',
              'Pay once per period, nothing renews by itself. If PRO is still active, the new period starts after the current one.'
            )}
          </p>
          <Button size="lg" onClick={handleUpgrade} disabled={checkingOut}>
            {checkingOut
              ? t('Memproses...', 'Processing...')
              : user.plan === 'PRO'
                ? t('Perpanjang sekarang', 'Extend now')
                : t('Upgrade sekarang', 'Upgrade now')}
          </Button>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        {t(
          'Pembayaran aman lewat Midtrans (transfer bank, e-wallet, QRIS, kartu). Paket aktif otomatis setelah pembayaran terkonfirmasi.',
          'Secure payment through Midtrans (bank transfer, e-wallet, QRIS, card). The plan activates once payment is confirmed.'
        )}
      </p>
    </div>
  );
}
