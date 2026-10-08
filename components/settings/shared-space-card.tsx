'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Crown, LogOut, MessageCircle, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';
import { switchSpace } from '@/lib/space-client';
import { SPACE_MEMBER_LIMIT, SPACE_ROLE_HINT, SPACE_ROLE_LABEL } from '@/lib/space';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/lib/i18n';

type Role = 'editor' | 'viewer';
interface Member {
  id: string;
  email: string;
  role: Role;
  status: 'pending' | 'active';
  token: string;
  member_name: string | null;
}

function inviteLink(token: string) {
  return `${window.location.origin}/invite/${token}`;
}

function RolePicker({ value, onChange, id }: { value: Role; onChange: (r: Role) => void; id?: string }) {
  const { t } = useT();
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Role)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(['editor', 'viewer'] as const).map((r) => (
          <SelectItem key={r} value={r}>
            {t(...SPACE_ROLE_LABEL[r])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** "Kelola bersama": invite family to the owner's space (PRO) and manage spaces you joined. */
export function SharedSpaceCard() {
  const { user, space } = useAppStore();
  const { t } = useT();
  const [members, setMembers] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [leaving, setLeaving] = useState<{ id: string; ownerId: string; ownerName: string } | null>(null);

  const isPro = user?.plan === 'PRO';

  const load = useCallback(async () => {
    const res = await fetch('/api/spaces/members');
    const body = await res.json().catch(() => ({}));
    if (res.ok) setMembers(body.data ?? []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (!user || !space) return null;

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInviting(true);
    try {
      const res = await fetch('/api/spaces/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || t('Gagal mengundang', 'Could not invite'));
      setMembers((m) => [...m, body]);
      setEmail('');
      toast.success(t('Undangan dibuat. Bagikan link-nya ke orang yang kamu undang.', 'Invite created. Share the link with the person you invited.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal mengundang', 'Could not invite'));
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (m: Member, next: Role) => {
    setMembers((ms) => ms.map((x) => (x.id === m.id ? { ...x, role: next } : x)));
    const res = await fetch(`/api/spaces/members/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: next }),
    });
    if (!res.ok) {
      setMembers((ms) => ms.map((x) => (x.id === m.id ? { ...x, role: m.role } : x)));
      toast.error(t('Gagal mengubah peran', 'Could not change role'));
    } else {
      toast.success(t(`Peran diubah ke ${SPACE_ROLE_LABEL[next][0]}`, `Role changed to ${SPACE_ROLE_LABEL[next][1]}`));
    }
  };

  const remove = async () => {
    if (!removing) return;
    const res = await fetch(`/api/spaces/members/${removing.id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(t('Gagal menghapus', 'Could not remove'));
      return;
    }
    setMembers((ms) => ms.filter((x) => x.id !== removing.id));
    toast.success(removing.status === 'pending' ? t('Undangan dibatalkan', 'Invite cancelled') : t('Anggota dihapus', 'Member removed'));
  };

  const leave = async () => {
    if (!leaving) return;
    const res = await fetch(`/api/spaces/members/${leaving.id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(t('Gagal keluar dari ruang', 'Could not leave the space'));
      return;
    }
    toast.success(t(`Kamu keluar dari ruang ${leaving.ownerName}`, `You left ${leaving.ownerName}'s space`));
    // Leaving the space you're in: go back to your own.
    switchSpace(space.ownerId === leaving.ownerId ? null : space.isOwn ? null : space.ownerId, '/settings');
  };

  const copy = async (m: Member) => {
    try {
      await navigator.clipboard.writeText(inviteLink(m.token));
      setCopied(m.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t('Gagal menyalin, salin manual: ', 'Could not copy, copy it manually: ') + inviteLink(m.token));
    }
  };

  const whatsapp = (m: Member) =>
    `https://wa.me/?text=${encodeURIComponent(
      t(
        `Aku mengundangmu kelola keuangan bersama di Qala Saku. Masuk dengan ${m.email} lalu buka: ${inviteLink(m.token)}`,
        `I'm inviting you to manage our finances together on Qala Saku. Sign in with ${m.email} and open: ${inviteLink(m.token)}`
      )
    )}`;

  const full = members.length >= SPACE_MEMBER_LIMIT;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> {t('Kelola bersama', 'Shared space')}
          {!isPro && (
            <Badge variant="secondary" className="gap-1">
              <Crown className="h-3 w-3" /> PRO
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {t(
            `Undang pasangan atau keluarga untuk mencatat dan memantau keuangan bersama, hingga ${SPACE_MEMBER_LIMIT} orang. Data pribadi mereka tetap terpisah.`,
            `Invite your partner or family to record and track finances together, up to ${SPACE_MEMBER_LIMIT} people. Their personal data stays separate.`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isPro ? (
          <>
            <form onSubmit={invite} className="space-y-3" noValidate>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">{t('Email yang diundang', 'Email to invite')}</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    inputMode="email"
                    autoComplete="off"
                    placeholder={t('nama@email.com', 'name@email.com')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={full}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">{t('Peran', 'Role')}</Label>
                  <RolePicker id="invite-role" value={role} onChange={setRole} />
                </div>
                <Button type="submit" disabled={inviting || full || !email.trim()}>
                  {inviting ? t('Mengundang...', 'Inviting...') : t('Undang', 'Invite')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t(...SPACE_ROLE_LABEL[role])}: {t(...SPACE_ROLE_HINT[role])}{' '}
                {full && t(`Ruang sudah penuh (${SPACE_MEMBER_LIMIT} orang).`, `The space is full (${SPACE_MEMBER_LIMIT} people).`)}
              </p>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </form>

            {loaded && members.length > 0 && (
              <ul className="divide-y rounded-lg border">
                {members.map((m) => (
                  <li key={m.id} className="flex flex-col gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{m.member_name || m.email}</p>
                      <p className="flex items-center gap-2 truncate text-xs text-muted-foreground">
                        {m.member_name && <span className="truncate">{m.email}</span>}
                        <Badge variant={m.status === 'active' ? 'default' : 'outline'} className="shrink-0">
                          {m.status === 'active' ? t('Aktif', 'Active') : t('Menunggu', 'Pending')}
                        </Badge>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {m.status === 'pending' && (
                        <>
                          <Button type="button" variant="outline" size="sm" onClick={() => copy(m)}>
                            {copied === m.id ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                            {copied === m.id ? t('Tersalin', 'Copied') : t('Salin link', 'Copy link')}
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <a href={whatsapp(m)} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="mr-1 h-4 w-4" /> WhatsApp
                            </a>
                          </Button>
                        </>
                      )}
                      <div className="min-w-[8rem] flex-1">
                        <RolePicker value={m.role} onChange={(r) => changeRole(m, r)} />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={
                          m.status === 'pending'
                            ? t(`Batalkan undangan ${m.email}`, `Cancel invite for ${m.email}`)
                            : t(`Hapus ${m.member_name || m.email}`, `Remove ${m.member_name || m.email}`)
                        }
                        onClick={() => setRemoving(m)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="web-only flex flex-col gap-3 rounded-lg border border-dashed p-4">
            <p className="flex-1 text-sm text-muted-foreground">
              {t(
                'Upgrade ke PRO untuk mengundang keluarga. Orang yang kamu undang tidak perlu berlangganan.',
                'Upgrade to PRO to invite family. The people you invite do not need a subscription.'
              )}
            </p>
            <Button asChild>
              <Link href="/upgrade">{t('Upgrade ke PRO', 'Upgrade to PRO')}</Link>
            </Button>
          </div>
        )}

        {space.joined.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('Ruang bersama yang kamu ikuti', 'Shared spaces you joined')}</p>
            <ul className="divide-y rounded-lg border">
              {space.joined.map((j) => {
                const here = space.ownerId === j.ownerId;
                return (
                  <li key={j.ownerId} className="flex flex-wrap items-center gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{j.ownerName}</p>
                      <p className="text-xs text-muted-foreground">{t(...SPACE_ROLE_LABEL[j.role])}</p>
                    </div>
                    <Button
                      type="button"
                      variant={here ? 'secondary' : 'outline'}
                      size="sm"
                      disabled={here}
                      onClick={() => switchSpace(j.ownerId)}
                    >
                      {here ? t('Sedang dibuka', 'Open now') : t('Buka', 'Open')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setLeaving({ id: j.membershipId, ownerId: j.ownerId, ownerName: j.ownerName })}
                    >
                      <LogOut className="mr-1 h-4 w-4" /> {t('Keluar', 'Leave')}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={
          removing?.status === 'pending'
            ? t('Batalkan undangan?', 'Cancel invite?')
            : t(`Hapus ${removing?.member_name || removing?.email}?`, `Remove ${removing?.member_name || removing?.email}?`)
        }
        description={
          removing?.status === 'pending'
            ? t('Link undangan tidak bisa dipakai lagi.', 'The invite link will stop working.')
            : t(
                'Mereka tidak bisa lagi melihat atau mengubah keuanganmu. Transaksi yang sudah mereka catat tetap ada.',
                'They can no longer view or change your finances. Transactions they recorded stay.'
              )
        }
        confirmLabel={removing?.status === 'pending' ? t('Batalkan undangan', 'Cancel invite') : t('Hapus', 'Remove')}
        cancelLabel={t('Kembali', 'Back')}
        onConfirm={remove}
      />
      <ConfirmDialog
        open={leaving !== null}
        onOpenChange={(o) => !o && setLeaving(null)}
        title={t(`Keluar dari ruang ${leaving?.ownerName ?? ''}?`, `Leave ${leaving?.ownerName ?? ''}'s space?`)}
        description={t(
          'Kamu tidak bisa lagi melihat keuangan bersama ini sampai diundang lagi.',
          'You will no longer see these shared finances until invited again.'
        )}
        confirmLabel={t('Keluar', 'Leave')}
        cancelLabel={t('Batal', 'Cancel')}
        onConfirm={leave}
      />
    </Card>
  );
}
