'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { callbackPath, isNativeApp } from '@/lib/native';

/**
 * In the iOS/Android app, sign-in with Google/Apple runs in the system
 * browser and returns as qalasaku://auth/callback?code=…; finish it here,
 * in the WebView that holds the sign-in cookies. A tapped notification
 * opens the page it points to.
 */
export function NativeBridge() {
  const router = useRouter();
  useEffect(() => {
    if (!isNativeApp()) return;
    const handles: { remove(): Promise<void> }[] = [];
    let gone = false;
    const keep = (h: { remove(): Promise<void> }) => (gone ? h.remove() : handles.push(h));
    import('@/lib/native-plugins').then(async ({ App, Browser, LocalNotifications }) => {
      keep(
        await App.addListener('appUrlOpen', ({ url }) => {
          const path = callbackPath(url);
          if (!path) return;
          Browser.close().catch(() => undefined);
          window.location.assign(path);
        })
      );
      // App builds from before the notifications plugin don't have it.
      try {
        keep(
          await LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
            const url = notification.extra?.url;
            if (url?.startsWith('/')) router.push(url);
          })
        );
      } catch {}
    });
    return () => {
      gone = true;
      handles.forEach((h) => h.remove());
    };
  }, [router]);
  return null;
}
