'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquirrelMascot, useActiveTheme } from '@/components/appearance/theme-art';
import { KantoBuddy } from '@/components/brand/kanto';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Friendly placeholder for lists and charts that have no data yet, with Kanto (Tupi in Kartun) and the page's icon. */
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
        <SquirrelMascot className="h-20 w-20" />
      ) : (
        <span className="relative">
          <KantoBuddy className="h-20 w-20" />
          <span className="absolute -bottom-1 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground ring-4 ring-background">
            <Icon className="h-4 w-4" />
          </span>
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
