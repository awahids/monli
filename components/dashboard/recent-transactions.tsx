'use client';

import Link from 'next/link';
import { ReceiptText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TransactionRow } from '@/components/transactions/transaction-row';
import type { Transaction } from '@/types';
import { useT } from '@/lib/i18n';

interface Props {
  transactions: Transaction[];
  onAdd?: () => void;
}

/** The five latest transactions; filtering lives on the Transaksi page. */
export function RecentTransactions({ transactions, onAdd }: Props) {
  const latest = transactions.slice(0, 5);
  const { t } = useT();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t('Transaksi terbaru', 'Recent transactions')}</CardTitle>
        {latest.length > 0 && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/transactions">{t('Lihat semua', 'See all')}</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {latest.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title={t('Belum ada transaksi', 'No transactions yet')}
            description={t('Catat pengeluaran atau pemasukan pertamamu.', 'Record your first expense or income.')}
            action={onAdd && <Button onClick={onAdd}>{t('Catat transaksi', 'Add transaction')}</Button>}
          />
        ) : (
          <div className="divide-y">
            {latest.map((t) => (
              <TransactionRow key={t.id} transaction={t} showDate />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
