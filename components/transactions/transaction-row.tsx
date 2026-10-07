'use client';

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { ArrowRightLeft, Paperclip } from 'lucide-react';
import type { Transaction } from '@/types';
import { CategoryIcon } from '@/components/transactions/category-icon';
import { formatMoney } from '@/lib/currency';
import { useAppStore } from '@/lib/store';
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

/**
 * Who recorded a transaction, when the space is used by more than one person.
 * Unknown for entries from before sharing or by someone who has since left.
 */
function useRecorder(createdBy?: string | null): string | undefined {
  const userId = useAppStore((s) => s.user?.id);
  const people = useAppStore((s) => s.space?.people);
  if (!createdBy || !people || Object.keys(people).length < 2) return undefined;
  if (createdBy === userId) return 'oleh Kamu';
  const name = people[createdBy];
  return name ? `oleh ${name.split(' ')[0]}` : undefined;
}

/** One transaction line: icon, title, account · category, signed amount. */
export function TransactionRow({ transaction: t, showDate = false, onClick }: Props) {
  const amount = signedAmount(t);
  const recorder = useRecorder(t.createdBy);
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
        <span className="flex items-center gap-1 text-sm font-medium">
          <span className="truncate">{transactionTitle(t)}</span>
          {t.receiptPath && <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Ada foto struk" />}
        </span>
        {(meta.length > 0 || recorder) && (
          <span className="flex min-w-0 text-xs text-muted-foreground">
            <span className="truncate">{meta.join(' · ')}</span>
            {/* Kept outside the truncated part so it stays visible on narrow screens. */}
            {recorder && (
              <span className="shrink-0 whitespace-pre">
                {meta.length > 0 ? ' · ' : ''}
                {recorder}
              </span>
            )}
          </span>
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
