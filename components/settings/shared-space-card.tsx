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
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Role)}>
      <SelectTrigger id={id} className="w-full sm:w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(['editor', 'viewer'] as const).map((r) => (
          <SelectItem key={r} value={r}>
            {SPACE_ROLE_LABEL[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** "Kelola bersama": invite family to the owner's space (PRO) and manage spaces you joined. */
export function SharedSpaceCard() {
  const { user, space } = useAppStore();
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
      if (!res.ok) throw new Error(body.error || 'Gagal mengundang');
      setMembers((m) => [...m, body]);
      setEmail('');
      toast.success('Undangan dibuat. Bagikan link-nya ke orang yang kamu undang.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengundang');
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
      toast.error('Gagal mengubah peran');
    } else {
      toast.success(`Peran diubah ke ${SPACE_ROLE_LABEL[next]}`);
    }
  };

  const remove = async () => {
    if (!removing) return;
    const res = await fetch(`/api/spaces/members/${removing.id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Gagal menghapus');
      return;
    }
    setMembers((ms) => ms.filter((x) => x.id !== removing.id));
    toast.success(removing.status === 'pending' ? 'Undangan dibatalkan' : 'Anggota dihapus');
  };

  const leave = async () => {
    if (!leaving) return;
    const res = await fetch(`/api/spaces/members/${leaving.id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Gagal keluar dari ruang');
      return;
    }
    toast.success(`Kamu keluar dari ruang ${leaving.ownerName}`);
    // Leaving the space you're in: go back to your own.
    switchSpace(space.ownerId === leaving.ownerId ? null : space.isOwn ? null : space.ownerId, '/settings');
  };

  const copy = async (m: Member) => {
    try {
      await navigator.clipboard.writeText(inviteLink(m.token));
      setCopied(m.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Gagal menyalin, salin manual: ' + inviteLink(m.token));
    }
  };

  const whatsapp = (m: Member) =>
    `https://wa.me/?text=${encodeURIComponent(
      `Aku mengundangmu kelola keuangan bersama di Qala Saku. Masuk dengan ${m.email} lalu buka: ${inviteLink(m.token)}`
    )}`;

  const full = members.length >= SPACE_MEMBER_LIMIT;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Kelola bersama
          {!isPro && (
            <Badge variant="secondary" className="gap-1">
              <Crown className="h-3 w-3" /> PRO
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Undang pasangan atau keluarga untuk mencatat dan memantau keuangan bersama, hingga {SPACE_MEMBER_LIMIT} orang.
          Data pribadi mereka tetap terpisah.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isPro ? (
          <>
            <form onSubmit={invite} className="space-y-3" noValidate>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email yang diundang</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    inputMode="email"
                    autoComplete="off"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={full}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Peran</Label>
                  <RolePicker id="invite-role" value={role} onChange={setRole} />
                </div>
                <Button type="submit" disabled={inviting || full || !email.trim()}>
                  {inviting ? 'Mengundang...' : 'Undang'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {SPACE_ROLE_LABEL[role]}: {SPACE_ROLE_HINT[role]}{' '}
                {full && `Ruang sudah penuh (${SPACE_MEMBER_LIMIT} orang).`}
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
                  <li key={m.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{m.member_name || m.email}</p>
                      <p className="flex items-center gap-2 truncate text-xs text-muted-foreground">
                        {m.member_name && <span className="truncate">{m.email}</span>}
                        <Badge variant={m.status === 'active' ? 'default' : 'outline'} className="shrink-0">
                          {m.status === 'active' ? 'Aktif' : 'Menunggu'}
                        </Badge>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {m.status === 'pending' && (
                        <>
                          <Button type="button" variant="outline" size="sm" onClick={() => copy(m)}>
                            {copied === m.id ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                            {copied === m.id ? 'Tersalin' : 'Salin link'}
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <a href={whatsapp(m)} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="mr-1 h-4 w-4" /> WhatsApp
                            </a>
                          </Button>
                        </>
                      )}
                      <RolePicker value={m.role} onChange={(r) => changeRole(m, r)} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={m.status === 'pending' ? `Batalkan undangan ${m.email}` : `Hapus ${m.member_name || m.email}`}
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
          <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm text-muted-foreground">
              Upgrade ke PRO untuk mengundang keluarga. Orang yang kamu undang tidak perlu berlangganan.
            </p>
            <Button asChild>
              <Link href="/upgrade">Upgrade ke PRO</Link>
            </Button>
          </div>
        )}

        {space.joined.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Ruang bersama yang kamu ikuti</p>
            <ul className="divide-y rounded-lg border">
              {space.joined.map((j) => {
                const here = space.ownerId === j.ownerId;
                return (
                  <li key={j.ownerId} className="flex flex-wrap items-center gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{j.ownerName}</p>
                      <p className="text-xs text-muted-foreground">{SPACE_ROLE_LABEL[j.role]}</p>
                    </div>
                    <Button
                      type="button"
                      variant={here ? 'secondary' : 'outline'}
                      size="sm"
                      disabled={here}
                      onClick={() => switchSpace(j.ownerId)}
                    >
                      {here ? 'Sedang dibuka' : 'Buka'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setLeaving({ id: j.membershipId, ownerId: j.ownerId, ownerName: j.ownerName })}
                    >
                      <LogOut className="mr-1 h-4 w-4" /> Keluar
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
        title={removing?.status === 'pending' ? 'Batalkan undangan?' : `Hapus ${removing?.member_name || removing?.email}?`}
        description={
          removing?.status === 'pending'
            ? 'Link undangan tidak bisa dipakai lagi.'
            : 'Mereka tidak bisa lagi melihat atau mengubah keuanganmu. Transaksi yang sudah mereka catat tetap ada.'
        }
        confirmLabel={removing?.status === 'pending' ? 'Batalkan undangan' : 'Hapus'}
        cancelLabel="Kembali"
        onConfirm={remove}
      />
      <ConfirmDialog
        open={leaving !== null}
        onOpenChange={(o) => !o && setLeaving(null)}
        title={`Keluar dari ruang ${leaving?.ownerName ?? ''}?`}
        description="Kamu tidak bisa lagi melihat keuangan bersama ini sampai diundang lagi."
        confirmLabel="Keluar"
        cancelLabel="Batal"
        onConfirm={leave}
      />
    </Card>
  );
}
