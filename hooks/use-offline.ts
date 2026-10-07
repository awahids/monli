
'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/lib/offline-storage';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

let syncInFlight: Promise<void> | null = null;
let restored: Promise<void> | null = null;

/** Loads the saved copy into the store, once per page load. */
function restoreOnce() {
  restored ??= (async () => {
    await offlineStorage.init();
    const saved = await offlineStorage.getOfflineData();
    const store = useAppStore.getState();
    // Data a page already loaded from the server is newer than the saved copy.
    if (saved.transactions && store.transactions.length === 0) store.setTransactions(saved.transactions);
    if (saved.accounts && store.accounts.length === 0) store.setAccounts(saved.accounts);
    if (saved.categories && store.categories.length === 0) store.setCategories(saved.categories);
    if (saved.budgets && store.budgets.length === 0) store.setBudgets(saved.budgets);
  })();
  return restored;
}

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const { toast } = useToast();

  const { transactions, accounts, categories, budgets } = useAppStore();

  // Restore the last saved data once (shared by every component using this
  // hook); saving starts only afterwards, so an empty store never overwrites
  // the saved copy before it has been read back.
  useEffect(() => {
    let active = true;
    restoreOnce().then(async () => {
      if (!active) return;
      setIsInitialized(true);
      const pending = await offlineStorage.getPendingSync();
      setPendingSyncCount(pending.length);
    }).catch((error) => console.error('Failed to initialize offline storage:', error));
    return () => {
      active = false;
    };
  }, []);

  // Sync any pending offline changes when back online. Several components
  // use this hook, so a module-level lock keeps the queue from being
  // replayed more than once (which created duplicate transactions).
  const syncPendingChanges = useCallback(async () => {
    // Read connectivity directly: the `online` listener runs before the
    // isOnline state update is visible in this closure.
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (syncInFlight) return syncInFlight;

    syncInFlight = (async () => {
      try {
        const pendingItems = await offlineStorage.getPendingSync();
        if (pendingItems.length === 0) return;

        toast({
          title: 'Menyinkronkan data...',
          description: `Menyinkronkan ${pendingItems.length} perubahan yang tertunda.`,
        });

        let failed = 0;
        for (const item of pendingItems) {
          try {
            const endpoint = `/api/${item.table}${item.action === 'update' || item.action === 'delete' ? `/${item.data.id}` : ''}`;

            let method = 'POST';
            if (item.action === 'update') method = 'PATCH';
            if (item.action === 'delete') method = 'DELETE';

            const response = await fetch(endpoint, {
              method,
              headers: {
                'Content-Type': 'application/json',
              },
              body: item.action !== 'delete' ? JSON.stringify(item.data) : undefined,
            });

            if (!response.ok) {
              throw new Error(`Failed to sync ${item.table} ${item.action}`);
            }
            // Only drop items that actually reached the server.
            await offlineStorage.removePendingSync(item.id);
          } catch (error) {
            failed += 1;
            console.error(`Failed to sync item ${item.id}:`, error);
          }
        }

        const remaining = await offlineStorage.getPendingSync();
        setPendingSyncCount(remaining.length);

        if (failed > 0) {
          toast({
            title: 'Sinkronisasi belum lengkap',
            description: `${failed} perubahan gagal disinkronkan dan akan dicoba lagi.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sinkronisasi selesai',
            description: 'Semua perubahan saat offline sudah tersimpan.',
          });
        }
      } catch (error) {
        console.error('Sync failed:', error);
        toast({
          title: 'Sinkronisasi gagal',
          description: 'Beberapa perubahan belum tersimpan. Akan dicoba lagi saat koneksi membaik.',
          variant: 'destructive',
        });
      } finally {
        syncInFlight = null;
      }
    })();
    return syncInFlight;
  }, [toast, setPendingSyncCount]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingChanges]);

  // Persist the latest data locally so it can be restored after a refresh
  useEffect(() => {
    if (isInitialized) {
      offlineStorage.saveOfflineData({
        transactions,
        accounts,
        categories,
        budgets,
        lastSync: new Date().toISOString(),
      });
    }
  }, [transactions, accounts, categories, budgets, isInitialized]);

  const addOfflineChange = async (
    action: 'create' | 'update' | 'delete',
    table: 'transactions' | 'accounts' | 'categories' | 'budgets',
    data: any
  ) => {
    if (isOnline) return; // Only add to offline queue when offline

    await offlineStorage.addPendingSync({ action, table, data });
    const pending = await offlineStorage.getPendingSync();
    setPendingSyncCount(pending.length);
  };

  const clearOfflineData = async () => {
    await offlineStorage.clearOfflineData();
    await offlineStorage.clearPendingSync();
    setPendingSyncCount(0);
  };

  return {
    isOnline,
    isInitialized,
    pendingSyncCount,
    syncPendingChanges,
    addOfflineChange,
    clearOfflineData,
  };
}
