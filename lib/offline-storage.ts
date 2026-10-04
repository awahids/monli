
import { Transaction, Account, Category, Budget } from '@/types';

interface OfflineData {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  lastSync: string;
}

interface PendingSync {
  id: string;
  action: 'create' | 'update' | 'delete';
  table: 'transactions' | 'accounts' | 'categories' | 'budgets';
  data: any;
  timestamp: string;
}

class OfflineStorage {
  private dbName = 'monli-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('pendingSync')) {
          const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async saveOfflineData(data: Partial<OfflineData>): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');

    for (const [key, value] of Object.entries(data)) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put({ key, value });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async getOfflineData(): Promise<Partial<OfflineData>> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const result: Partial<OfflineData> = {};
        for (const item of request.result) {
          result[item.key as keyof OfflineData] = item.value;
        }
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addPendingSync(item: Omit<PendingSync, 'id' | 'timestamp'>): Promise<void> {
    if (!this.db) await this.init();

    const pendingItem: PendingSync = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
    };

    const transaction = this.db!.transaction(['pendingSync'], 'readwrite');
    const store = transaction.objectStore('pendingSync');

    return new Promise((resolve, reject) => {
      const request = store.add(pendingItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSync(): Promise<PendingSync[]> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['pendingSync'], 'readonly');
    const store = transaction.objectStore('pendingSync');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingSync(id: string): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['pendingSync'], 'readwrite');
    const store = transaction.objectStore('pendingSync');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingSync(): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['pendingSync'], 'readwrite');
    const store = transaction.objectStore('pendingSync');

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearOfflineData(): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
