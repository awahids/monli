'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
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

const day = (d: string) => format(new Date(`${d}T00:00:00`), 'd MMM yyyy', { locale: localeId });

export default function DebtsPage() {
  const { user, space, accounts, bumpData } = useAppStore();
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
      toast.error('Gagal memuat hutang & piutang');
    } finally {
      setLoading(false);
    }
  }, []);

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
      toast.error('Gagal menghapus');
      return;
    }
    toast.success(done);
    await changed(moved);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hutang & piutang</h1>
          <p className="text-sm text-muted-foreground">Catat pinjaman dan cicilannya, tanpa mengganggu budget.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Tambah
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4" aria-busy="true" aria-label="Memuat hutang">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : debts.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="Belum ada hutang atau piutang"
          description="Catat uang yang kamu pinjam atau pinjamkan, lalu tandai cicilannya sampai lunas."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Catat yang pertama
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Hutang saya</p>
              <p className="font-display text-xl font-bold tabular-nums text-red-600 dark:text-red-400" data-testid="total-payable">
                {formatMoney(totals.payable)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Piutang saya</p>
              <p className="font-display text-xl font-bold tabular-nums text-green-600 dark:text-green-400" data-testid="total-receivable">
                {formatMoney(totals.receivable)}
              </p>
            </Card>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as DebtKind)}>
            <TabsList>
              <TabsTrigger value="payable">Hutang ({debts.filter((d) => d.kind === 'payable').length})</TabsTrigger>
              <TabsTrigger value="receivable">Piutang ({debts.filter((d) => d.kind === 'receivable').length})</TabsTrigger>
            </TabsList>
          </Tabs>

          {shown.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {tab === 'payable' ? 'Tidak ada hutang. Mantap!' : 'Tidak ada yang meminjam uangmu.'}
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
                        <Button variant="ghost" size="icon" className="-mr-2 -mt-1 h-8 w-8" aria-label={`Opsi ${d.person}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(d)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-xl font-bold tabular-nums" data-testid="debt-remaining">
                        {formatMoney(s.remaining)}
                      </span>
                      <span className="text-sm text-muted-foreground tabular-nums">dari {formatMoney(d.amount)}</span>
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
                      ? 'Lunas'
                      : d.due_date
                      ? `${s.overdue ? 'Lewat jatuh tempo' : 'Jatuh tempo'} ${day(d.due_date)}`
                      : 'Tanpa jatuh tempo'}
                  </p>

                  {payments.length > 0 && (
                    <ul className="space-y-1 text-sm" aria-label={`Pembayaran ${d.person}`}>
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
                            aria-label="Batalkan pembayaran"
                            onClick={() => remove(`/api/debts/${d.id}/payments/${p.id}`, 'Pembayaran dibatalkan', !!p.account_id)}
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!s.settled && (
                    <Button variant="outline" className="mt-auto" onClick={() => setPaying(d)}>
                      {d.kind === 'payable' ? 'Bayar' : 'Terima pembayaran'}
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
        title={`Hapus catatan "${deleting?.person ?? ''}"?`}
        description="Semua perubahan saldo akun dari catatan ini dan pembayarannya akan dibatalkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={() =>
          deleting
            ? remove(`/api/debts/${deleting.id}`, 'Catatan dihapus', !!deleting.entries?.some((e) => e.account_id))
            : undefined
        }
      />
    </div>
  );
}
