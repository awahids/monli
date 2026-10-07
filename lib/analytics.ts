/**
 * Google Analytics 4, on only when NEXT_PUBLIC_GA_ID is set. Sends page views
 * and nothing else: no amounts, notes or user ids. Paths are cleaned first.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/** The path sent to analytics: segments with ids or tokens become ":id"; no query or hash. */
export function analyticsPath(pathname: string): string {
  return pathname
    .split('/')
    .map((segment) => (segment.length >= 8 && /\d/.test(segment) ? ':id' : segment))
    .join('/');
}

/** gtag.js reads the `arguments` object itself from dataLayer, not an array. */
export function gtag(..._args: unknown[]) {
  // eslint-disable-next-line prefer-rest-params
  (window.dataLayer ||= []).push(arguments);
}

/** A named event (e.g. a CTA click) to Umami and, when on, Google Analytics. */
export function track(name: string) {
  window.umami?.track(name);
  if (GA_ID) gtag('event', name);
}
