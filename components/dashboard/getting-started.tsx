'use client';

import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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
  const steps: Step[] = [
    {
      done: hasAccount,
      title: 'Tambahkan akun pertama',
      description: 'Rekening bank, e-wallet, atau dompet tunai beserta saldonya saat ini.',
      action: (
        <Button asChild size="sm">
          <Link href="/accounts">Tambah akun</Link>
        </Button>
      ),
    },
    {
      done: hasTransaction,
      title: 'Catat transaksi pertama',
      description: 'Pengeluaran atau pemasukan hari ini, cukup beberapa detik.',
      action: (
        <Button size="sm" onClick={onAddTransaction} disabled={!hasAccount}>
          Catat transaksi
        </Button>
      ),
    },
    {
      done: hasBudget,
      title: 'Buat budget bulan ini',
      description: 'Tentukan batas belanja per kategori supaya tidak kebablasan.',
      action: (
        <Button asChild size="sm" variant={hasAccount ? 'default' : 'outline'}>
          <Link href="/budgets">Buat budget</Link>
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
            <p className="font-display text-lg font-semibold">Mulai di sini</p>
            <p className="text-sm text-muted-foreground">
              {doneCount} dari {steps.length} langkah selesai
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Sembunyikan panduan">
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
