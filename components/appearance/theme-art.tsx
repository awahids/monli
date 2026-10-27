'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_THEME, THEMES, type Theme } from '@/lib/appearance';
import { cn } from '@/lib/utils';

/** The theme currently on <html>, kept in sync when Settings changes it. */
export function useActiveTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setTheme(THEMES.find((t) => t.id === root.dataset.style)?.id ?? DEFAULT_THEME);
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['data-style'] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

/** "Assalamu'alaikum" in the Islami theme, "Halo" in Kartun, the time of day otherwise. */
export function themedGreeting(theme: Theme, timeOfDay: string): string {
  if (theme === 'islamic') return "Assalamu'alaikum";
  if (theme === 'cartoon') return 'Halo';
  return timeOfDay;
}

/** Decoration behind the balance hero; the hero is `isolate` so this stays under its text. */
export function HeroArt() {
  const theme = useActiveTheme();
  if (theme === 'islamic') {
    return (
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Still geometric pattern, fading out towards the text on the left. */}
        <span className="islamic-hero-pattern absolute inset-0" />
        <TwinkleStar className="theme-anim-twinkle absolute right-24 top-4 h-3 w-3 text-amber-200" />
        <TwinkleStar className="theme-anim-twinkle absolute right-[7.5rem] top-11 h-2 w-2 text-amber-100 [animation-delay:1s]" />
        <TwinkleStar className="theme-anim-twinkle absolute right-[4.5rem] top-14 h-2 w-2 text-amber-200 [animation-delay:2s]" />
        <IslamicLantern swing className="absolute right-5 top-0 h-20 w-10" />
      </span>
    );
  }
  if (theme === 'cartoon') {
    return (
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <span className="absolute -right-8 top-14 h-20 w-20 rounded-full bg-yellow-300/25" />
        <span className="theme-anim-twinkle absolute right-24 top-3 h-3 w-3 rounded-full bg-white/50" />
        <span className="theme-anim-twinkle absolute right-32 top-10 h-2 w-2 rounded-full bg-white/40 [animation-delay:1.2s]" />
        <SquirrelMascot className="absolute right-2 top-2 h-16 w-16 -rotate-6" />
      </span>
    );
  }
  return null;
}

/** A small four-pointed sparkle. */
function TwinkleStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" className={className}>
      <path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * A hanging lantern (fanous) for the Islami theme. With `swing` it sways on its
 * chain and its light flickers softly (app/globals.css, off with reduced motion).
 */
export function IslamicLantern({ className, swing = false }: { className?: string; swing?: boolean }) {
  const gold = '#E9C46A';
  const dark = '#7A5A16';
  return (
    <svg viewBox="0 0 48 96" className={className}>
      <defs>
        <radialGradient id="lantern-light" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#FFF7D6" />
          <stop offset="55%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
      </defs>
      <g className={swing ? 'islamic-lantern' : undefined}>
        {/* chain */}
        <path d="M24 0 V18" stroke={gold} strokeWidth="1.5" strokeDasharray="3 2" />
        <circle cx="24" cy="20" r="2.5" fill="none" stroke={gold} strokeWidth="1.5" />
        {/* dome with finial */}
        <path d="M24 22 C30 28 36 31 36 36 H12 C12 31 18 28 24 22 Z" fill={gold} stroke={dark} strokeWidth="1" />
        <rect x="10" y="36" width="28" height="3" rx="1" fill={gold} stroke={dark} strokeWidth="1" />
        {/* glass body: light inside, gold frame with a pointed-arch window */}
        <path d="M12 39 H36 L34 70 H14 Z" fill="url(#lantern-light)" className={swing ? 'islamic-glow' : undefined} />
        <path d="M12 39 H36 L34 70 H14 Z" fill="none" stroke={gold} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M24 39 V70" stroke={gold} strokeWidth="1" opacity="0.8" />
        <path d="M19 66 V52 C19 47 24 44 24 44 C24 44 29 47 29 52 V66" fill="none" stroke={dark} strokeWidth="1.1" opacity="0.7" />
        {/* base and drop */}
        <rect x="12" y="70" width="24" height="3" rx="1" fill={gold} stroke={dark} strokeWidth="1" />
        <path d="M16 73 H32 L26 82 H22 Z" fill={gold} stroke={dark} strokeWidth="1" strokeLinejoin="round" />
        <path d="M24 82 V90" stroke={gold} strokeWidth="1.5" />
        <circle cx="24" cy="92" r="2.2" fill={gold} />
      </g>
    </svg>
  );
}

