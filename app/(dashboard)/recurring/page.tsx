'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRightLeft, MoreVertical, Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { Account, Category, RecurringTransaction } from '@/types';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { keysToCamel } from '@/lib/case';
import { formatMoney } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { describeSchedule } from '@/lib/recurring';
import type { Translate } from '@/lib/locale';
import { resetDueRecurring, runDueRecurring } from '@/lib/recurring-client';
import { FREE_LIMITS, spacePlan } from '@/lib/plans';
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
import { useT } from '@/lib/i18n';

function ruleTitle(r: RecurringTransaction, t: Translate) {
  if (r.note) return r.note;
  if (r.type === 'transfer') return `Transfer ${r.fromAccount?.name ?? ''} → ${r.toAccount?.name ?? ''}`;
  return r.category?.name ?? (r.type === 'income' ? t('Pemasukan', 'Income') : t('Pengeluaran', 'Expense'));
}

export default function RecurringPage() {
  const { user, space, accounts, categories, setAccounts, setCategories } = useAppStore();
  const [rules, setRules] = useState<RecurringTransaction[]>([]);
  const { t, dateLocale, locale } = useT();
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [deleting, setDeleting] = useState<RecurringTransaction | null>(null);

  const today = formatDate(new Date());
  const isFree = spacePlan(user, space) !== 'PRO';
  const limitReached = isFree && rules.length >= FREE_LIMITS.recurring;

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/recurring');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRules(keysToCamel<RecurringTransaction[]>(data.data ?? []));
    } catch {
      toast.error(t('Gagal memuat transaksi rutin', 'Could not load recurring transactions'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // The form needs accounts and categories even when this page is opened directly.
  useEffect(() => {
    if (!user) return;
    (async () => {
      if (!accounts.length) {
        const { data } = await supabase.from('accounts').select('*').eq('user_id', (space?.ownerId ?? user.id)).eq('archived', false);
        if (data) setAccounts(keysToCamel<Account[]>(data));
      }
      if (!categories.length) {
        const { data } = await supabase.from('categories').select('*').eq('user_id', (space?.ownerId ?? user.id));
        if (data) setCategories(keysToCamel<Category[]>(data));
      }
    })().catch(console.error);
  }, [space?.ownerId, user, accounts.length, categories.length, setAccounts, setCategories]);

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
      toast.error(t('Gagal mengubah status', 'Could not change the status'));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/recurring/${deleting.id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(t('Gagal menghapus', 'Could not delete'));
      return;
    }
    toast.success(t('Transaksi rutin dihapus', 'Recurring transaction deleted'));
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
          <h1 className="text-2xl font-bold tracking-tight">{t('Transaksi rutin', 'Recurring')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('Gaji, tagihan, dan langganan dicatat otomatis saat jatuh tempo.', 'Salary, bills and subscriptions are recorded automatically when due.')}
          </p>
        </div>
        {!limitReached && (
          <Button onClick={openNew} disabled={!accounts.length}>
            <Plus className="mr-1 h-4 w-4" /> {t('Tambah', 'Add')}
          </Button>
        )}
      </div>

      {limitReached && (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          {t(`Paket FREE dibatasi ${FREE_LIMITS.recurring} transaksi rutin.`, `The FREE plan is limited to ${FREE_LIMITS.recurring} recurring transactions.`)}{' '}
          <span className="web-only">
            <Link href="/upgrade" className="font-medium text-primary underline-offset-4 hover:underline">
              {t('Upgrade ke PRO', 'Upgrade to PRO')}
            </Link>{' '}
            {t('untuk tanpa batas.', 'for unlimited.')}
          </span>
        </p>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label={t('Memuat transaksi rutin', 'Loading recurring transactions')}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title={t('Belum ada transaksi rutin', 'No recurring transactions yet')}
          description={
            accounts.length
              ? t('Atur sekali untuk gaji, kos, listrik, atau langganan. Qala Saku mencatatnya tiap jatuh tempo.', 'Set it once for salary, rent, utilities or subscriptions. Qala Saku records it every time it is due.')
              : t('Buat akun dulu, lalu atur transaksi yang berulang tiap bulan atau minggu.', 'Create an account first, then set up transactions that repeat monthly or weekly.')
          }
          action={
            accounts.length ? (
              <Button onClick={openNew}>
                <Plus className="mr-1 h-4 w-4" /> {t('Tambah transaksi rutin', 'Add recurring transaction')}
              </Button>
            ) : (
              <Button asChild>
                <Link href="/accounts">{t('Buat akun', 'Create account')}</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          {(monthlyIn > 0 || monthlyOut > 0) && (
            <Card className="grid grid-cols-2 divide-x p-0">
              <div className="p-4">
                <p className="text-xs text-muted-foreground">{t('Pemasukan rutin / bulan', 'Recurring income / month')}</p>
                <p className="font-display text-lg font-semibold tabular-nums text-green-600 dark:text-green-400">
                  {formatMoney(monthlyIn)}
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">{t('Pengeluaran rutin / bulan', 'Recurring expenses / month')}</p>
                <p className="font-display text-lg font-semibold tabular-nums">{formatMoney(monthlyOut)}</p>
              </div>
            </Card>
          )}

          <ul className="space-y-2">
            {rules.map((r) => (
              <li key={r.id}>
                <Card className={cn('flex items-center gap-3 p-3', !r.active && 'opacity-60')}>
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
                    <p className="truncate font-medium">{ruleTitle(r, t)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {describeSchedule(r.frequency, r.dayOfMonth, r.startDate, locale)}
                      {' · '}
                      {r.active
                        ? t(
                            `berikutnya ${format(new Date(`${r.nextDate}T00:00:00`), 'd MMM yyyy', { locale: dateLocale })}`,
                            `next ${format(new Date(`${r.nextDate}T00:00:00`), 'd MMM yyyy', { locale: dateLocale })}`
                          )
                        : r.endDate && r.endDate < today
                        ? t('selesai', 'ended')
                        : t('dijeda', 'paused')}
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
                    aria-label={r.active ? `Jeda ${ruleTitle(r, t)}` : `Lanjutkan ${ruleTitle(r, t)}`}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={t('Opsi', 'Options')}>
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
                        <Pencil className="mr-2 h-4 w-4" /> {t('Ubah', 'Edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(r)}>
                        <Trash2 className="mr-2 h-4 w-4" /> {t('Hapus', 'Delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Card>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            {t(
              'Transaksi dicatat saat kamu membuka Qala Saku pada atau setelah tanggal jatuh tempo, dengan tag "rutin".',
              'Transactions are recorded when you open Qala Saku on or after the due date, tagged "rutin".'
            )}
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
        title={t('Hapus transaksi rutin?', 'Delete recurring transaction?')}
        description={t('Transaksi yang sudah tercatat tetap ada. Hanya jadwalnya yang dihapus.', 'Transactions already recorded stay. Only the schedule is deleted.')}
        confirmLabel={t('Hapus', 'Delete')}
        cancelLabel={t('Batal', 'Cancel')}
        onConfirm={handleDelete}
      />
    </div>
  );
}
