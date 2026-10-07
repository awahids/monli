import { useEffect, useState, useSyncExternalStore } from 'react';
import { APP_VERSION } from '@/lib/changelog';
import { offlineStorage } from '@/lib/offline-storage';

/* ---------- Install ("Pasang aplikasi") ---------- */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// The browser fires this once, early, so it is captured as soon as this
// module loads (the service worker registration imports it in the root layout).
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * - `prompt`: the browser can install it in one tap (Chrome, Edge, Android).
 * - `ios`: Safari on iPhone/iPad has no prompt; the user adds it via Share.
 * - `installed`: already running as an installed app.
 * - `unsupported`: anything else (e.g. Firefox desktop).
 */
export type InstallState = 'prompt' | 'ios' | 'installed' | 'unsupported';

function installState(): InstallState {
  if (isStandalone()) return 'installed';
  if (deferred) return 'prompt';
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return 'ios';
  return 'unsupported';
}

export function useInstall() {
  const state = useSyncExternalStore(subscribe, installState, () => 'unsupported' as InstallState);
  const install = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    emit();
    return outcome === 'accepted';
  };
  return { state, install };
}

/* ---------- Update ("Versi baru tersedia") ---------- */

/** Build of the code running in this tab, baked in at build time. */
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev';

/**
 * True once the server is running a newer deployment than this tab.
 * Checked when the app comes back to the foreground and every 30 minutes.
 */
export function useUpdateAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (available) return;
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        const { build } = await res.json();
        if (build && build !== BUILD_ID) setAvailable(true);
      } catch {
        // offline: try again later
      }
    };
    check();
    const timer = setInterval(check, 30 * 60 * 1000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [available]);
  return available;
}

/* ---------- Changelog seen ---------- */

const SEEN_KEY = 'saku_seen_version';
const SEEN_EVENT = 'saku:changelog-seen';

export function markChangelogSeen() {
  try {
    localStorage.setItem(SEEN_KEY, APP_VERSION);
  } catch {}
  window.dispatchEvent(new Event(SEEN_EVENT));
}

/** Whether this browser has not opened the changelog since the latest version. */
export function useChangelogUnseen() {
  const [unseen, setUnseen] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        setUnseen(localStorage.getItem(SEEN_KEY) !== APP_VERSION);
      } catch {}
    };
    read();
    window.addEventListener(SEEN_EVENT, read);
    return () => window.removeEventListener(SEEN_EVENT, read);
  }, []);
  return unseen;
}

/* ---------- Offline ---------- */

/** Pages warmed into the service worker cache so they open offline. */
const OFFLINE_PAGES = ['/dashboard', '/transactions', '/budgets', '/accounts', '/goals', '/debts', '/recurring', '/reports', '/settings', '/changelog'];

/** Once per session, after sign-in: cache the main pages and their build files. */
export function warmOfflineCache() {
  try {
    if (!navigator.onLine || sessionStorage.getItem('saku_warmed') === BUILD_ID) return;
    navigator.serviceWorker?.ready.then((reg) => {
      reg.active?.postMessage({ type: 'warm', urls: OFFLINE_PAGES });
      sessionStorage.setItem('saku_warmed', BUILD_ID);
    });
  } catch {}
}

/** Drops everything kept for offline use, so the next person on this device starts clean. */
export async function clearOfflineCopies() {
  try {
    for (const key of await caches.keys()) if (key.startsWith('saku-data')) await caches.delete(key);
    await offlineStorage.clearOfflineData();
    await offlineStorage.clearPendingSync();
  } catch {}
}
