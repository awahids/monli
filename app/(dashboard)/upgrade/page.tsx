'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Sparkles } from 'lucide-react';
import { PLAN_FEATURES, PRO_ORIGINAL_PRICE, PRO_PRICE } from '@/lib/plans';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatIDR } from '@/lib/currency';
import { useAppStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import type { SnapResult } from '@/types/snap';

export default function UpgradePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
  const [checkingOut, setCheckingOut] = useState(false);

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
      const res = await fetch('/api/upgrade', { method: 'POST' });
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
                  ? 'Pembayaran berhasil, PRO sudah aktif'
                  : 'Pembayaran diterima, menunggu konfirmasi',
            });
            router.push(`/payments/${result.order_id}`);
          },
          onPending: async (result: SnapResult) => {
            await refresh(result.order_id);
            toast({ description: 'Menunggu pembayaran diselesaikan' });
            router.push(`/payments/${result.order_id}`);
          },
          onError: async (result: SnapResult) => {
            await refresh(result.order_id);
            toast({ description: 'Pembayaran gagal', variant: 'destructive' });
          },
          onClose: async () => {
            await refresh(orderId);
            toast({ description: 'Jendela pembayaran ditutup' });
          },
        });
      } else {
        toast({ description: 'Modul pembayaran belum termuat, coba lagi sebentar', variant: 'destructive' });
      }
    } catch (e) {
      toast({
        description: (e as Error).message || 'Gagal memulai pembayaran',
        variant: 'destructive',
      });
    } finally {
      setCheckingOut(false);
    }
  }

  if (!user) return null;

  const discount = Math.round(((PRO_ORIGINAL_PRICE - PRO_PRICE) / PRO_ORIGINAL_PRICE) * 100);
  const renderValue = (value: string | boolean) =>
    value === true ? (
      <Check className="mx-auto h-4 w-4 text-primary" aria-label="Termasuk" />
    ) : value === false ? (
      <Minus className="mx-auto h-4 w-4 text-muted-foreground/60" aria-label="Tidak termasuk" />
    ) : (
      <span className="text-xs">{value}</span>
    );

  if (user.plan === 'PRO') {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-gold" /> Kamu sudah PRO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">Semua fitur ini sudah aktif di akunmu:</p>
            <ul className="space-y-2">
              {PLAN_FEATURES.filter((f) => f.free !== true).map((f) => (
                <li key={f.label} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  <span>
                    {f.label}
                    {typeof f.pro === 'string' && (
                      <span className="text-muted-foreground"> · {f.pro}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full">
              <Link href="/payments">Riwayat pembayaran</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Upgrade ke Qala Saku PRO</h1>
        <p className="mt-2 text-muted-foreground">
          Scan struk, asisten AI, laporan lengkap, dan akun maupun budget tanpa batas.
        </p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Fitur</th>
              <th className="w-24 px-2 py-3 text-center font-medium">FREE</th>
              <th className="w-28 px-2 py-3 text-center font-semibold text-primary">PRO</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {PLAN_FEATURES.map((f) => (
              <tr key={f.label}>
                <td className="px-4 py-3">{f.label}</td>
                <td className="px-2 py-3 text-center text-muted-foreground">{renderValue(f.free)}</td>
                <td className="bg-accent/40 px-2 py-3 text-center font-medium">{renderValue(f.pro)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div>
            <p className="text-sm text-muted-foreground">Harga promo · sekali bayar</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold">{formatIDR(PRO_PRICE)}</span>
              <span className="text-sm text-muted-foreground line-through">{formatIDR(PRO_ORIGINAL_PRICE)}</span>
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                -{discount}%
              </span>
            </div>
          </div>
          <Button size="lg" onClick={handleUpgrade} disabled={checkingOut}>
            {checkingOut ? 'Memproses...' : 'Upgrade sekarang'}
          </Button>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        Pembayaran aman lewat Midtrans (transfer bank, e-wallet, QRIS, kartu). Paket aktif otomatis
        setelah pembayaran terkonfirmasi.
      </p>
    </div>
  );
}
