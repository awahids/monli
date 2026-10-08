'use client';

import { useEffect } from 'react';
import { callbackPath, isNativeApp } from '@/lib/native';

/**
 * In the iOS/Android app, sign-in with Google/Apple runs in the system
 * browser and returns as qalasaku://auth/callback?code=…; finish it here,
 * in the WebView that holds the sign-in cookies.
 */
export function NativeBridge() {
  useEffect(() => {
    if (!isNativeApp()) return;
    let handle: { remove(): Promise<void> } | undefined;
    let gone = false;
    import('@/lib/native-plugins').then(async ({ App, Browser }) => {
      const h = await App.addListener('appUrlOpen', ({ url }) => {
        const path = callbackPath(url);
        if (!path) return;
        Browser.close().catch(() => undefined);
        window.location.assign(path);
      });
      if (gone) h.remove();
      else handle = h;
    });
    return () => {
      gone = true;
      handle?.remove();
    };
  }, []);
  return null;
}
