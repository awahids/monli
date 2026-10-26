'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Lock, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAppStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { PiggyMascot, StarRosette } from '@/components/appearance/theme-art';
import {
  ACCENTS,
  ACCENT_KEY,
  THEMES,
  THEME_KEY,
  applyAppearance,
  effectiveTheme,
  hasOwnColors,
  parseAccent,
  readStored,
  store,
  type Accent,
  type Theme,
} from '@/lib/appearance';

/** Re-applies the stored look once the plan is known, dropping a PRO theme for FREE users. */
export function AppearanceSync() {
  const plan = useAppStore((s) => s.user?.plan);
  useEffect(() => {
    if (!plan) return;
    applyAppearance(parseAccent(readStored(ACCENT_KEY)), effectiveTheme(readStored(THEME_KEY), plan === 'PRO'));
  }, [plan]);
  return null;
}

/** Light/dark, accent colour (every plan) and theme (PRO). */
export function AppearanceCard() {
  const { t, locale } = useT();
  const pick = (pair: readonly [string, string]) => (locale === 'en' ? pair[1] : pair[0]);
  const isPro = useAppStore((s) => s.user?.plan === 'PRO');
  const { theme: mode, setTheme: setMode } = useTheme();
  const [accent, setAccent] = useState<Accent>('teal');
  const [theme, setTheme] = useState<Theme>('classic');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAccent(parseAccent(readStored(ACCENT_KEY)));
    setTheme(effectiveTheme(readStored(THEME_KEY), isPro));
    setMounted(true);
  }, [isPro]);

  const chooseAccent = (next: Accent) => {
    setAccent(next);
    store(ACCENT_KEY, next);
    applyAppearance(next, theme);
  };
  const chooseTheme = (next: Theme) => {
    setTheme(next);
    store(THEME_KEY, next);
    applyAppearance(accent, next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Tampilan', 'Appearance')}</CardTitle>
        <CardDescription>{t('Tersimpan di perangkat ini.', 'Saved on this device.')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('Mode', 'Mode')}</p>
          <ToggleGroup
            type="single"
            variant="outline"
            value={mounted ? mode : undefined}
            onValueChange={(v) => v && setMode(v)}
            className="justify-start"
          >
            <ToggleGroupItem value="light" className="gap-1.5">
              <Sun className="h-4 w-4" />
              {t('Terang', 'Light')}
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" className="gap-1.5">
              <Moon className="h-4 w-4" />
              {t('Gelap', 'Dark')}
            </ToggleGroupItem>
            <ToggleGroupItem value="system" className="gap-1.5">
              <Monitor className="h-4 w-4" />
              {t('Sistem', 'System')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <p id="accent-label" className="text-sm font-medium">{t('Warna aksen', 'Accent colour')}</p>
          {mounted && hasOwnColors(theme) && (
            <p className="text-xs text-muted-foreground">
              {t('Tema ini memakai warnanya sendiri. Warna aksen dipakai lagi di tema lain.', 'This theme has its own colours. The accent colour applies to the other themes.')}
            </p>
          )}
          <div
            role="radiogroup"
            aria-labelledby="accent-label"
            className={cn('flex flex-wrap gap-3', mounted && hasOwnColors(theme) && 'opacity-50')}
          >
            {ACCENTS.map((a) => {
              const selected = mounted && accent === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={pick(a.name)}
                  title={pick(a.name)}
                  onClick={() => chooseAccent(a.id)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-background transition-transform active:scale-90',
                    selected && 'ring-2 ring-foreground'
                  )}
                  style={{ backgroundColor: a.swatch }}
                >
                  {selected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p id="theme-label" className="text-sm font-medium">{t('Tema', 'Theme')}</p>
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">PRO</span>
          </div>
          <div role="radiogroup" aria-labelledby="theme-label" className="grid grid-cols-2 gap-3">
            {THEMES.map((th) => {
              const locked = th.pro && !isPro;
              const selected = mounted && theme === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-disabled={locked}
                  onClick={() => !locked && chooseTheme(th.id)}
                  className={cn(
                    'relative space-y-2 rounded-xl border p-3 text-left transition-colors',
                    selected ? 'border-primary ring-1 ring-primary' : 'hover:bg-muted/50',
                    locked && 'cursor-not-allowed opacity-70'
                  )}
                >
                  <ThemePreview theme={th.id} />
                  <span className="flex items-center gap-1 text-sm font-medium">
                    {pick(th.name)}
                    {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label={t('Khusus PRO', 'PRO only')} />}
                    {selected && <Check className="ml-auto h-4 w-4 text-primary" />}
                  </span>
                  <span className="block text-xs text-muted-foreground">{pick(th.description)}</span>
                </button>
              );
            })}
          </div>
          {!isPro && (
            <p className="text-xs text-muted-foreground">
              {t('Tema selain Klasik khusus PRO. ', 'Themes other than Classic are PRO only. ')}
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

/** A tiny mock screen in the theme's own surfaces, tinted with the current accent. */
function ThemePreview({ theme }: { theme: Theme }) {
  const looks: Record<Theme, { bg: string; card: string; radius: string; border?: string; bar?: string; shadow?: string }> = {
    classic: { bg: '#F2EFE9', card: '#FFFFFF', radius: '6px' },
    minimal: { bg: '#FAFAFA', card: '#FFFFFF', radius: '3px', border: '#E5E7EB' },
    soft: { bg: 'hsl(var(--hue) 45% 93%)', card: '#FFFFFF', radius: '10px' },
    bold: { bg: '#FFFFFF', card: '#FFFFFF', radius: '2px', border: '#111111' },
    islamic: { bg: '#F7F2E6', card: '#FFFFFF', radius: '8px', border: '#E2D3AC', bar: 'linear-gradient(135deg, #16694F, #0B3F33)' },
    cartoon: { bg: '#EAF6FF', card: '#FFFFFF', radius: '10px', border: '#1E293B', bar: '#0B6FD0', shadow: '2px 2px 0 #1E293B' },
  };
  const look = looks[theme];
  return (
    <span aria-hidden className="relative block h-16 overflow-hidden rounded-lg p-2" style={{ backgroundColor: look.bg }}>
      {theme === 'islamic' && <StarRosette className="absolute -right-3 -top-3 h-14 w-14 text-amber-600/30" />}
      {theme === 'cartoon' && <PiggyMascot className="absolute -bottom-1 right-0 z-10 h-9 w-9" />}
      <span
        className={cn('relative block h-5', !look.bar && 'bg-primary')}
        style={{ borderRadius: look.radius, background: look.bar, boxShadow: look.shadow }}
      />
      <span
        className="relative mt-1.5 block h-6"
        style={{ backgroundColor: look.card, borderRadius: look.radius, border: `1px solid ${look.border ?? 'transparent'}`, boxShadow: look.shadow }}
      />
    </span>
  );
}
