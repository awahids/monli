'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowDownUp, ChevronLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { formatMoney } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { arisanSchedule, currentRound, hasPaid, potSize, type Arisan } from '@/lib/arisan';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TurnOrderDialog } from '@/components/arisan/arisan-ui';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

/** One arisan: who has paid this round (tick them off), and the whole schedule of turns. */
export default function ArisanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { space } = useAppStore();
  const { t, dateLocale } = useT();
  const canWrite = space?.canWrite ?? true;
  const [arisan, setArisan] = useState<Arisan | null>(null);
  const [missing, setMissing] = useState(false);
  const [round, setRound] = useState<number | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const today = formatDate(new Date());
  const day = (d: string) => format(new Date(`${d}T00:00:00`), 'EEE, d MMM yyyy', { locale: dateLocale });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/arisan');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const found = (data.data as Arisan[]).find((a) => a.id === id) ?? null;
      setArisan(found);
      setMissing(!found);
    } catch {
      toast.error(t('Gagal memuat arisan', 'Could not load the arisan'));
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  if (missing) {
    return (
      <div className="space-y-4 py-10 text-center text-sm text-muted-foreground">
        <p>{t('Arisan tidak ditemukan.', 'Arisan not found.')}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/arisan">{t('Kembali ke arisan', 'Back to arisan')}</Link>
        </Button>
      </div>
    );
  }
  if (!arisan) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const schedule = arisanSchedule(arisan);
  const shown = schedule.find((r) => r.round === (round ?? currentRound(arisan, today)?.round ?? schedule.length)) ?? schedule[0];

  const toggle = async (memberId: string, paid: boolean) => {
    // Show it at once; the server's answer replaces it.
    setArisan((a) =>
      a && {
        ...a,
        payments: paid
          ? [...a.payments, { memberId, round: shown.round, paidOn: today }]
          : a.payments.filter((p) => !(p.memberId === memberId && p.round === shown.round)),
      }
    );
    const res = await fetch(`/api/arisan/${arisan.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, round: shown.round, paid }),
    });
    if (!res.ok) toast.error(t('Gagal menyimpan', 'Could not save'));
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label={t('Kembali', 'Back')}>
          <Link href="/arisan">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold">{arisan.name}</h1>
        {canWrite && (
          <Button variant="ghost" size="icon" onClick={() => setDeleting(true)} aria-label={t('Hapus arisan', 'Delete arisan')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <section className="relative isolate overflow-hidden rounded-3xl bg-[image:var(--gradient-hero)] p-5 text-primary-foreground shadow-lg shadow-primary/20">
        <p className="text-sm text-primary-foreground/80">{t('Pot tiap putaran', 'Pot each round')}</p>
        <p className="font-display text-3xl font-bold tabular-nums">{formatMoney(potSize(arisan))}</p>
        <p className="mt-1 text-sm text-primary-foreground/80">
          {t(
            `${formatMoney(arisan.amount)} × ${arisan.members.length} anggota, setiap ${arisan.frequency === 'weekly' ? 'minggu' : 'bulan'}`,
            `${formatMoney(arisan.amount)} × ${arisan.members.length} members, every ${arisan.frequency === 'weekly' ? 'week' : 'month'}`
          )}
        </p>
      </section>

      <section className="space-y-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">{t(`Setoran putaran ${shown.round}`, `Round ${shown.round} payments`)}</h2>
          <select
            value={shown.round}
            onChange={(e) => setRound(Number(e.target.value))}
            aria-label={t('Pilih putaran', 'Choose round')}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            {schedule.map((r) => (
              <option key={r.round} value={r.round}>
                {t(`Putaran ${r.round}`, `Round ${r.round}`)}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted-foreground">
          {day(shown.date)} · {t('penerima', 'to')} <span className="font-medium text-foreground">{shown.receiver?.name}</span> ·{' '}
          {t(`${shown.paid}/${arisan.members.length} sudah setor`, `${shown.paid}/${arisan.members.length} paid`)}
        </p>
        <ul className="divide-y">
          {arisan.members.map((m) => {
            const paid = hasPaid(arisan, m.id, shown.round);
            return (
              <li key={m.id}>
                <label className="flex items-center gap-3 py-2 text-sm">
                  <Checkbox checked={paid} disabled={!canWrite} onCheckedChange={(v) => toggle(m.id, v === true)} aria-label={t(`${m.name} sudah setor`, `${m.name} paid`)} />
                  <span className="min-w-0 flex-1 truncate">
                    {m.name}
                    {m.isMe && <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{t('Kamu', 'You')}</span>}
                  </span>
                  <span className={cn('text-xs', paid ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                    {paid ? t('sudah', 'paid') : t('belum', 'not yet')}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">{t('Jadwal giliran', 'Turns')}</h2>
          {canWrite && (
            <Button variant="outline" size="sm" onClick={() => setOrdering(true)}>
              <ArrowDownUp className="mr-1.5 h-4 w-4" />
              {t('Ubah urutan', 'Reorder')}
            </Button>
          )}
        </div>
        <ol className="divide-y text-sm">
          {schedule.map((r) => (
            <li key={r.round} className={cn('flex items-center gap-3 py-2', r.round === shown.round && 'font-medium')}>
              <span className="w-6 shrink-0 text-xs tabular-nums text-muted-foreground">{r.round}.</span>
              <span className="min-w-0 flex-1 truncate">
                {r.receiver?.name}
                {r.receiver?.isMe && <span className="ml-1.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">{t('Giliranmu', 'Your turn')}</span>}
              </span>
              <span className="text-xs text-muted-foreground">{format(new Date(`${r.date}T00:00:00`), 'd MMM yy', { locale: dateLocale })}</span>
              <span className={cn('w-10 text-right text-xs tabular-nums', r.paid === arisan.members.length ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                {r.paid}/{arisan.members.length}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <TurnOrderDialog open={ordering} onOpenChange={setOrdering} arisanId={arisan.id} members={arisan.members} onSaved={load} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t(`Hapus arisan ${arisan.name}?`, `Delete the ${arisan.name} arisan?`)}
        description={t('Jadwal dan catatan setorannya ikut terhapus.', 'Its turns and payments are deleted too.')}
        confirmLabel={t('Hapus', 'Delete')}
        onConfirm={async () => {
          const res = await fetch(`/api/arisan/${arisan.id}`, { method: 'DELETE' });
          if (!res.ok) return void toast.error(t('Gagal menghapus', 'Could not delete'));
          toast.success(t('Arisan dihapus', 'Arisan deleted'));
          router.replace('/arisan');
        }}
      />
    </div>
  );
}
