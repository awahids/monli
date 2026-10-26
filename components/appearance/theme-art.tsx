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
        <SquirrelMascot className="absolute right-2 top-2 h-16 w-16 -rotate-6" />
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

/** "Tupi", Qala Saku's own squirrel mascot for the Kartun theme: a saver hugging a coin (original artwork). */
export function SquirrelMascot({ className }: { className?: string }) {
  const ink = '#1E293B';
  return (
    <svg viewBox="0 0 120 120" className={cn('drop-shadow-[2px_2px_0_rgba(30,41,59,0.6)]', className)}>
      {/* bushy tail */}
      <path
        d="M78 96 C104 96 116 70 106 46 C98 26 74 22 70 40 C68 50 80 52 84 60 C90 72 80 84 70 86 Z"
        fill="#F59E0B"
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M96 44 C100 54 98 66 90 74" fill="none" stroke="#FCD34D" strokeWidth="4" strokeLinecap="round" />
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
      <circle cx="45" cy="41" r="4.5" fill={ink} />
      <circle cx="65" cy="41" r="4.5" fill={ink} />
      <circle cx="46.3" cy="39.6" r="1.5" fill="#fff" />
      <circle cx="66.3" cy="39.6" r="1.5" fill="#fff" />
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
    </svg>
  );
}
