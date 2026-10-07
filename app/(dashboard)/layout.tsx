import { cookies } from 'next/headers';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { LocaleProvider } from '@/lib/i18n';
import { LOCALE_COOKIE, asLocale } from '@/lib/locale';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider locale={asLocale(cookies().get(LOCALE_COOKIE)?.value)}>
      <DashboardShell>{children}</DashboardShell>
    </LocaleProvider>
  );
}
