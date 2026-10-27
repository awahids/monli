'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { callbackPath, isNativeApp, widgetPath } from '@/lib/native';

/**
 * In the iOS/Android app, sign-in with Google/Apple runs in the system
 * browser and returns as qalasaku://auth/callback?code=…; finish it here,
 * in the WebView that holds the sign-in cookies. The home screen widget's
 * links (qalasaku://add, qalasaku://open) open their page.
 */
const LAUNCH_KEY = 'saku_launch_url';

export function NativeBridge() {
  const router = useRouter();
  useEffect(() => {
    if (!isNativeApp()) return;
    let handle: { remove(): Promise<void> } | undefined;
    let gone = false;
    import('@/lib/native-plugins').then(async ({ App, Browser }) => {
      const h = await App.addListener('appUrlOpen', ({ url }) => {
        const widget = widgetPath(url);
        if (widget) return router.push(widget);
        const path = callbackPath(url);
        if (!path) return;
        Browser.close().catch(() => undefined);
        window.location.assign(path);
      });
      if (gone) h.remove();
      else handle = h;
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
      handle?.remove();
    };
  }, [router]);
  return null;
}
