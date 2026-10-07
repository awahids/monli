'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface ProLockProps {
  locked: boolean;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shows PRO-only content blurred behind an upgrade prompt, so FREE users see
 * what they would get instead of an empty "Pro feature" screen.
 */
export function ProLock({ locked, title, description, children, className }: ProLockProps) {
  const { t } = useT();
  if (!locked) return <>{children}</>;
  return (
    <div className={cn('relative', className)}>
      <div aria-hidden className="pointer-events-none select-none blur-[6px] saturate-50">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="max-w-sm space-y-3 rounded-xl border bg-card/95 p-6 text-center shadow-lg backdrop-blur">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Lock className="h-5 w-5" />
          </span>
          <p className="font-display text-lg font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          <Button asChild className="w-full">
            <Link href="/upgrade">{t('Lihat paket PRO', 'See PRO plans')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