/** "Tupi", Qala Saku's own squirrel mascot for the Kartun theme: a saver hugging a coin (original artwork). */
export function SquirrelMascot({ className }: { className?: string }) {
  const ink = '#1E293B';
  return (
    <svg viewBox="0 0 120 120" className={cn('drop-shadow-[2px_2px_0_rgba(30,41,59,0.6)]', className)}>
      {/* Gentle loop (app/globals.css, off with reduced motion): bob, tail sway, blink, coin sparkle. */}
      <g className="tupi-bob">
      {/* bushy tail */}
      <g className="tupi-tail">
      <path
        d="M78 96 C104 96 116 70 106 46 C98 26 74 22 70 40 C68 50 80 52 84 60 C90 72 80 84 70 86 Z"
        fill="#F59E0B"
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M96 44 C100 54 98 66 90 74" fill="none" stroke="#FCD34D" strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* body */}
      <ellipse cx="54" cy="80" rx="26" ry="24" fill="#D97706" stroke={ink} strokeWidth="3" />
      <ellipse cx="54" cy="86" rx="15" ry="14" fill="#FDE68A" />
      {/* feet */}
      <ellipse cx="42" cy="104" rx="9" ry="5" fill="#D97706" stroke={ink} strokeWidth="3" />
      <ellipse cx="66" cy="104" rx="9" ry="5" fill="#D97706" stroke={ink} strokeWidth="3" />
      {/* ears */}
      <path d="M32 30 L30 12 L44 24 Z" fill="#D97706" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M68 24 L80 12 L78 30 Z" fill="#D97706" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      {/* head */}
      <circle cx="55" cy="44" r="25" fill="#F59E0B" stroke={ink} strokeWidth="3" />
      <ellipse cx="55" cy="54" rx="13" ry="9" fill="#FDE68A" />
      {/* eyes */}
      <g className="tupi-blink">
        <circle cx="45" cy="41" r="4.5" fill={ink} />
        <circle cx="65" cy="41" r="4.5" fill={ink} />
        <circle cx="46.3" cy="39.6" r="1.5" fill="#fff" />
        <circle cx="66.3" cy="39.6" r="1.5" fill="#fff" />
      </g>
      {/* cheeks, nose and smile */}
      <ellipse cx="38" cy="51" rx="4.5" ry="3" fill="#FB7185" opacity="0.6" />
      <ellipse cx="72" cy="51" rx="4.5" ry="3" fill="#FB7185" opacity="0.6" />
      <ellipse cx="55" cy="50" rx="3" ry="2.2" fill={ink} />
      <path d="M50 55 Q55 59 60 55" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      {/* coin hugged in both paws */}
      <circle cx="54" cy="80" r="12" fill="#FACC15" stroke={ink} strokeWidth="3" />
      <path d="M54 74 V86" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="41" cy="80" rx="6" ry="4.5" fill="#F59E0B" stroke={ink} strokeWidth="3" />
      <ellipse cx="67" cy="80" rx="6" ry="4.5" fill="#F59E0B" stroke={ink} strokeWidth="3" />
      <path className="tupi-sparkle" d="M63 64 L64.5 68.5 L69 70 L64.5 71.5 L63 76 L61.5 71.5 L57 70 L61.5 68.5 Z" fill="#fff" stroke={ink} strokeWidth="1.2" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
