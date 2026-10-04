import { cn } from '@/lib/utils';

const STATUS: Record<string, { label: string; className: string }> = {
  success: { label: 'Berhasil', className: 'bg-green-500/15 text-green-700 dark:text-green-300' },
  pending: { label: 'Menunggu', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  failed: { label: 'Gagal', className: 'bg-red-500/15 text-red-700 dark:text-red-300' },
};

export function PaymentStatusBadge({ status }: { status: string }) {
  const meta = STATUS[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', meta.className)}>
      {meta.label}
    </span>
  );
}
