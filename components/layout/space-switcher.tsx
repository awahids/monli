'use client';

import { Check, ChevronsUpDown, Eye, User, Users } from 'lucide-react';

import { useAppStore } from '@/lib/store';
import { switchSpace } from '@/lib/space-client';
import { SPACE_ROLE_LABEL } from '@/lib/space';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useT } from '@/lib/i18n';

/** Switch between the personal space and shared spaces the user joined. Hidden when there are none. */
export function SpaceSwitcher() {
  const { user, space } = useAppStore();
  const { t } = useT();
  if (!user || !space || space.joined.length === 0) return null;

  const current = space.isOwn ? t('Pribadi', 'Personal') : space.ownerName;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 px-2"
          aria-label={t(`Ruang: ${current}. Ganti ruang`, `Space: ${current}. Switch space`)}
        >
          {space.isOwn ? <User className="h-4 w-4 shrink-0" /> : <Users className="h-4 w-4 shrink-0 text-primary" />}
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t('Pindah ruang', 'Switch space')}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => !space.isOwn && switchSpace(null)}>
          <User className="mr-2 h-4 w-4" />
          <span className="flex-1">{t('Pribadi', 'Personal')}</span>
          {space.isOwn && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {space.joined.map((j) => (
          <DropdownMenuItem key={j.ownerId} onClick={() => j.ownerId !== space.ownerId && switchSpace(j.ownerId)}>
            <Users className="mr-2 h-4 w-4" />
            <span className="flex-1 truncate">
              {j.ownerName}
              <span className="block text-xs text-muted-foreground">{t(...SPACE_ROLE_LABEL[j.role])}</span>
            </span>
            {j.ownerId === space.ownerId && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Reminds members whose data they are looking at, and whether they can change it. */
export function SpaceBanner() {
  const { space } = useAppStore();
  const { t } = useT();
  if (!space || space.isOwn) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
    >
      {space.canWrite ? <Users className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4 text-primary" />}
      <p className="flex-1">
        {t('Ruang bersama', 'Shared space')} <span className="font-semibold">{space.ownerName}</span> ·{' '}
        {space.canWrite
          ? t('kamu bisa mencatat dan mengubah data', 'you can record and change data')
          : t('kamu hanya bisa melihat', 'you can only view')}
      </p>
      <Button variant="ghost" size="sm" className="h-8" onClick={() => switchSpace(null)}>
        {t('Kembali ke pribadi', 'Back to personal')}
      </Button>
    </div>
  );
}
