'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Users } from 'lucide-react';

import { supabase } from '@/lib/auth';
import { SPACE_ROLE_HINT, SPACE_ROLE_LABEL } from '@/lib/space';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { QalaLogo } from '@/components/brand/qala-mark';
import { useT } from '@/lib/i18n';

type Invite = { ownerName: string; email: string; role: 'editor' | 'viewer' };
type State =
  | { kind: 'loading' }
  | { kind: 'signed-out' }
  | { kind: 'ready'; invite: Invite; myEmail: string }
  | { kind: 'error'; message: string };

export default function InvitePage({ params }: { params: { token: string } }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const { t } = useT();
  const here = `/invite/${params.token}`;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setState({ kind: 'signed-out' });
        return;
      }
      const res = await fetch(`/api/spaces/invite/${params.token}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({ kind: 'error', message: body.error || t('Undangan tidak ditemukan.', 'Invite not found.') });
        return;
      }
      setState({ kind: 'ready', invite: body as Invite, myEmail: data.user.email ?? '' });
    })().catch(() => setState({ kind: 'error', message: t('Gagal memuat undangan.', 'Could not load the invite.') }));
  }, [params.token, t]);

  const accept = async () => {
    setAccepting(true);
    setAcceptError(null);
    const res = await fetch(`/api/spaces/invite/${params.token}`, { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAccepting(false);
      setAcceptError(body.error || t('Gagal menerima undangan.', 'Could not accept the invite.'));
      return;
    }
    // Full load so the app starts fresh inside the shared space.
    window.location.assign('/dashboard');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md space-y-6 p-6 sm:p-8">
        <Link href="/" aria-label={t('Qala Saku, beranda', 'Qala Saku, home')} className="inline-flex">
          <QalaLogo markClassName="h-7" textClassName="text-xl" />
        </Link>

        {state.kind === 'loading' && (
          <div className="flex items-center gap-2 text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('Memuat undangan...', 'Loading invite...')}
          </div>
        )}

        {state.kind === 'signed-out' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {t('Kamu diundang kelola keuangan bersama', "You're invited to manage money together")}
              </h1>
              <p className="text-muted-foreground">
                {t(
                  'Masuk dengan email yang diundang untuk melihat dan menerima undangan ini.',
                  'Sign in with the invited email to see and accept this invite.'
                )}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href={`/auth/sign-in?next=${encodeURIComponent(here)}`}>{t('Masuk', 'Sign in')}</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/auth/sign-up?next=${encodeURIComponent(here)}`}>{t('Daftar gratis', 'Sign up free')}</Link>
              </Button>
            </div>
          </div>
        )}

        {state.kind === 'ready' && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <h1 className="text-xl font-bold tracking-tight">
                  {t(
                    `${state.invite.ownerName} mengajakmu kelola keuangan bersama`,
                    `${state.invite.ownerName} invited you to manage money together`
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t('Sebagai', 'As')}{' '}
                  <span className="font-medium text-foreground">{t(...SPACE_ROLE_LABEL[state.invite.role])}</span>:{' '}
                  {t(...SPACE_ROLE_HINT[state.invite.role]).toLowerCase()}
                </p>
              </div>
            </div>
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              {t(
                'Data pribadimu tetap terpisah. Kamu bisa berpindah antara ruang pribadi dan ruang bersama kapan saja, atau keluar dari ruang bersama lewat Pengaturan.',
                'Your personal data stays separate. You can switch between your personal and shared space any time, or leave the shared space in Settings.'
              )}
            </p>
            {state.myEmail.toLowerCase() !== state.invite.email && (
              <p role="alert" className="text-sm text-destructive">
                {t(
                  `Undangan ini untuk ${state.invite.email}, sedangkan kamu masuk sebagai ${state.myEmail}. Keluar lalu masuk dengan email yang diundang.`,
                  `This invite is for ${state.invite.email}, but you're signed in as ${state.myEmail}. Sign out and sign in with the invited email.`
                )}
              </p>
            )}
            {acceptError && (
              <p role="alert" className="text-sm text-destructive">
                {acceptError}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={accept} disabled={accepting} className="flex-1">
                {accepting ? t('Menerima...', 'Accepting...') : t('Terima undangan', 'Accept invite')}
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/dashboard">{t('Nanti saja', 'Maybe later')}</Link>
              </Button>
            </div>
          </div>
        )}

        {state.kind === 'error' && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold tracking-tight">{t('Undangan tidak bisa dibuka', "Can't open this invite")}</h1>
            <p className="text-muted-foreground">{state.message}</p>
            <Button asChild variant="outline">
              <Link href="/dashboard">{t('Ke dashboard', 'Go to dashboard')}</Link>
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}
