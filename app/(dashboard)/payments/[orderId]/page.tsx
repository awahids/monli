'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { formatIDR } from '@/lib/currency';
import { Payment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentStatusBadge } from '@/components/payments/payment-status-badge';
import { useAppStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { useT } from '@/lib/i18n';

export default function PaymentDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [payment, setPayment] = useState<Payment | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { setUser } = useAppStore();
  const { t, dateLocale } = useT();

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/payments/${orderId}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setPayment(data.payment);
      // A settled payment upgrades the plan server-side; refresh the user.
      if (data.payment?.status === 'success') {
        const current = await getCurrentUser();
        if (current) setUser(current);
      }
    })();
  }, [orderId, setUser]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <p className="font-medium">{t('Pembayaran tidak ditemukan.', 'Payment not found.')}</p>
        <Button asChild variant="outline">
          <Link href="/payments">{t('Kembali ke riwayat', 'Back to history')}</Link>
        </Button>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="mx-auto max-w-md" aria-busy="true">
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  const rows: [string, React.ReactNode][] = [
    [t('Produk', 'Product'), payment.productName],
    [t('Jumlah', 'Amount'), formatIDR(payment.amount)],
    [t('Status', 'Status'), <PaymentStatusBadge key="s" status={payment.status} />],
    [t('Tanggal', 'Date'), payment.createdAt ? format(new Date(payment.createdAt), 'd MMMM yyyy, HH:mm', { locale: dateLocale }) : '-'],
    [t('No. pesanan', 'Order no.'), <span key="o" className="break-all font-mono text-xs">{payment.orderId}</span>],
  ];

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>{t('Detail pembayaran', 'Payment details')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="divide-y text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-2">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        {payment.status === 'pending' && (
          <p className="text-xs text-muted-foreground">
            Selesaikan pembayaran sesuai instruksi Midtrans. Paket PRO aktif otomatis setelah pembayaran terkonfirmasi.
          </p>
        )}
        <Button asChild variant="outline" className="w-full">
          <Link href={payment.status === 'success' ? '/dashboard' : '/payments'}>
            {payment.status === 'success' ? t('Ke beranda', 'Go home') : t('Kembali ke riwayat', 'Back to history')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
