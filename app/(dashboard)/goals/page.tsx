'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Archive, ArchiveRestore, MoreVertical, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { SavingsGoal } from '@/types';
import { useAppStore } from '@/lib/store';
import { keysToCamel } from '@/lib/case';
import { formatMoney } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { goalProgress } from '@/lib/goals';
import { FREE_LIMITS, spacePlan } from '@/lib/plans';
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
import { CategoryIcon } from '@/components/transactions/category-icon';
import { ContributeDialog, GoalFormDialog } from '@/components/goals/goal-dialogs';

export default function GoalsPage() {
  const { user, space } = useAppStore();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [contributing, setContributing] = useState<SavingsGoal | null>(null);
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null);

  const today = formatDate(new Date());
  const active = goals.filter((g) => !g.archived);
  const archived = goals.filter((g) => g.archived);
  const shown = tab === 'active' ? active : archived;
  const limitReached = spacePlan(user, space) !== 'PRO' && active.length >= FREE_LIMITS.goals;
  const totalSaved = active.reduce((s, g) => s + g.savedAmount, 0);
  const totalTarget = active.reduce((s, g) => s + g.targetAmount, 0);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGoals(keysToCamel<SavingsGoal[]>(data.data ?? []));
    } catch {
      toast.error('Gagal memuat target tabungan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const replaceGoal = (raw: unknown) => {
    const goal = keysToCamel<SavingsGoal>(raw);
    setGoals((gs) => gs.map((g) => (g.id === goal.id ? goal : g)));
  };

  const setArchived = async (goal: SavingsGoal, value: boolean) => {
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: value }),
    });
    if (!res.ok) {
      toast.error('Gagal menyimpan');
      return;
    }
    replaceGoal(await res.json());
    toast.success(value ? 'Target diarsipkan' : 'Target dipulihkan');
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/goals/${deleting.id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Gagal menghapus');
      return;
    }
    setGoals((gs) => gs.filter((g) => g.id !== deleting.id));
    toast.success('Target dihapus');
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Target tabungan</h1>
          <p className="text-sm text-muted-foreground">Sisihkan sedikit demi sedikit untuk tujuan yang jelas.</p>
        </div>
        {!limitReached && (
          <Button onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" /> Tambah
          </Button>
        )}
      </div>

      {limitReached && (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          Paket FREE dibatasi {FREE_LIMITS.goals} target aktif.{' '}
          <Link href="/upgrade" className="font-medium text-primary underline-offset-4 hover:underline">
            Upgrade ke PRO
          </Link>{' '}
          untuk target tanpa batas, atau arsipkan target yang sudah selesai.
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Memuat target">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Belum ada target tabungan"
          description="Mulai dari dana darurat 3× pengeluaran bulanan, atau tabungan liburan berikutnya."
          action={
            <Button onClick={openNew}>
              <Plus className="mr-1 h-4 w-4" /> Buat target pertama
            </Button>
          }
        />
      ) : (
        <>
          {active.length > 1 && (
            <Card className="space-y-2 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm text-muted-foreground">Total terkumpul</p>
                <p className="text-sm text-muted-foreground">{Math.round((totalSaved / totalTarget) * 100)}%</p>
              </div>
              <p className="font-display text-2xl font-bold tabular-nums">
                {formatMoney(totalSaved)}{' '}
                <span className="text-base font-normal text-muted-foreground">/ {formatMoney(totalTarget)}</span>
              </p>
              <Progress value={(totalSaved / totalTarget) * 100} className="h-2" />
            </Card>
          )}

          {archived.length > 0 && (
            <Tabs value={tab} onValueChange={(v) => setTab(v as 'active' | 'archived')}>
              <TabsList>
                <TabsTrigger value="active">Aktif ({active.length})</TabsTrigger>
                <TabsTrigger value="archived">Diarsipkan ({archived.length})</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((g) => {
              const p = goalProgress(g, today);
              const color = g.color || '#14A7A0';
              return (
                <Card key={g.id} className="flex flex-col gap-4 p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}1f`, color }}
                    >
                      <CategoryIcon name={g.icon || 'PiggyBank'} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-semibold">{g.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.targetDate
                          ? `Target ${format(new Date(`${g.targetDate}T00:00:00`), 'd MMM yyyy', { locale: localeId })}`
                          : 'Tanpa tenggat'}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 -mt-1 h-8 w-8" aria-label={`Opsi ${g.name}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(g);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Ubah
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setArchived(g, !g.archived)}>
                          {g.archived ? (
                            <>
                              <ArchiveRestore className="mr-2 h-4 w-4" /> Pulihkan
                            </>
                          ) : (
                            <>
                              <Archive className="mr-2 h-4 w-4" /> Arsipkan
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(g)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-xl font-bold tabular-nums">{formatMoney(g.savedAmount)}</span>
                      <span className="text-sm font-medium tabular-nums" style={{ color }}>
                        {Math.floor(p.pct)}%
                      </span>
                    </div>
                    <Progress value={p.pct} className="h-2" indicatorStyle={{ backgroundColor: color }} />
                    <p className="text-xs text-muted-foreground">dari {formatMoney(g.targetAmount)}</p>
                  </div>

                  <p
                    className={cn(
                      'rounded-md px-3 py-2 text-xs',
                      p.done
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                        : p.overdue
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {p.done
                      ? 'Target tercapai. Selamat!'
                      : p.overdue
                      ? `Tenggat sudah lewat, kurang ${formatMoney(p.remaining)}`
                      : p.perMonth !== null
                      ? `Sisihkan ${formatMoney(p.perMonth)}/bulan agar tercapai tepat waktu`
                      : `Kurang ${formatMoney(p.remaining)} lagi`}
                  </p>

                  {!g.archived && (
                    <Button variant="outline" className="mt-auto" onClick={() => setContributing(g)}>
                      Setor / tarik
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <GoalFormDialog open={formOpen} onOpenChange={setFormOpen} goal={editing} onSaved={fetchGoals} />
      <ContributeDialog
        goal={contributing}
        onOpenChange={(o) => !o && setContributing(null)}
        onSaved={replaceGoal}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Hapus "${deleting?.name ?? ''}"?`}
        description="Progres target ini akan hilang. Transaksi dan saldo akun tidak berubah."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDelete}
      />
    </div>
  );
}
