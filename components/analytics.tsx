'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { GA_ID, analyticsPath, appPlatform, gtag } from '@/lib/analytics';
import { isStandalone } from '@/lib/pwa';

let started = false;

/** Page views to Google Analytics, with ids and query strings left out of the URL. */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!GA_ID || !pathname) return;
    const page_location = location.origin + analyticsPath(pathname);
    // Every later event (and the config below) reports this cleaned URL.
    gtag('set', { page_location });
    if (!started) {
      started = true;
      gtag('js', new Date());
      gtag('set', 'user_properties', { app_platform: appPlatform(navigator.userAgent, isStandalone()) });
      gtag('config', GA_ID, { send_page_view: false });
    }
    gtag('event', 'page_view', { page_location, page_title: document.title });
  }, [pathname]);

  if (!GA_ID) return null;
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />;
}
