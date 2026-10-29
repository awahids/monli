'use client';

import { useLayoutEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import type { Category } from '@/types';
import { CHALLENGE_LENGTHS, slipsLeft, type ChallengeDay } from '@/lib/challenges';
import type { ChallengeWithProgress } from '@/lib/challenges-server';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategoryIcon } from '@/components/transactions/category-icon';
import { tr, useT } from '@/lib/i18n';

/** "Jajan", or "belanja" for a challenge on all spending. */
export function challengeSubject(c: { categoryId: string | null }, categories: Category[], t = tr): string {
  if (!c.categoryId) return t('belanja', 'spending');
  return categories.find((k) => k.id === c.categoryId)?.name ?? t('kategori terhapus', 'a deleted category');
}

/** "5 dari 7 hari tanpa Jajan". */
export function challengeTitle(c: ChallengeWithProgress, categories: Category[], t = tr): string {
  const subject = challengeSubject(c, categories, t);
  return t(`${c.targetDays} dari ${c.lengthDays} hari tanpa ${subject}`, `${c.targetDays} of ${c.lengthDays} days without ${subject}`);
}

/** About seven in ten days clean: hard enough to matter, easy enough to win. */
const defaultTarget = (length: number) => Math.max(1, Math.round(length * 0.7));

const DAY_STYLE: Record<ChallengeDay, string> = {
  free: 'bg-emerald-500',
  slip: 'bg-rose-500',
  today: 'bg-primary/30 ring-2 ring-primary',
  future: 'bg-muted',
};

/** One challenge: its days as dots, how it stands, and a way to drop it. */
export function ChallengeItem({
  challenge: c,
  categories,
  onRemove,
}: {
  challenge: ChallengeWithProgress;
  categories: Category[];
  onRemove?: () => void;
}) {
  const { t } = useT();
  const p = c.progress;
  const category = categories.find((k) => k.id === c.categoryId);
  const color = category?.color || '#14A7A0';
  const left = slipsLeft(c, p);
  const dayLabel: Record<ChallengeDay, string> = {
    free: t('tanpa pengeluaran', 'clean'),
    slip: t('ada pengeluaran', 'spent'),
    today: t('hari ini', 'today'),
    future: t('belum', 'not yet'),
  };
  return (
    <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border" data-testid="challenge">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${color}1f`, color }}>
          <CategoryIcon name={category?.icon || 'ShoppingBag'} className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{challengeTitle(c, categories, t)}</p>
          <p className="text-xs text-muted-foreground">
            {p.status === 'won'
              ? t('Berhasil! Kanto bangga sama kamu.', 'Done! Kanto is proud of you.')
              : p.status === 'lost'
                ? t('Belum berhasil kali ini. Coba lagi?', 'Not this time. Try again?')
                : t(
                    `${p.freeDays} dari ${c.targetDays} hari tercapai · boleh bolong ${left} hari lagi`,
                    `${p.freeDays} of ${c.targetDays} days done · ${left} slip${left === 1 ? '' : 's'} left`
                  )}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            p.status === 'won'
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : p.status === 'lost'
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                : 'bg-primary/10 text-primary'
          )}
        >
          {p.status === 'won' ? t('Berhasil', 'Won') : p.status === 'lost' ? t('Gagal', 'Missed') : t('Berjalan', 'On')}
        </span>
        {onRemove && (
          <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8" onClick={onRemove} aria-label={t('Hapus tantangan', 'Remove challenge')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ol className="flex flex-wrap gap-1.5" aria-label={t('Hari-hari tantangan', 'Challenge days')}>
        {p.days.map((d, i) => (
          <li key={i} className={cn('h-3 w-3 rounded-full', DAY_STYLE[d])} title={`${t('Hari', 'Day')} ${i + 1}: ${dayLabel[d]}`}>
            <span className="sr-only">{`${t('Hari', 'Day')} ${i + 1}: ${dayLabel[d]}`}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Starts a challenge today: a category (or all spending), how long, and how many clean days to win. */
export function ChallengeFormDialog({
  open,
  onOpenChange,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSaved: () => void;
}) {
  const { t } = useT();
  const expense = categories.filter((c) => c.type === 'expense');
  const [categoryId, setCategoryId] = useState('');
  const [length, setLength] = useState<number>(7);
  const [target, setTarget] = useState(defaultTarget(7));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    // Jajan is the classic one to cut down on; else the first expense category.
    const snacks = expense.find((c) => /jajan|snack/i.test(c.name));
    setCategoryId(snacks?.id ?? expense[0]?.id ?? '');
    setLength(7);
    setTarget(defaultTarget(7));
    setError(null);
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const subject = categoryId ? expense.find((c) => c.id === categoryId)?.name ?? '' : t('belanja', 'spending');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (target < 1 || target > length) return setError(t(`Target antara 1 dan ${length} hari`, `Target between 1 and ${length} days`));
    setSaving(true);
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: categoryId || null, lengthDays: length, targetDays: target }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('Gagal menyimpan', 'Could not save'));
      toast.success(t('Tantangan dimulai. Semangat!', 'Challenge on. You got this!'));
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal menyimpan', 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t('Tantangan hemat baru', 'New saving challenge')}</DialogTitle>
            <DialogDescription>
              {t('Mulai hari ini. Ada pengeluaran di kategori itu berarti harinya bolong.', 'Starts today. Any spending in that category makes it a missed day.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="challenge-category">{t('Hindari', 'Stay away from')}</Label>
            <select
              id="challenge-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {expense.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="">{t('Semua pengeluaran (hari tanpa belanja)', 'All spending (no-spend days)')}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>{t('Lama tantangan', 'Length')}</Label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('Lama tantangan', 'Length')}>
              {CHALLENGE_LENGTHS.map((n) => (
                <Button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={length === n}
                  variant={length === n ? 'default' : 'outline'}
                  onClick={() => {
                    setLength(n);
                    setTarget(defaultTarget(n));
                  }}
                >
                  {t(`${n} hari`, `${n} days`)}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="challenge-target">{t('Target hari tanpa pengeluaran', 'Clean days to win')}</Label>
            <Input
              id="challenge-target"
              type="number"
              inputMode="numeric"
              min={1}
              max={length}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              {t(`${target} dari ${length} hari tanpa ${subject}`, `${target} of ${length} days without ${subject}`)}
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {t('Mulai tantangan', 'Start challenge')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
