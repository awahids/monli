'use client';

import { Languages } from 'lucide-react';
import { setLocale, useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** One tap to the other language, for pages without the profile menu (sign in, sign up). */
export function LanguageLink({ className }: { className?: string }) {
  const { locale } = useT();
  const other = locale === 'en' ? 'id' : 'en';
  return (
    <button
      type="button"
      onClick={() => setLocale(other)}
      className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground', className)}
    >
      <Languages className="h-3.5 w-3.5" />
      {other === 'en' ? 'English' : 'Bahasa Indonesia'}
    </button>
  );
}
