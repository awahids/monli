'use client';

import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface Step {
  done: boolean;
  title: string;
  description: string;
  action: React.ReactNode;
}

interface GettingStartedProps {
  hasAccount: boolean;
  hasTransaction: boolean;
  hasBudget: boolean;
  onAddTransaction: () => void;
  onDismiss: () => void;
}

/**
 * First-run checklist: create an account, record a transaction, set a budget.
 * Replaces the old menu tour, which pointed at links but didn't help fill
 * the empty dashboard.
 */
export function GettingStarted({
  hasAccount,
  hasTransaction,
  hasBudget,
  onAddTransaction,
  onDismiss,
}: GettingStartedProps) {
  const { t } = useT();
  const steps: Step[] = [
    {
      done: hasAccount,
      title: t('Tambahkan akun pertama', 'Add your first account'),
      description: t('Rekening bank, e-wallet, atau dompet tunai beserta saldonya saat ini.', 'A bank account, e-wallet or cash wallet with its current balance.'),
      action: (
        <Button asChild size="sm">
          <Link href="/accounts">{t('Tambah akun', 'Add account')}</Link>
        </Button>
      ),
    },
    {
      done: hasTransaction,
      title: t('Catat transaksi pertama', 'Record your first transaction'),
      description: t('Pengeluaran atau pemasukan hari ini, cukup beberapa detik.', "Today's expense or income, in a few seconds."),
      action: (
        <Button size="sm" onClick={onAddTransaction} disabled={!hasAccount}>
          {t('Catat transaksi', 'Add transaction')}
        </Button>
      ),
    },
    {
      done: hasBudget,
      title: t('Buat budget bulan ini', "Create this month's budget"),
      description: t('Tentukan batas belanja per kategori supaya tidak kebablasan.', 'Set spending limits per category so you stay on track.'),
      action: (
        <Button asChild size="sm" variant={hasAccount ? 'default' : 'outline'}>
          <Link href="/budgets">{t('Buat budget', 'Create budget')}</Link>
        </Button>
      ),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.findIndex((s) => !s.done);

  return (
    <Card className="border-primary/30">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-display text-lg font-semibold">{t('Mulai di sini', 'Start here')}</p>
            <p className="text-sm text-muted-foreground">
              {t(`${doneCount} dari ${steps.length} langkah selesai`, `${doneCount} of ${steps.length} steps done`)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onDismiss} aria-label={t('Sembunyikan panduan', 'Hide guide')}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={(doneCount / steps.length) * 100} />
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className={cn(
                'flex flex-col gap-3 rounded-lg border p-3',
                i === next && 'bg-accent/50'
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                  step.done && 'border-primary bg-primary text-primary-foreground'
                )}
              >
                {step.done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium', step.done && 'text-muted-foreground line-through')}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {!step.done && i === next && step.action}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
