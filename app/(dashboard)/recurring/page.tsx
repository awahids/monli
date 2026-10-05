'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { ArrowRightLeft, MoreVertical, Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { Account, Category, RecurringTransaction } from '@/types';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { keysToCamel } from '@/lib/case';
import { formatMoney } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { describeSchedule } from '@/lib/recurring';
import { resetDueRecurring, runDueRecurring } from '@/lib/recurring-client';
import { FREE_LIMITS } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryIcon } from '@/components/transactions/category-icon';
import { RecurringFormDialog } from '@/components/recurring/recurring-form-dialog';

function ruleTitle(r: RecurringTransaction) {
  if (r.note) return r.note;
  if (r.type === 'transfer') return `Transfer ${r.fromAccount?.name ?? ''} → ${r.toAccount?.name ?? ''}`;
  return r.category?.name ?? (r.type === 'income' ? 'Pemasukan' : 'Pengeluaran');
}

export default function RecurringPage() {
  const { user, accounts, categories, setAccounts, setCategories } = useAppStore();
  const [rules, setRules] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [deleting, setDeleting] = useState<RecurringTransaction | null>(null);

  const today = formatDate(new Date());
  const isFree = user?.plan !== 'PRO';
  const limitReached = isFree && rules.length >= FREE_LIMITS.recurring;

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/recurring');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRules(keysToCamel<RecurringTransaction[]>(data.data ?? []));
    } catch {
      toast.error('Gagal memuat transaksi rutin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // The form needs accounts and categories even when this page is opened directly.
  useEffect(() => {
    if (!user) return;
    (async () => {
      if (!accounts.length) {
        const { data } = await supabase.from('accounts').select('*').eq('user_id', user.id).eq('archived', false);
        if (data) setAccounts(keysToCamel<Account[]>(data));
      }
      if (!categories.length) {
        const { data } = await supabase.from('categories').select('*').eq('user_id', user.id);
        if (data) setCategories(keysToCamel<Category[]>(data));
      }
    })().catch(console.error);
  }, [user, accounts.length, categories.length, setAccounts, setCategories]);

  /** After a create/edit/resume, record anything already due, then reload. */
  const afterSave = async () => {
    resetDueRecurring();
    await runDueRecurring();
    fetchRules();
  };

  const toggleActive = async (rule: RecurringTransaction, active: boolean) => {
    setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, active } : r)));
    try {
      const res = await fetch(`/api/recurring/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error();
      toast.success(active ? 'Dilanjutkan' : 'Dijeda');
      if (active) await afterSave();
    } catch {
      setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, active: !active } : r)));
      toast.error('Gagal mengubah status');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/recurring/${deleting.id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Gagal menghapus');
      return;
    }
    toast.success('Transaksi rutin dihapus');
    setRules((rs) => rs.filter((r) => r.id !== deleting.id));
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const monthlyOut = rules
    .filter((r) => r.active && r.type === 'expense')
    .reduce((sum, r) => sum + (r.frequency === 'weekly' ? (r.amount * 52) / 12 : r.amount), 0);
  const monthlyIn = rules
    .filter((r) => r.active && r.type === 'income')
    .reduce((sum, r) => sum + (r.frequency === 'weekly' ? (r.amount * 52) / 12 : r.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Transaksi rutin</h1>
          <p className="text-sm text-muted-foreground">
            Gaji, tagihan, dan langganan dicatat otomatis saat jatuh tempo.
          </p>
        </div>
        {!limitReached && (
          <Button onClick={openNew} disabled={!accounts.length}>
            <Plus className="mr-1 h-4 w-4" /> Tambah
          </Button>
        )}
      </div>

      {limitReached && (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          Paket FREE dibatasi {FREE_LIMITS.recurring} transaksi rutin.{' '}
          <Link href="/upgrade" className="font-medium text-primary underline-offset-4 hover:underline">
            Upgrade ke PRO
          </Link>{' '}
          untuk tanpa batas.
        </p>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Memuat transaksi rutin">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Belum ada transaksi rutin"
          description={
            accounts.length
              ? 'Atur sekali untuk gaji, kos, listrik, atau langganan. Qala Saku mencatatnya tiap jatuh tempo.'
              : 'Buat akun dulu, lalu atur transaksi yang berulang tiap bulan atau minggu.'
          }
          action={
            accounts.length ? (
              <Button onClick={openNew}>
                <Plus className="mr-1 h-4 w-4" /> Tambah transaksi rutin
              </Button>
            ) : (
              <Button asChild>
                <Link href="/accounts">Buat akun</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          {(monthlyIn > 0 || monthlyOut > 0) && (
            <Card className="grid grid-cols-2 divide-x p-0">
              <div className="p-4">
                <p className="text-xs text-muted-foreground">Pemasukan rutin / bulan</p>
                <p className="font-display text-lg font-semibold tabular-nums text-green-600 dark:text-green-400">
                  {formatMoney(monthlyIn)}
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">Pengeluaran rutin / bulan</p>
                <p className="font-display text-lg font-semibold tabular-nums">{formatMoney(monthlyOut)}</p>
              </div>
            </Card>
          )}

          <ul className="space-y-2">
            {rules.map((r) => (
              <li key={r.id}>
                <Card className={cn('flex items-center gap-3 p-3 sm:p-4', !r.active && 'opacity-60')}>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={
                      r.type === 'transfer'
                        ? undefined
                        : { backgroundColor: `${r.category?.color || '#6B7280'}1f`, color: r.category?.color || undefined }
                    }
                  >
                    {r.type === 'transfer' ? (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <ArrowRightLeft className="h-4 w-4" />
                      </span>
                    ) : (
                      <CategoryIcon name={r.category?.icon} className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{ruleTitle(r)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {describeSchedule(r.frequency, r.dayOfMonth, r.startDate)}
                      {' · '}
                      {r.active
                        ? `berikutnya ${format(new Date(`${r.nextDate}T00:00:00`), 'd MMM yyyy', { locale: localeId })}`
                        : r.endDate && r.endDate < today
                        ? 'selesai'
                        : 'dijeda'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-sm font-semibold tabular-nums',
                      r.type === 'income' && 'text-green-600 dark:text-green-400',
                      r.type === 'transfer' && 'text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {r.type === 'income' ? '+' : r.type === 'expense' ? '-' : ''}
                    {formatMoney(r.amount)}
                  </span>
                  <Switch
                    checked={r.active}
                    onCheckedChange={(v) => toggleActive(r, v)}
                    aria-label={r.active ? `Jeda ${ruleTitle(r)}` : `Lanjutkan ${ruleTitle(r)}`}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Opsi">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(r);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Ubah
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(r)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Card>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Transaksi dicatat saat kamu membuka Qala Saku pada atau setelah tanggal jatuh tempo, dengan tag
            &quot;rutin&quot;.
          </p>
        </>
      )}

      <RecurringFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        rule={editing}
        accounts={accounts}
        categories={categories}
        onSaved={afterSave}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus transaksi rutin?"
        description="Transaksi yang sudah tercatat tetap ada. Hanya jadwalnya yang dihapus."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDelete}
      />
    </div>
  );
}
