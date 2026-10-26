'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PiggyMascot, useActiveTheme } from '@/components/appearance/theme-art';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Friendly placeholder for lists and charts that have no data yet. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  const theme = useActiveTheme();
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center',
        className
      )}
    >
      {theme === 'cartoon' ? (
        <PiggyMascot className="h-20 w-20" />
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
