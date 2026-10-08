/**
 * The iOS/Android app (mobile/) is a Capacitor shell that loads this site.
 * It tags its WebView's user agent, so the server and the first paint can
 * tell they are inside the app before any script runs.
 */
export const APP_UA = 'QalaSakuApp';
/** URL scheme the app registers; OAuth comes back through it. */
export const APP_SCHEME = 'qalasaku';

export const isAppUA = (ua: string | null | undefined) => !!ua?.includes(APP_UA);

/** True inside the iOS/Android app. */
export const isNativeApp = () => typeof navigator !== 'undefined' && isAppUA(navigator.userAgent);

/**
 * The page in this site that finishes an OAuth sign-in, for a deep link
 * like qalasaku://auth/callback?code=…; null for any other link.
 */
export function callbackPath(deepLink: string): string | null {
  const prefix = `${APP_SCHEME}://auth/callback`;
  if (!deepLink.startsWith(prefix)) return null;
  const rest = deepLink.slice(prefix.length);
  return rest === '' || rest.startsWith('?') ? `/auth/callback${rest}` : null;
}
