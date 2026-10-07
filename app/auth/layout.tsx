import { cookies } from 'next/headers';
import { Toaster } from '@/components/ui/sonner';
import { LocaleProvider } from '@/lib/i18n';
import { LOCALE_COOKIE, asLocale } from '@/lib/locale';

// The auth pages report errors with sonner toasts; the root layout only
// mounts the older shadcn toaster, so they need their own.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider locale={asLocale(cookies().get(LOCALE_COOKIE)?.value)}>
      {children}
      <Toaster />
    </LocaleProvider>
  );
}
