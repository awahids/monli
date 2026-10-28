import { avatarTraits, type AvatarTraits } from '@/lib/cartoon-avatar';
import { cn } from '@/lib/utils';

const INK = '#161616';
const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** The head outline: a soft, slightly square jaw. */
const HEAD = 'M36 52C36 34 46 26 60 26S84 34 84 52V62C84 78 73 88 60 88S36 78 36 62Z';

function BackHair({ t }: { t: AvatarTraits }) {
  const fill = t.hairColor;
  if (t.hairStyle === 'long') {
    return <path d="M33 56C30 30 44 19 60 19S90 30 87 56L90 97C82 101 76 99 73 94V62H47V94C44 99 38 101 30 97Z" fill={fill} {...line} />;
  }
  if (t.hairStyle === 'bun') return <circle cx="60" cy="17" r="9" fill={fill} {...line} />;
  if (t.hairStyle === 'hijab') {
    return <path d="M60 17C37 17 27 36 29 60C30 80 40 92 26 108H94C80 92 90 80 91 60C93 36 83 17 60 17Z" fill={fill} {...line} />;
  }
  return null;
}

function FrontHair({ t }: { t: AvatarTraits }) {
  const fill = t.hairColor;
  switch (t.hairStyle) {
    case 'quiff':
      return (
        <>
          <path d="M34 55C29 35 39 19 57 18C65 9 85 10 87 23C93 31 89 45 84 51C81 42 76 37 70 35C60 39 47 39 41 45C38 48 36 52 34 55Z" fill={fill} {...line} />
          <path d="M47 23 41 19M47 23 41 26" fill="none" {...line} strokeWidth={2.5} />
        </>
      );
    case 'side':
      return <path d="M35 53C32 32 45 21 60 21S88 32 85 53C82 44 78 38 72 36C62 40 48 38 42 33C40 40 38 46 35 53Z" fill={fill} {...line} />;
    case 'curly':
      return (
        <g fill={fill} {...line}>
          <circle cx="39" cy="44" r="8" />
          <circle cx="81" cy="44" r="8" />
          <circle cx="45" cy="32" r="9" />
          <circle cx="75" cy="32" r="9" />
          <circle cx="60" cy="27" r="10" />
        </g>
      );
    case 'long':
    case 'bun':
      return <path d="M36 51C36 32 46 24 60 24S84 32 84 51C77 45 67 39 59 34C53 42 45 47 36 51Z" fill={fill} {...line} />;
    case 'buzz':
      return <path d="M36 50C36 32 46 25 60 25S84 32 84 50C78 42 70 38 60 38S42 42 36 50Z" fill={fill} {...line} />;
    case 'hijab':
      return <path d="M37 52C38 34 48 27 60 27S82 34 83 52C78 42 70 37 60 37S42 42 37 52Z" fill={fill} {...line} />;
  }
}

function Eyes({ t }: { t: AvatarTraits }) {
  if (t.eyes === 'happy') {
    return <path d="M45 61Q50 55 55 61M65 61Q70 55 75 61" fill="none" {...line} />;
  }
  return (
    <>
      <ellipse cx="50" cy="60" rx="3.2" ry="4.2" fill={INK} />
      <ellipse cx="70" cy="60" rx="3.2" ry="4.2" fill={INK} />
      {t.eyes === 'lash' && <path d="M46 54l-1.5-2.5M49.5 53l-.5-3M53 54l1-2.5M67 54l-1-2.5M70.5 53l.5-3M74 54l1.5-2.5" fill="none" {...line} strokeWidth={2} />}
    </>
  );
}

function Brows({ t }: { t: AvatarTraits }) {
  const d = {
    flat: 'M45 50h10M65 50h10',
    raised: 'M45 50q5-4 10-1M65 49q5-3 10 1',
    worried: 'M45 49q5 1 10-2M65 47q5 3 10 2',
  }[t.brows];
  return <path d={d} fill="none" {...line} strokeWidth={2.5} />;
}

function Mouth({ t }: { t: AvatarTraits }) {
  switch (t.mouth) {
    case 'grit':
      return (
        <>
          <rect x="50" y="74" width="20" height="9" rx="4.5" fill="#fff" {...line} strokeWidth={2.5} />
          <path d="M51 78.5h18M55.5 74.5v8M60 74v9M64.5 74.5v8" fill="none" {...line} strokeWidth={1.6} />
        </>
      );
    case 'smile':
      return <path d="M52 76q8 7 16 0" fill="none" {...line} />;
    case 'grin':
      return (
        <>
          <path d="M50 74h20q0 11-10 11T50 74Z" fill="#7A2626" {...line} strokeWidth={2.5} />
          <path d="M51.5 75h17l-1 3h-15Z" fill="#fff" />
        </>
      );
    case 'o':
      return <ellipse cx="60" cy="78" rx="3.6" ry="4.6" fill="#7A2626" {...line} strokeWidth={2.5} />;
    case 'smirk':
      return <path d="M53 78q7 3 14-3" fill="none" {...line} />;
  }
}

/**
 * A cartoon bust drawn from `seed` (lib/cartoon-avatar.ts): the profile
 * picture every account has until it is turned into a cartoon of a photo.
 */
export function CartoonAvatar({ seed, className }: { seed: string; className?: string }) {
  const t = avatarTraits(seed);
  const hijab = t.hairStyle === 'hijab';
  return (
    <svg viewBox="0 0 120 120" className={cn('h-10 w-10', className)} aria-hidden>
      <rect width="120" height="120" fill={t.background} />
      {/* shirt and collar */}
      <path d="M12 122C14 105 29 96 47 94L60 102 73 94C91 96 106 105 108 122Z" fill={t.shirt} {...line} />
      {t.collar === 'collar' ? (
        <>
          <path d="M47 93 60 103 52 109 43 98Z" fill="#fff" {...line} strokeWidth={2.5} />
          <path d="M73 93 60 103 68 109 77 98Z" fill="#fff" {...line} strokeWidth={2.5} />
        </>
      ) : (
        <path d="M48 95Q60 105 72 95" fill="none" {...line} strokeWidth={2.5} />
      )}
      <BackHair t={t} />
      {!hijab && (
        <>
          <path d="M51 82V97Q60 102 69 97V82" fill={t.skin} {...line} />
          <ellipse cx="36" cy="61" rx="5" ry="7" fill={t.skin} {...line} />
          <ellipse cx="84" cy="61" rx="5" ry="7" fill={t.skin} {...line} />
        </>
      )}
      <path d={HEAD} fill={t.skin} {...line} />
      <FrontHair t={t} />
      <Brows t={t} />
      <Eyes t={t} />
      <path d="M60 63q-3 6 1.5 7" fill="none" {...line} strokeWidth={2.2} />
      <Mouth t={t} />
      {t.glasses && (
        <g fill="#fff" fillOpacity="0.25" {...line} strokeWidth={2.5}>
          <circle cx="50" cy="60" r="7.5" />
          <circle cx="70" cy="60" r="7.5" />
          <path d="M57.5 60h5" fill="none" />
        </g>
      )}
    </svg>
  );
}
