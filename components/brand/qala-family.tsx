'use client';

import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND, QALA_FAMILY } from '@/lib/brand';
import { QalaMark } from '@/components/brand/qala-mark';
import { useT } from '@/lib/i18n';

/** "Bagian dari keluarga Qala" link to qala.digital. */
export function QalaFamilyLink({ className }: { className?: string }) {
  const { t } = useT();
  return (
    <a
      href={BRAND.familyUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'inline-flex items-center gap-1 underline-offset-4 hover:underline',
        className
      )}
    >
      {t('Bagian dari keluarga', 'Part of the')}{' '}
      <span className="font-semibold text-foreground">{BRAND.family}</span>
    </a>
  );
}

/** Links to the other Qala products (the current one is skipped). */
export function QalaFamilyProducts({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { t } = useT();
  const others = QALA_FAMILY.filter((p) => p.name !== BRAND.name);
  return (
    <div className={cn('space-y-1', className)}>
      <p className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t(`Produk ${BRAND.family} lainnya`, `More from ${BRAND.family}`)}
      </p>
      {others.map((product) => (
        <a
          key={product.url}
          href={product.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-card">
            <QalaMark className="h-2.5" />
          </span>
          {!compact && (
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-foreground">
                {product.name}
              </span>
              <span className="block truncate text-xs">{t(product.description, product.descriptionEn)}</span>
            </span>
          )}
          {!compact && <ArrowUpRight className="h-4 w-4 shrink-0" />}
          <span className="sr-only">{t('(membuka tab baru)', '(opens in a new tab)')}</span>
        </a>
      ))}
    </div>
  );
}
