'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { callbackPath, isNativeApp, widgetPath } from '@/lib/native';

/**
 * In the iOS/Android app, sign-in with Google/Apple runs in the system
 * browser and returns as qalasaku://auth/callback?code=…; finish it here,
 * in the WebView that holds the sign-in cookies. The home screen widget's
 * links (qalasaku://add, qalasaku://open) and a tapped notification open
 * the page they point to.
 */
const LAUNCH_KEY = 'saku_launch_url';

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
          const widget = widgetPath(url);
          if (widget) return router.push(widget);
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
      // Started from the widget while closed: the link came before this listener.
      const launch = (await App.getLaunchUrl().catch(() => undefined))?.url;
      const launchPath = launch && widgetPath(launch);
      if (launchPath && sessionStorage.getItem(LAUNCH_KEY) !== launch) {
        sessionStorage.setItem(LAUNCH_KEY, launch);
        router.push(launchPath);
      }
    });
    return () => {
      gone = true;
      handles.forEach((h) => h.remove());
    };
  }, [router]);
  return null;
}
