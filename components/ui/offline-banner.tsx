
'use client';

import { useOffline } from '@/hooks/use-offline';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WifiOff, X } from 'lucide-react';
import { useState } from 'react';
import { useT } from '@/lib/i18n';

export function OfflineBanner() {
  const { isOnline, pendingSyncCount } = useOffline();
  const [dismissed, setDismissed] = useState(false);
  const { t } = useT();

  if (isOnline || dismissed) return null;

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/10 mb-4">
      <WifiOff className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        {t('Kamu sedang offline', 'You are offline')}
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300 mt-2">
        <div className="flex items-center justify-between">
          <div>
            {t(
              'Perubahan disimpan di perangkat ini dan akan disinkronkan saat kembali online.',
              'Changes are kept on this device and will sync when you are back online.'
            )}
            {pendingSyncCount > 0 && (
              <span className="block text-sm mt-1">
                {t(`${pendingSyncCount} perubahan menunggu disinkronkan`, `${pendingSyncCount} changes waiting to sync`)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              aria-label={t('Tutup pemberitahuan', 'Dismiss')}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
