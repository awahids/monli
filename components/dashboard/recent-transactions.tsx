'use client';

import Link from 'next/link';
import { ReceiptText } from 'lucide-react';
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
    <section className="space-y-1">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t('Transaksi terbaru', 'Recent transactions')}</h2>
        {latest.length > 0 && (
          <Link href="/transactions" className="text-sm text-muted-foreground hover:text-foreground">
            {t('Lihat semua', 'See all')}
          </Link>
        )}
      </div>
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
    </section>
  );
}
