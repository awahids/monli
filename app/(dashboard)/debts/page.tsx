'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { HandCoins, MoreVertical, Plus, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';
import { formatMoney } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { type Debt, type DebtKind, debtStatus, debtTotals } from '@/lib/debts';
import { ensureFormOptions, refreshActiveAccounts } from '@/lib/transactions-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DebtFormDialog, PaymentDialog } from '@/components/debts/debt-dialogs';
import { useT } from '@/lib/i18n';


export default function DebtsPage() {
  const { user, space, accounts, bumpData } = useAppStore();
  const { t, dateLocale } = useT();
  const day = (d: string) => format(new Date(`${d}T00:00:00`), 'd MMM yyyy', { locale: dateLocale });
  const ownerId = space?.ownerId ?? user?.id;
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DebtKind>('payable');
  const [formOpen, setFormOpen] = useState(false);
  const [paying, setPaying] = useState<Debt | null>(null);
  const [deleting, setDeleting] = useState<Debt | null>(null);

  const today = formatDate(new Date());
  const totals = debtTotals(debts);
  const shown = debts
    .filter((d) => d.kind === tab)
    // Open ones first; settled ones sink to the bottom.
    .sort((a, b) => Number(debtStatus(a, today).settled) - Number(debtStatus(b, today).settled));
  const accountName = (id: string | null) => accounts.find((a) => a.id === id)?.name;

  const fetchDebts = useCallback(async () => {
    try {
      const res = await fetch('/api/debts');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDebts(data.data ?? []);
    } catch {
      toast.error(t('Gagal memuat hutang & piutang', 'Could not load debts'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  useEffect(() => {
    if (ownerId) ensureFormOptions(ownerId);
  }, [ownerId]);

  /** After any change: reload, and refresh balances everywhere if money moved. */
  const changed = async (moved: boolean) => {
    await fetchDebts();
    if (moved && ownerId) {
      await refreshActiveAccounts(ownerId);
      bumpData();
    }
  };

  const remove = async (url: string, done: string, moved: boolean) => {
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(t('Gagal menghapus', 'Could not delete'));
      return;
    }
    toast.success(done);
    await changed(moved);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('Hutang & piutang', 'Debts')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('Catat pinjaman dan cicilannya, tanpa mengganggu budget.', 'Track loans and repayments without touching your budget.')}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> {t('Tambah', 'Add')}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4" aria-busy="true" aria-label={t('Memuat hutang', 'Loading debts')}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : debts.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={t('Belum ada hutang atau piutang', 'No debts yet')}
          description={t(
            'Catat uang yang kamu pinjam atau pinjamkan, lalu tandai cicilannya sampai lunas.',
            'Record money you borrow or lend, then track repayments until it is paid off.'
          )}
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> {t('Catat yang pertama', 'Record the first one')}
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t('Hutang saya', 'I owe')}</p>
              <p className="font-display text-xl font-bold tabular-nums text-red-600 dark:text-red-400" data-testid="total-payable">
                {formatMoney(totals.payable)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t('Piutang saya', 'Owed to me')}</p>
              <p className="font-display text-xl font-bold tabular-nums text-green-600 dark:text-green-400" data-testid="total-receivable">
                {formatMoney(totals.receivable)}
              </p>
            </Card>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as DebtKind)}>
            <TabsList>
              <TabsTrigger value="payable">{t('Hutang', 'I owe')} ({debts.filter((d) => d.kind === 'payable').length})</TabsTrigger>
              <TabsTrigger value="receivable">{t('Piutang', 'Owed to me')} ({debts.filter((d) => d.kind === 'receivable').length})</TabsTrigger>
            </TabsList>
          </Tabs>

          {shown.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {tab === 'payable'
                ? t('Tidak ada hutang. Mantap!', 'No debts. Nice!')
                : t('Tidak ada yang meminjam uangmu.', 'Nobody owes you money.')}
            </p>
          )}

          <div className="grid gap-4">
            {shown.map((d) => {
              const s = debtStatus(d, today);
              const payments = (d.entries ?? []).filter((e) => e.kind === 'payment').sort((a, b) => b.date.localeCompare(a.date));
              const principal = d.entries?.find((e) => e.kind === 'principal');
              const from = accountName(principal?.account_id ?? null);
              return (
                <Card key={d.id} className={cn('flex flex-col gap-4 p-4', s.settled && 'opacity-70')} data-testid="debt-card">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-semibold">{d.person}</p>
                      <p className="text-xs text-muted-foreground">
                        {[day(principal?.date ?? d.created_at.slice(0, 10)), from, d.note].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 -mt-1 h-8 w-8" aria-label={t(`Opsi ${d.person}`, `Options for ${d.person}`)}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(d)}>
                          <Trash2 className="mr-2 h-4 w-4" /> {t('Hapus', 'Delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-xl font-bold tabular-nums" data-testid="debt-remaining">
                        {formatMoney(s.remaining)}
                      </span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {t('dari', 'of')} {formatMoney(d.amount)}
                      </span>
                    </div>
                    <Progress value={s.pct} className="h-2" />
                  </div>

                  <p
                    className={cn(
                      'rounded-md px-3 py-2 text-xs',
                      s.settled
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                        : s.overdue
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {s.settled
                      ? t('Lunas', 'Paid off')
                      : d.due_date
                      ? `${s.overdue ? t('Lewat jatuh tempo', 'Overdue since') : t('Jatuh tempo', 'Due')} ${day(d.due_date)}`
                      : t('Tanpa jatuh tempo', 'No due date')}
                  </p>

                  {payments.length > 0 && (
                    <ul className="space-y-1 text-sm" aria-label={t(`Pembayaran ${d.person}`, `Payments from ${d.person}`)}>
                      {payments.map((p) => (
                        <li key={p.id} className="flex items-center gap-2">
                          <span className="flex-1 text-muted-foreground">
                            {day(p.date)}
                            {accountName(p.account_id) && ` · ${accountName(p.account_id)}`}
                          </span>
                          <span className="tabular-nums">{formatMoney(p.amount)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={t('Batalkan pembayaran', 'Undo payment')}
                            onClick={() => remove(`/api/debts/${d.id}/payments/${p.id}`, t('Pembayaran dibatalkan', 'Payment undone'), !!p.account_id)}
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!s.settled && (
                    <Button variant="outline" className="mt-auto" onClick={() => setPaying(d)}>
                      {d.kind === 'payable' ? t('Bayar', 'Pay') : t('Terima pembayaran', 'Receive payment')}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <DebtFormDialog open={formOpen} onOpenChange={setFormOpen} kind={tab} accounts={accounts} onSaved={changed} />
      <PaymentDialog debt={paying} accounts={accounts} onOpenChange={(o) => !o && setPaying(null)} onSaved={changed} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t(`Hapus catatan "${deleting?.person ?? ''}"?`, `Delete "${deleting?.person ?? ''}"?`)}
        description={t(
          'Semua perubahan saldo akun dari catatan ini dan pembayarannya akan dibatalkan.',
          'All account balance changes from this record and its payments will be reversed.'
        )}
        confirmLabel={t('Hapus', 'Delete')}
        cancelLabel={t('Batal', 'Cancel')}
        onConfirm={() =>
          deleting
            ? remove(`/api/debts/${deleting.id}`, t('Catatan dihapus', 'Record deleted'), !!deleting.entries?.some((e) => e.account_id))
            : undefined
        }
      />
    </div>
  );
}
