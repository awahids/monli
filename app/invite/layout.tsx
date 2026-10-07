import { cookies } from 'next/headers';
import { LocaleProvider } from '@/lib/i18n';
import { LOCALE_COOKIE, asLocale } from '@/lib/locale';

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <LocaleProvider locale={asLocale(cookies().get(LOCALE_COOKIE)?.value)}>{children}</LocaleProvider>;
}
