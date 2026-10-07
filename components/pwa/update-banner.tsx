'use client';

import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpdateAvailable } from '@/lib/pwa';

/** Shown when a newer deployment is live than the one running in this tab. */
export function UpdateBanner() {
  const available = useUpdateAvailable();
  if (!available) return null;

  return (
    <div role="status" className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3">
      <RefreshCw className="h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Versi baru tersedia</p>
        <Link href="/changelog" className="text-xs text-primary underline-offset-4 hover:underline">
          Lihat yang baru
        </Link>
      </div>
      <Button size="sm" onClick={() => window.location.reload()}>
        Perbarui
      </Button>
    </div>
  );
}
