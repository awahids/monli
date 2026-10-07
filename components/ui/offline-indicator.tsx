
'use client';

import { useOffline } from '@/hooks/use-offline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useT } from '@/lib/i18n';

export function OfflineIndicator() {
  const { isOnline, pendingSyncCount, syncPendingChanges } = useOffline();
  const { t } = useT();

  if (!isOnline) {
    return (
      <Badge variant="outline" className="gap-2 text-amber-600 border-amber-200">
        <WifiOff className="h-3 w-3" />
        Offline
      </Badge>
    );
  }

  if (pendingSyncCount > 0) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-2 text-amber-600 border-amber-200">
          <AlertCircle className="h-3 w-3" />
          {t(`${pendingSyncCount} menunggu`, `${pendingSyncCount} pending`)}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={syncPendingChanges}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          {t('Sinkronkan', 'Sync')}
        </Button>
      </div>
    );
  }

  return null;
}
