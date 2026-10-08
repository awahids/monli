'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { nextFromLocation, signInWithProvider } from '@/lib/auth';
import { useT } from '@/lib/i18n';

const CALLBACK_ERRORS: Record<string, [string, string]> = {
  oauth: ['Masuk dengan Google gagal. Coba lagi.', 'Google sign-in failed. Try again.'],
  profile: [
    'Akun Google berhasil masuk, tapi profil Qala Saku gagal dibuat. Coba lagi.',
    'Signed in with Google, but the Qala Saku profile could not be created. Try again.',
  ],
  missing_code: ['Masuk dengan Google dibatalkan.', 'Google sign-in was cancelled.'],
};

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="currentColor">
      <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.86-.76-1.47.02-2.83.86-3.59 2.17-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.25 2.73 2.2 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.14.84-1.23 1.18-2.42 1.2-2.48-.03-.01-2.3-.88-2.3-3.49ZM14.2 6.13c.6-.73 1-1.74.9-2.75-.87.04-1.92.58-2.54 1.31-.56.64-1.05 1.67-.92 2.66.97.07 1.96-.49 2.56-1.22Z" />
    </svg>
  );
}

/**
 * "Continue with Google" plus the "atau" divider above the email form. The
 * iOS app also offers Apple, which App Store rules require next to Google.
 */
export function GoogleSignIn({ label }: { label?: string }) {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const { t } = useT();

  // Errors from /auth/callback come back as ?error=…
  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get('error');
    if (error) toast.error(CALLBACK_ERRORS[error] ? t(...CALLBACK_ERRORS[error]) : t(`Masuk dengan Google gagal: ${error}`, `Google sign-in failed: ${error}`));
  }, [t]);

  const start = async (provider: 'google' | 'apple') => {
    setLoading(provider);
    try {
      await signInWithProvider(provider, nextFromLocation());
      // The browser is now on Google/Apple; keep the spinner. In the app the
      // sign-in sheet can be closed without finishing, so stop it there.
      if (document.documentElement.dataset.app) setLoading(null);
    } catch (e) {
      setLoading(null);
      toast.error(e instanceof Error ? e.message : t('Gagal membuka halaman masuk', 'Could not open sign-in'));
    }
  };

  return (
    <div className="mb-6 space-y-6">
      <div className="space-y-3">
        <Button type="button" variant="outline" className="h-11 w-full gap-2" onClick={() => start('google')} disabled={!!loading}>
          {loading === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleLogo />}
          {label ?? t('Lanjutkan dengan Google', 'Continue with Google')}
        </Button>
        <Button type="button" variant="outline" className="ios-app-only h-11 w-full gap-2" onClick={() => start('apple')} disabled={!!loading}>
          {loading === 'apple' ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleLogo />}
          {t('Lanjutkan dengan Apple', 'Continue with Apple')}
        </Button>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t('atau dengan email', 'or with email')}
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
