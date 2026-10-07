'use client';

import { useEffect } from 'react';
import { format } from 'date-fns';
import { CHANGELOG, type ChangelogEntry } from '@/lib/changelog';
import { markChangelogSeen } from '@/lib/pwa';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const TYPE_LABEL: Record<ChangelogEntry['items'][number]['type'], { label: string; en: string; className: string }> = {
  baru: { label: 'Baru', en: 'New', className: 'bg-primary/10 text-primary' },
  peningkatan: { label: 'Lebih baik', en: 'Improved', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  perbaikan: { label: 'Perbaikan', en: 'Fixed', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
};

export default function ChangelogPage() {
  useEffect(markChangelogSeen, []);
  const { t, dateLocale } = useT();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('Yang baru', "What's new")}</h1>
        <p className="text-sm text-muted-foreground">
          {t('Catatan perubahan Qala Saku, satu versi per hari.', 'Qala Saku release notes, one version per day (written in Indonesian).')}
        </p>
      </div>

      <ol className="relative space-y-8 border-l pl-5">
        {CHANGELOG.map((entry, i) => (
          <li key={entry.version} className="relative">
            <span
              aria-hidden
              className={cn(
                'absolute -left-[1.6rem] top-1.5 h-3 w-3 rounded-full border-2 border-background',
                i === 0 ? 'bg-primary' : 'bg-muted-foreground/40'
              )}
            />
            <p className="text-xs text-muted-foreground">
              {t('Versi', 'Version')} {entry.version} · {format(new Date(`${entry.date}T00:00:00`), 'd MMMM yyyy', { locale: dateLocale })}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{entry.title}</h2>
            <ul className="mt-3 space-y-2">
              {entry.items.map((item) => (
                <li key={item.text} className="flex items-start gap-2 text-sm">
                  <span
                    className={cn(
                      'mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      TYPE_LABEL[item.type].className
                    )}
                  >
                    {t(TYPE_LABEL[item.type].label, TYPE_LABEL[item.type].en)}
                  </span>
                  <span className="text-foreground/90">{item.text}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
