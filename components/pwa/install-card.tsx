'use client';

import { Download, Share, SquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useInstall } from '@/lib/pwa';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

/**
 * "Pasang aplikasi": one tap where the browser supports it, Share → Add to
 * Home Screen steps on iPhone/iPad. Renders nothing once installed or where
 * the browser cannot install apps.
 */
export function InstallCard({ className }: { className?: string }) {
  const { state, install } = useInstall();
  const { t } = useT();
  if (state === 'installed' || state === 'unsupported') return null;

  return (
    <div className={cn('flex items-start gap-3 rounded-xl border bg-card p-4', className)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Download className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t('Pasang Qala Saku', 'Install Qala Saku')}</p>
        {state === 'prompt' ? (
          <>
            <p className="text-xs text-muted-foreground">
              {t('Buka langsung dari layar utama, tanpa browser.', 'Open it straight from your home screen, no browser needed.')}
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={async () => {
                if (await install()) toast.success(t('Qala Saku terpasang di perangkatmu', 'Qala Saku is installed on your device'));
              }}
            >
              {t('Pasang aplikasi', 'Install app')}
            </Button>
          </>
        ) : (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t('Ketuk', 'Tap')} <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-label={t('Bagikan', 'Share')} />{' '}
            {t('di Safari, lalu pilih', 'in Safari, then choose')}{' '}
            <span className="whitespace-nowrap font-medium text-foreground">
              <SquarePlus className="inline h-3.5 w-3.5 align-text-bottom" /> {t('Tambah ke Layar Utama', 'Add to Home Screen')}
            </span>
            .
          </p>
        )}
      </div>
    </div>
  );
}
