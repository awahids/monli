'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstallCard } from '@/components/pwa/install-card';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const SLIDES = [
  {
    image: '/landing/promo/lg/010.webp',
    title: 'Selamat datang di Qala Saku',
    text: 'Catat harian, atur bulanan, dan pahami ke mana uangmu pergi.',
    titleEn: 'Welcome to Qala Saku',
    textEn: 'Record daily, plan monthly, and understand where your money goes.',
  },
  {
    image: '/landing/promo/lg/030.webp',
    title: 'Semua akun, satu saldo',
    text: 'Rekening bank, e-wallet, dan uang tunai dalam satu layar. Saldo ikut bergerak setiap kali kamu mencatat.',
    titleEn: 'All accounts, one balance',
    textEn: 'Bank accounts, e-wallets and cash on one screen. Balances move every time you record.',
  },
  {
    image: '/landing/promo/lg/050.webp',
    title: 'Catat dalam detik',
    text: 'Tekan tombol + di bawah layar kapan saja. Kategori dan tag menyesuaikan kebiasaanmu.',
    titleEn: 'Record in seconds',
    textEn: 'Tap the + button at the bottom anytime. Categories and tags adapt to your habits.',
  },
  {
    image: '/landing/promo/lg/070.webp',
    title: 'Budget ikut tanggal gajian',
    text: 'Atur batas belanja per kategori, lalu lihat sisa dan jatah harianmu sampai gajian berikutnya.',
    titleEn: 'Budgets follow your payday',
    textEn: 'Set spending limits per category, then see what is left and your daily allowance until the next payday.',
  },
  {
    image: '/landing/promo/lg/090.webp',
    title: 'Siap mulai',
    text: 'Pasang Qala Saku di layar utama supaya mencatat semudah membuka aplikasi.',
    titleEn: 'Ready to go',
    textEn: 'Install Qala Saku on your home screen so recording is as easy as opening an app.',
  },
];

const OPEN_EVENT = 'saku:onboarding';
const seenKey = (userId: string) => `saku_intro_seen:${userId}`;

/** Opens the onboarding as a preview, e.g. from Settings. */
export function openOnboarding() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * Shows the onboarding once to users who have not finished setting up, and
 * on demand as a preview (Settings, the menu, or `?onboarding=preview`).
 */
export function OnboardingGate() {
  const user = useAppStore((s) => s.user);
  const [mode, setMode] = useState<'new' | 'preview' | null>(null);

  useEffect(() => {
    const preview = () => setMode('preview');
    window.addEventListener(OPEN_EVENT, preview);
    if (new URLSearchParams(window.location.search).get('onboarding') === 'preview') preview();
    return () => window.removeEventListener(OPEN_EVENT, preview);
  }, []);

  useEffect(() => {
    if (!user || user.onboardingCompleted) return;
    try {
      if (!localStorage.getItem(seenKey(user.id))) setMode((m) => m ?? 'new');
    } catch {}
  }, [user]);

  if (!mode) return null;

  const close = () => {
    if (mode === 'new' && user) {
      try {
        localStorage.setItem(seenKey(user.id), '1');
      } catch {}
    }
    const url = new URL(window.location.href);
    if (url.searchParams.has('onboarding')) {
      url.searchParams.delete('onboarding');
      window.history.replaceState(null, '', url);
    }
    setMode(null);
  };

  return <Onboarding preview={mode === 'preview'} onClose={close} />;
}

function Onboarding({ preview, onClose }: { preview: boolean; onClose: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const { t } = useT();
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  const go = (i: number) => {
    const el = track.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('Panduan awal Qala Saku', 'Qala Saku intro')}
      className="fixed inset-0 z-[90] bg-black/40 animate-in fade-in-0"
    >
      <div className="mx-auto flex h-[100dvh] w-full max-w-md flex-col bg-background pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] sm:border-x">
        <div className="flex h-14 items-center justify-between px-4">
          {preview ? (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{t('Pratinjau', 'Preview')}</span>
          ) : (
            <span />
          )}
          {!last && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t('Lewati', 'Skip')}
            </Button>
          )}
        </div>

        {/* Native swipe: horizontal scroll with snapping, one slide per screen. */}
        <div
          ref={track}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="flex flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SLIDES.map((s, i) => (
            <section
              key={s.title}
              aria-hidden={i !== index}
              className="flex w-full shrink-0 snap-center flex-col overflow-y-auto px-6"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-muted">
                <Image src={s.image} alt="" fill sizes="(max-width: 448px) 100vw, 400px" className="object-cover" priority={i === 0} />
              </div>
              <h2 className="mt-8 font-display text-2xl font-bold tracking-tight">{t(s.title, s.titleEn)}</h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{t(s.text, s.textEn)}</p>
              {i === SLIDES.length - 1 && <InstallCard className="mt-6" />}
            </section>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-6">
          <div className="flex gap-1.5" role="tablist" aria-label={t('Halaman panduan', 'Guide pages')}>
            {SLIDES.map((s, i) => (
              <button
                key={s.title}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={t(`Halaman ${i + 1}`, `Page ${i + 1}`)}
                onClick={() => go(i)}
                className={cn('h-2 rounded-full transition-all', i === index ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30')}
              />
            ))}
          </div>
          <Button size="lg" className="rounded-full" onClick={() => (last ? onClose() : go(index + 1))}>
            {last
              ? preview
                ? t('Tutup pratinjau', 'Close preview')
                : t('Mulai sekarang', 'Get started')
              : t('Lanjut', 'Next')}
            {!last && <ArrowRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
