'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { CreditCard } from 'lucide-react';
import { formatIDR } from '@/lib/currency';
import { Payment } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PaymentStatusBadge } from '@/components/payments/payment-status-badge';
import { useT } from '@/lib/i18n';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const { t, dateLocale } = useT();

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/payments');
      const data = res.ok ? await res.json() : { payments: [] };
      setPayments(data.payments ?? []);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('Riwayat pembayaran', 'Payment history')}</h1>
        <p className="text-sm text-muted-foreground">{t('Status diperbarui langsung dari Midtrans.', 'Status comes straight from Midtrans.')}</p>
      </div>

      {payments === null ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={t('Belum ada pembayaran', 'No payments yet')}
          description={t('Pembayaran upgrade ke PRO akan muncul di sini.', 'PRO upgrade payments will show up here.')}
          action={
            <Button asChild variant="outline" className="web-only">
              <Link href="/upgrade">{t('Lihat paket PRO', 'See the PRO plan')}</Link>
            </Button>
          }
        />
      ) : (
        <Card className="divide-y">
          {payments.map((p) => (
            <Link
              key={p.id}
              href={`/payments/${p.orderId}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {p.createdAt ? format(new Date(p.createdAt), 'd MMM yyyy, HH:mm', { locale: dateLocale }) : ''}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{formatIDR(p.amount)}</span>
              <PaymentStatusBadge status={p.status} />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
