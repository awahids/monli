'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Users } from 'lucide-react';

import { supabase } from '@/lib/auth';
import { SPACE_ROLE_HINT, SPACE_ROLE_LABEL } from '@/lib/space';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { QalaLogo } from '@/components/brand/qala-mark';

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
        setState({ kind: 'error', message: body.error || 'Undangan tidak ditemukan.' });
        return;
      }
      setState({ kind: 'ready', invite: body as Invite, myEmail: data.user.email ?? '' });
    })().catch(() => setState({ kind: 'error', message: 'Gagal memuat undangan.' }));
  }, [params.token]);

  const accept = async () => {
    setAccepting(true);
    setAcceptError(null);
    const res = await fetch(`/api/spaces/invite/${params.token}`, { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAccepting(false);
      setAcceptError(body.error || 'Gagal menerima undangan.');
      return;
    }
    // Full load so the app starts fresh inside the shared space.
    window.location.assign('/dashboard');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md space-y-6 p-6 sm:p-8">
        <Link href="/" aria-label="Qala Saku, beranda" className="inline-flex">
          <QalaLogo markClassName="h-7" textClassName="text-xl" />
        </Link>

        {state.kind === 'loading' && (
          <div className="flex items-center gap-2 text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat undangan...
          </div>
        )}

        {state.kind === 'signed-out' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Kamu diundang kelola keuangan bersama</h1>
              <p className="text-muted-foreground">
                Masuk dengan email yang diundang untuk melihat dan menerima undangan ini.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href={`/auth/sign-in?next=${encodeURIComponent(here)}`}>Masuk</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/auth/sign-up?next=${encodeURIComponent(here)}`}>Daftar gratis</Link>
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
                  {state.invite.ownerName} mengajakmu kelola keuangan bersama
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sebagai <span className="font-medium text-foreground">{SPACE_ROLE_LABEL[state.invite.role]}</span>:{' '}
                  {SPACE_ROLE_HINT[state.invite.role].toLowerCase()}
                </p>
              </div>
            </div>
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Data pribadimu tetap terpisah. Kamu bisa berpindah antara ruang pribadi dan ruang bersama kapan saja, atau
              keluar dari ruang bersama lewat Pengaturan.
            </p>
            {state.myEmail.toLowerCase() !== state.invite.email && (
              <p role="alert" className="text-sm text-destructive">
                Undangan ini untuk {state.invite.email}, sedangkan kamu masuk sebagai {state.myEmail}. Keluar lalu masuk
                dengan email yang diundang.
              </p>
            )}
            {acceptError && (
              <p role="alert" className="text-sm text-destructive">
                {acceptError}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={accept} disabled={accepting} className="flex-1">
                {accepting ? 'Menerima...' : 'Terima undangan'}
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/dashboard">Nanti saja</Link>
              </Button>
            </div>
          </div>
        )}

        {state.kind === 'error' && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold tracking-tight">Undangan tidak bisa dibuka</h1>
            <p className="text-muted-foreground">{state.message}</p>
            <Button asChild variant="outline">
              <Link href="/dashboard">Ke dashboard</Link>
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}
