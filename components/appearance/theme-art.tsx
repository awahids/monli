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
        <StarRosette className="absolute -right-10 -top-10 h-44 w-44 text-amber-300/30" />
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-6 w-full text-amber-300/40">
          <path d="M0 0 H100 V8 C80 8 70 30 50 30 C30 30 20 8 0 8 Z" fill="none" stroke="currentColor" strokeWidth="0.6" />
        </svg>
      </span>
    );
  }
  if (theme === 'cartoon') {
    return (
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <span className="absolute -right-8 top-14 h-20 w-20 rounded-full bg-yellow-300/25" />
        <span className="absolute right-24 top-3 h-3 w-3 rounded-full bg-white/50" />
        <span className="absolute right-32 top-10 h-2 w-2 rounded-full bg-white/40" />
        <PiggyMascot className="absolute right-2 top-2 h-16 w-16 -rotate-6" />
      </span>
    );
  }
  return null;
}

/** An eight-pointed star (two squares) inside rings, the classic Islamic geometric motif. */
export function StarRosette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="50" cy="50" r="46" />
      <circle cx="50" cy="50" r="40" strokeDasharray="2 3" />
      <rect x="22" y="22" width="56" height="56" />
      <rect x="22" y="22" width="56" height="56" transform="rotate(45 50 50)" />
      <circle cx="50" cy="50" r="14" />
      <rect x="38" y="38" width="24" height="24" transform="rotate(45 50 50)" />
    </svg>
  );
}

/** "Celengan", Qala Saku's own piggy-bank mascot for the Kartun theme (original artwork). */
export function PiggyMascot({ className }: { className?: string }) {
  const ink = '#1E293B';
  return (
    <svg viewBox="0 0 120 120" className={cn('drop-shadow-[2px_2px_0_rgba(30,41,59,0.6)]', className)}>
      {/* coin dropping in */}
      <g>
        <circle cx="62" cy="14" r="11" fill="#FACC15" stroke={ink} strokeWidth="3" />
        <path d="M62 8 V20" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* legs */}
      <rect x="32" y="88" width="13" height="18" rx="5" fill="#F9A8D4" stroke={ink} strokeWidth="3" />
      <rect x="72" y="88" width="13" height="18" rx="5" fill="#F9A8D4" stroke={ink} strokeWidth="3" />
      {/* ears */}
      <path d="M34 40 L30 22 L48 32 Z" fill="#F472B6" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M84 40 L90 22 L72 32 Z" fill="#F472B6" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      {/* body */}
      <ellipse cx="60" cy="64" rx="44" ry="34" fill="#F9A8D4" stroke={ink} strokeWidth="3" />
      {/* coin slot */}
      <rect x="50" y="32" width="22" height="5" rx="2.5" fill={ink} />
      {/* tail */}
      <path d="M104 62 c8 -4 8 6 2 6 c-5 0 -3 -8 4 -9" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      {/* eyes */}
      <circle cx="44" cy="56" r="5" fill={ink} />
      <circle cx="76" cy="56" r="5" fill={ink} />
      <circle cx="45.5" cy="54.5" r="1.6" fill="#fff" />
      <circle cx="77.5" cy="54.5" r="1.6" fill="#fff" />
      {/* cheeks */}
      <ellipse cx="36" cy="68" rx="5" ry="3" fill="#FB7185" opacity="0.7" />
      <ellipse cx="84" cy="68" rx="5" ry="3" fill="#FB7185" opacity="0.7" />
      {/* snout */}
      <ellipse cx="60" cy="72" rx="13" ry="9" fill="#F472B6" stroke={ink} strokeWidth="3" />
      <circle cx="55" cy="72" r="2.4" fill={ink} />
      <circle cx="65" cy="72" r="2.4" fill={ink} />
    </svg>
  );
}
