'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ChevronRight, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { formatMoney } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { currentRound, hasPaid, me, potSize, type Arisan } from '@/lib/arisan';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ArisanFormDialog } from '@/components/arisan/arisan-ui';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function ArisanPage() {
  const { user, space } = useAppStore();
  const { t, dateLocale } = useT();
  const canWrite = space?.canWrite ?? true;
  const [arisans, setArisans] = useState<Arisan[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const today = formatDate(new Date());
  const day = (d: string) => format(new Date(`${d}T00:00:00`), 'd MMM yyyy', { locale: dateLocale });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/arisan');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setArisans(data.data ?? []);
    } catch {
      toast.error(t('Gagal memuat arisan', 'Could not load arisans'));
      setArisans([]);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Arisan</h1>
          <p className="text-sm text-muted-foreground">
            {t('Jadwal giliran, siapa yang sudah setor, dan pengingat setoranmu.', 'Turns, who has paid, and reminders for your payment.')}
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> {t('Arisan', 'Arisan')}
          </Button>
        )}
      </div>

      {!arisans ? (
        <div className="grid gap-4" aria-busy="true">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : arisans.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('Belum ada arisan', 'No arisan yet')}
          description={t(
            'Catat arisan RT, kantor, atau keluarga: urutan giliran, setoran tiap putaran, dan siapa yang sudah bayar.',
            'Track your neighbourhood, office or family arisan: turns, each round’s payments and who has paid.'
          )}
          action={
            canWrite ? (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> {t('Buat arisan', 'Create arisan')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3">
          {arisans.map((a) => {
            const round = currentRound(a, today);
            const mine = me(a);
            const myTurn = round && mine && round.receiver?.id === mine.id;
            const paid = round && mine ? hasPaid(a, mine.id, round.round) : null;
            return (
              <Link
                key={a.id}
                href={`/arisan/${a.id}`}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block truncate font-semibold">{a.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t(
                      `${formatMoney(a.amount)}/orang · pot ${formatMoney(potSize(a))} · ${a.members.length} anggota`,
                      `${formatMoney(a.amount)}/person · pot ${formatMoney(potSize(a))} · ${a.members.length} members`
                    )}
                  </span>
                  {round ? (
                    <span className="block text-sm">
                      {t(`Putaran ${round.round} · ${day(round.date)} · ${round.receiver?.name ?? '-'}`, `Round ${round.round} · ${day(round.date)} · ${round.receiver?.name ?? '-'}`)}
                    </span>
                  ) : (
                    <span className="block text-sm text-muted-foreground">{t('Semua putaran selesai', 'All rounds done')}</span>
                  )}
                  {round && (
                    <span className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {t(`${round.paid}/${a.members.length} sudah setor`, `${round.paid}/${a.members.length} paid`)}
                      </span>
                      {myTurn && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                          {t('Giliranmu menerima', 'Your turn')}
                        </span>
                      )}
                      {paid !== null && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            paid ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                          )}
                        >
                          {paid ? t('Kamu sudah setor', 'You paid') : t('Kamu belum setor', 'You haven’t paid')}
                        </span>
                      )}
                    </span>
                  )}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      )}

      <ArisanFormDialog open={formOpen} onOpenChange={setFormOpen} myName={user?.name?.split(' ')[0] ?? ''} onSaved={load} />
    </div>
  );
}
