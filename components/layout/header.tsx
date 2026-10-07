'use client';

import { useAppStore } from '@/lib/store';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { Moon, Sun, Laptop, User, LogOut, Search, Languages, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SpaceSwitcher } from './space-switcher';
import { QalaLogo } from '@/components/brand/qala-mark';
import { setLocale, useT } from '@/lib/i18n';

function UserNav() {
  const { user } = useAppStore();
  const { setTheme } = useTheme();
  const router = useRouter();
  const { t, locale } = useT();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t('Berhasil keluar', 'Signed out'));
      router.replace('/auth/sign-in');
      router.refresh();
    } catch (error) {
      toast.error(t('Gagal keluar, coba lagi', 'Could not sign out, try again'));
    }
  };

  const getInitials = (name?: string | null) => {
    return name
      ? name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
      : 'U';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="mr-2 h-4 w-4" />
            <span>{t('Tema', 'Theme')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              <span>{t('Terang', 'Light')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              <span>{t('Gelap', 'Dark')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Laptop className="mr-2 h-4 w-4" />
              <span>{t('Ikuti sistem', 'System')}</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="mr-2 h-4 w-4" />
            <span>{t('Bahasa', 'Language')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {(['id', 'en'] as const).map((l) => (
              <DropdownMenuItem key={l} onClick={() => l !== locale && setLocale(l)}>
                <span className="flex-1">{l === 'id' ? 'Bahasa Indonesia' : 'English'}</span>
                {l === locale && <Check className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>{t('Pengaturan', 'Settings')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('Keluar', 'Sign out')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const { t } = useT();
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between gap-2 px-4 pt-[env(safe-area-inset-top)]">
        <QalaLogo />
        <div className="flex items-center gap-2">
          <OfflineIndicator />
          <Button variant="ghost" size="icon" asChild>
            <Link href="/transactions?search=" aria-label={t('Cari transaksi', 'Search transactions')}>
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <SpaceSwitcher />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
