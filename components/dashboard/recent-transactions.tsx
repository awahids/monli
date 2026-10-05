'use client';

import Link from 'next/link';
import { ReceiptText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TransactionRow } from '@/components/transactions/transaction-row';
import type { Transaction } from '@/types';

interface Props {
  transactions: Transaction[];
  onAdd?: () => void;
}

/** The five latest transactions; filtering lives on the Transaksi page. */
export function RecentTransactions({ transactions, onAdd }: Props) {
  const latest = transactions.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Transaksi terbaru</CardTitle>
        {latest.length > 0 && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/transactions">Lihat semua</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {latest.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Belum ada transaksi"
            description="Catat pengeluaran atau pemasukan pertamamu."
            action={onAdd && <Button onClick={onAdd}>Catat transaksi</Button>}
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
