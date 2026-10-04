'use client';

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { ArrowRightLeft } from 'lucide-react';
import type { Transaction } from '@/types';
import { CategoryIcon } from '@/components/transactions/category-icon';
import { formatMoney } from '@/lib/currency';
import { cn } from '@/lib/utils';

export function transactionTitle(t: Transaction): string {
  if (t.note) return t.note;
  if (t.type === 'transfer') {
    return `Transfer ${t.fromAccount?.name ?? ''} → ${t.toAccount?.name ?? ''}`.trim();
  }
  return t.category?.name ?? (t.type === 'income' ? 'Pemasukan' : 'Pengeluaran');
}

export function signedAmount(t: Transaction): { text: string; className: string } {
  if (t.type === 'income') return { text: `+${formatMoney(t.amount)}`, className: 'text-green-600 dark:text-green-400' };
  if (t.type === 'expense') return { text: `-${formatMoney(t.amount)}`, className: 'text-foreground' };
  return { text: formatMoney(t.amount), className: 'text-blue-600 dark:text-blue-400' };
}

interface Props {
  transaction: Transaction;
  showDate?: boolean;
  onClick?: () => void;
}

/** One transaction line: icon, title, account · category, signed amount. */
export function TransactionRow({ transaction: t, showDate = false, onClick }: Props) {
  const amount = signedAmount(t);
  const meta = [
    t.type === 'transfer'
      ? `${t.fromAccount?.name ?? '?'} → ${t.toAccount?.name ?? '?'}`
      : t.account?.name,
    t.note && t.type !== 'transfer' ? t.category?.name : undefined,
    showDate && t.actualDate
      ? format(new Date(`${t.actualDate}T00:00:00`), 'd MMM', { locale: localeId })
      : undefined,
  ].filter(Boolean);

  const content = (
    <>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={
          t.type === 'transfer'
            ? undefined
            : { backgroundColor: `${t.category?.color || '#6B7280'}1f`, color: t.category?.color || undefined }
        }
      >
        {t.type === 'transfer' ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ArrowRightLeft className="h-4 w-4" />
          </span>
        ) : (
          <CategoryIcon name={t.category?.icon} className="h-4 w-4" />
        )}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium">{transactionTitle(t)}</span>
        {meta.length > 0 && (
          <span className="block truncate text-xs text-muted-foreground">{meta.join(' · ')}</span>
        )}
      </span>
      <span className={cn('shrink-0 text-sm font-semibold tabular-nums', amount.className)}>
        {amount.text}
      </span>
    </>
  );

  if (!onClick) {
    return <div className="flex items-center gap-3 px-1 py-2.5">{content}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </button>
  );
}
