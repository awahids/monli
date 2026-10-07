'use client';

import Link from 'next/link';
import { BookOpen, ChevronRight, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstallCard } from '@/components/pwa/install-card';
import { openOnboarding } from '@/components/onboarding/onboarding';
import { APP_VERSION } from '@/lib/changelog';
import { useT } from '@/lib/i18n';

const row = 'flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-sm transition-colors hover:bg-muted';

/** Version, changelog, onboarding preview and the install action. */
export function AboutAppCard() {
  const { t } = useT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Tentang aplikasi', 'About')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('Qala Saku versi', 'Qala Saku version')} {APP_VERSION}
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        <Link href="/changelog" className={row}>
          <Megaphone className="h-4 w-4 text-primary" />
          <span className="flex-1">{t('Yang baru', "What's new")}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <button type="button" onClick={openOnboarding} className={row}>
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="flex-1">{t('Lihat panduan awal', 'View the intro guide')}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <InstallCard className="mt-3" />
      </CardContent>
    </Card>
  );
}
