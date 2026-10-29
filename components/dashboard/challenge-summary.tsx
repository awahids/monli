'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Flame } from 'lucide-react';
import type { Category } from '@/types';
import type { ChallengesOverview } from '@/lib/challenges-server';
import { Kanto } from '@/components/brand/kanto';
import { challengeTitle } from '@/components/challenges/challenge-ui';
import { useT } from '@/lib/i18n';

/**
 * The recording streak and the first running challenge, with Kanto cheering
 * or sulking. Renders nothing until there is a streak or a challenge.
 * `refresh` changes after a transaction is saved, so the streak keeps up.
 */
export function ChallengeSummary({ categories, refresh }: { categories: Category[]; refresh?: unknown }) {
  const { t } = useT();
  const [overview, setOverview] = useState<ChallengesOverview | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/challenges')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => !cancelled && data && setOverview(data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  if (!overview || (!overview.streak.days && !overview.challenges.length)) return null;
  const running = overview.challenges.find((c) => c.progress.status === 'active') ?? overview.challenges[0];
  const p = running?.progress;

  return (
    <Link
      href="/challenges"
      className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border transition-colors hover:bg-muted/50"
      aria-label={t('Tantangan hemat', 'Saving challenges')}
    >
      <Kanto mood={overview.mood} className="h-14 w-14 shrink-0" />
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="flex items-center gap-1 text-sm font-semibold">
          <Flame className="h-4 w-4 text-orange-500" />
          {t(`Streak ${overview.streak.days} hari`, `${overview.streak.days}-day streak`)}
          {!overview.streak.recordedToday && overview.streak.days > 0 && (
            <span className="font-normal text-muted-foreground">{t(' · catat hari ini', ' · record today')}</span>
          )}
        </span>
        {running && p && (
          <span className="block truncate text-xs text-muted-foreground">
            {challengeTitle(running, categories, t)} ·{' '}
            {p.status === 'won'
              ? t('berhasil!', 'done!')
              : p.status === 'lost'
                ? t('belum berhasil', 'missed')
                : t(`${p.freeDays}/${running.targetDays} hari`, `${p.freeDays}/${running.targetDays} days`)}
          </span>
        )}
        {!running && <span className="block text-xs text-muted-foreground">{t('Mulai tantangan hemat bareng Kanto', 'Start a saving challenge with Kanto')}</span>}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
