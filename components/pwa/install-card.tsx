'use client';

import { Download, Share, SquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useInstall } from '@/lib/pwa';
import { cn } from '@/lib/utils';

/**
 * "Pasang aplikasi": one tap where the browser supports it, Share → Add to
 * Home Screen steps on iPhone/iPad. Renders nothing once installed or where
 * the browser cannot install apps.
 */
export function InstallCard({ className }: { className?: string }) {
  const { state, install } = useInstall();
  if (state === 'installed' || state === 'unsupported') return null;

  return (
    <div className={cn('flex items-start gap-3 rounded-xl border bg-card p-4', className)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Download className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Pasang Qala Saku</p>
        {state === 'prompt' ? (
          <>
            <p className="text-xs text-muted-foreground">Buka langsung dari layar utama, tanpa browser.</p>
            <Button
              size="sm"
              className="mt-3"
              onClick={async () => {
                if (await install()) toast.success('Qala Saku terpasang di perangkatmu');
              }}
            >
              Pasang aplikasi
            </Button>
          </>
        ) : (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Ketuk <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-label="Bagikan" /> di Safari, lalu pilih{' '}
            <span className="whitespace-nowrap font-medium text-foreground">
              <SquarePlus className="inline h-3.5 w-3.5 align-text-bottom" /> Tambah ke Layar Utama
            </span>
            .
          </p>
        )}
      </div>
    </div>
  );
}
