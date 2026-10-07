import { cookies } from 'next/headers';
import { LOCALE_COOKIE, asLocale } from './locale';

/** t(id, en) for route handlers and server components: the caller's language cookie. */
export function serverT() {
  let en = false;
  try {
    en = asLocale(cookies().get(LOCALE_COOKIE)?.value) === 'en';
  } catch {
    // Outside a request (tests, scripts): Indonesian.
  }
  return (idText: string, enText: string) => (en ? enText : idText);
}
