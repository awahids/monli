'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, Dices, Loader2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/brand/user-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/lib/i18n';
import { shrinkImage } from '@/lib/ocr';
import { useAppStore } from '@/lib/store';

/**
 * The profile picture: a drawn cartoon for everyone ("Acak lagi" for another
 * face), and for PRO one that looks like their own photo, read by AI.
 */
export function AvatarCard() {
  const { t } = useT();
  const user = useAppStore((s) => s.user);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'draw' | 'photo' | null>(null);
  if (!user) return null;
  const isPro = user.plan === 'PRO';

  const save = (avatar: { avatarSeed?: string | null; avatarPath: string | null }) => {
    const current = useAppStore.getState().user;
    if (current) useAppStore.getState().setUser({ ...current, ...avatar });
  };

  const reset = async (method: 'PATCH' | 'DELETE') => {
    setBusy('draw');
    try {
      const res = await fetch('/api/profile/avatar', { method });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      save(data);
    } catch {
      toast.error(t('Gagal mengganti foto profil. Coba lagi.', 'Could not change the profile picture. Try again.'));
    } finally {
      setBusy(null);
    }
  };

  const fromPhoto = async (file: File) => {
    setBusy('photo');
    try {
      const body = new FormData();
      body.append('file', await shrinkImage(file, 1024), 'photo.jpg');
      const res = await fetch('/api/profile/avatar', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      save(data);
      toast.success(t('Foto kartunmu sudah jadi!', 'Your cartoon is ready!'));
    } catch (e) {
      toast.error((e as Error).message || t('Gagal membuat foto kartun. Coba lagi.', 'Could not make the cartoon. Try again.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Foto profil', 'Profile picture')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative self-center" data-testid="profile-avatar">
          <UserAvatar user={user} className="h-24 w-24 ring-4 ring-muted" />
          {busy === 'photo' && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </span>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            {user.avatarPath ? (
              <Button variant="outline" size="sm" disabled={!!busy} onClick={() => reset('DELETE')}>
                <Undo2 className="mr-1.5 h-4 w-4" />
                {t('Pakai avatar gambar', 'Use the drawn avatar')}
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled={!!busy} onClick={() => reset('PATCH')}>
                <Dices className="mr-1.5 h-4 w-4" />
                {t('Acak lagi', 'Shuffle')}
              </Button>
            )}
            <Button size="sm" disabled={!isPro || !!busy} onClick={() => input.current?.click()}>
              <Camera className="mr-1.5 h-4 w-4" />
              {busy === 'photo' ? t('Sedang menggambar…', 'Drawing…') : t('Ubah fotoku jadi kartun', 'Turn my photo into a cartoon')}
              <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-semibold">PRO</span>
            </Button>
            <input
              ref={input}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) fromPhoto(file);
              }}
            />
          </div>
          {busy === 'photo' ? (
            <p className="text-xs text-muted-foreground">
              {t('AI sedang melihat fotomu, biasanya hanya beberapa detik.', 'The AI is looking at your photo, usually just a few seconds.')}
            </p>
          ) : isPro ? (
            <p className="text-xs text-muted-foreground">
              {t(
                'AI melihat fotomu untuk memilih warna kulit, model dan warna rambut atau hijab, bentuk wajah, kumis atau janggut, kacamata, baju, dan ekspresi kartunmu. Fotomu tidak disimpan.',
                'The AI looks at your photo to pick your cartoon\'s skin, hair style and colour or hijab, face shape, moustache or beard, glasses, clothes and expression. Your photo is not stored.'
              )}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('Ubah fotomu jadi kartun dengan AI khusus PRO. ', 'Turning your photo into a cartoon with AI is PRO only. ')}
              <Link href="/upgrade" className="web-only font-medium text-primary underline-offset-2 hover:underline">
                {t('Lihat paket PRO', 'See PRO plans')}
              </Link>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
