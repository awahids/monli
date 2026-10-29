'use client';

import { useCallback, useEffect, useState } from 'react';
import { Flame, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { ensureFormOptions } from '@/lib/transactions-client';
import { MAX_ACTIVE_CHALLENGES } from '@/lib/challenges';
import type { ChallengesOverview, ChallengeWithProgress } from '@/lib/challenges-server';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Kanto } from '@/components/brand/kanto';
import { ChallengeFormDialog, ChallengeItem, challengeTitle } from '@/components/challenges/challenge-ui';
import { useT } from '@/lib/i18n';

/** What Kanto says above the streak. */
function kantoLine(o: ChallengesOverview, t: (id: string, en: string) => string): string {
  if (o.mood === 'sad') return t('Yah, ada yang bolong. Besok kita coba lagi, ya!', 'Oops, a slip. We go again tomorrow!');
  if (o.mood === 'cheer') return t('Mantap! Terus pertahankan!', 'Nice! Keep it going!');
  if (o.streak.days > 0 && !o.streak.recordedToday) return t('Catat hari ini supaya streak-mu tidak putus.', 'Record something today to keep your streak.');
  return t('Yuk mulai tantangan hemat bareng Kanto!', 'Start a saving challenge with Kanto!');
}

export default function ChallengesPage() {
  const { user, space, categories } = useAppStore();
  const { t } = useT();
  const ownerId = space?.ownerId ?? user?.id;
  const canWrite = space?.canWrite ?? true;
  const [overview, setOverview] = useState<ChallengesOverview | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [removing, setRemoving] = useState<ChallengeWithProgress | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/challenges');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOverview(data);
    } catch {
      toast.error(t('Gagal memuat tantangan', 'Could not load challenges'));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (ownerId) ensureFormOptions(ownerId);
  }, [ownerId]);

  const active = overview?.challenges.filter((c) => c.progress.status === 'active') ?? [];
  const done = overview?.challenges.filter((c) => c.progress.status !== 'active') ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('Tantangan hemat', 'Saving challenges')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('Rajin mencatat dan tahan jajan, bareng Kanto.', 'Keep recording and skip the extras, with Kanto.')}
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setFormOpen(true)} disabled={active.length >= MAX_ACTIVE_CHALLENGES}>
            <Plus className="mr-1 h-4 w-4" /> {t('Tantangan', 'Challenge')}
          </Button>
        )}
      </div>

      {!overview ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : (
        <>
          <section className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border" aria-label={t('Streak mencatat', 'Recording streak')}>
            <Kanto mood={overview.mood} className="h-24 w-24 shrink-0" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Flame className="h-4 w-4 text-orange-500" />
                {t('Streak mencatat', 'Recording streak')}
              </p>
              <p className="font-display text-3xl font-bold tabular-nums" data-testid="streak-days">
                {t(`${overview.streak.days} hari`, `${overview.streak.days} day${overview.streak.days === 1 ? '' : 's'}`)}
              </p>
              <p className="text-sm">{kantoLine(overview, t)}</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold">{t('Sedang berjalan', 'In progress')}</h2>
            {active.length ? (
              active.map((c) => (
                <ChallengeItem key={c.id} challenge={c} categories={categories} onRemove={canWrite ? () => setRemoving(c) : undefined} />
              ))
            ) : (
              <div className="space-y-3 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                <p>
                  {t(
                    'Belum ada tantangan. Coba "5 dari 7 hari tanpa jajan": setiap hari tanpa pengeluaran di kategori itu dihitung, dan kamu menang begitu targetnya tercapai.',
                    'No challenge yet. Try "5 of 7 days without snacks": every day without spending in that category counts, and you win once you reach the target.'
                  )}
                </p>
                {canWrite && (
                  <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
                    {t('Mulai tantangan pertama', 'Start your first challenge')}
                  </Button>
                )}
              </div>
            )}
          </section>

          {done.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold">{t('Selesai', 'Finished')}</h2>
              {done.map((c) => (
                <ChallengeItem key={c.id} challenge={c} categories={categories} onRemove={canWrite ? () => setRemoving(c) : undefined} />
              ))}
            </section>
          )}
        </>
      )}

      <ChallengeFormDialog open={formOpen} onOpenChange={setFormOpen} categories={categories} onSaved={load} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t('Hapus tantangan?', 'Remove this challenge?')}
        description={removing ? challengeTitle(removing, categories, t) : ''}
        confirmLabel={t('Hapus', 'Remove')}
        onConfirm={async () => {
          if (!removing) return;
          const res = await fetch(`/api/challenges/${removing.id}`, { method: 'DELETE' });
          if (!res.ok) toast.error(t('Gagal menghapus', 'Could not delete'));
          setRemoving(null);
          await load();
        }}
      />
    </div>
  );
}
