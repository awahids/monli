'use client';

import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const STATUS: Record<string, { label: string; en: string; className: string }> = {
  success: { label: 'Berhasil', en: 'Successful', className: 'bg-green-500/15 text-green-700 dark:text-green-300' },
  pending: { label: 'Menunggu', en: 'Pending', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  failed: { label: 'Gagal', en: 'Failed', className: 'bg-red-500/15 text-red-700 dark:text-red-300' },
};

export function PaymentStatusBadge({ status }: { status: string }) {
  const { t } = useT();
  const meta = STATUS[status] ?? { label: status, en: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', meta.className)}>
      {t(meta.label, meta.en)}
    </span>
  );
}
