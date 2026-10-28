import { avatarTraits, type AvatarTraits } from '@/lib/cartoon-avatar';
import { cn } from '@/lib/utils';

const INK = '#161616';
const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** The head in side profile, facing right: forehead, nose, lips and chin on the right. */
const HEAD =
  'M42 52C40 34 52 24 66 24C80 24 87 34 86 47L87 54L94 63Q96 66 92 67H87.5L88 71L85.5 73.5L87.5 77Q87 84 80 86C74 88 66 88 60 87C50 85 42 78 41 66Z';

function BackHair({ t }: { t: AvatarTraits }) {
  const fill = t.hairColor;
  if (t.hairStyle === 'long') return <path d="M46 32C33 42 32 70 34 98C42 102 50 101 56 96V64C51 56 49 45 52 36Z" fill={fill} {...line} />;
  if (t.hairStyle === 'bun') return <circle cx="41" cy="31" r="9" fill={fill} {...line} />;
  if (t.hairStyle === 'hijab') {
    return <path d="M66 17C45 17 33 32 33 56C33 76 39 92 26 108H98C88 99 84 93 83 88C89 84 91 76 90 60C89 34 83 17 66 17Z" fill={fill} {...line} />;
  }
  return null;
}

function FrontHair({ t }: { t: AvatarTraits }) {
  const fill = t.hairColor;
  switch (t.hairStyle) {
    case 'quiff':
      return (
        <>
          <path d="M41 57C36 38 44 22 62 20C70 11 91 13 91 26C93 34 89 40 86 44C80 38 74 36 68 37C64 41 60 44 58 50C55 46 51 45 47 47C45 50 43 53 41 57Z" fill={fill} {...line} />
          <path d="M52 24 46 20M52 24 46 27" fill="none" {...line} strokeWidth={2.5} />
        </>
      );
    case 'side':
      return <path d="M41 57C37 36 49 22 66 22C80 22 89 31 87 44C80 38 72 36 64 36C60 40 58 46 57 52C52 50 46 52 41 57Z" fill={fill} {...line} />;
    case 'curly':
      return (
        <g fill={fill} {...line}>
          <circle cx="43" cy="56" r="7" />
          <circle cx="45" cy="43" r="9" />
          <circle cx="51" cy="31" r="9" />
          <circle cx="63" cy="26" r="10" />
          <circle cx="76" cy="27" r="9" />
          <circle cx="84" cy="36" r="7" />
        </g>
      );
    case 'long':
    case 'bun':
      return <path d="M42 55C40 34 52 23 66 23C80 23 88 32 87 45C78 40 68 38 60 38C56 44 52 49 46 51C44 52 43 53 42 55Z" fill={fill} {...line} />;
    case 'buzz':
      return <path d="M42 52C41 34 52 25 66 25C79 25 86 33 86 44C78 40 70 38 62 38C58 42 56 46 55 50C50 49 45 50 42 52Z" fill={fill} {...line} />;
    case 'hijab':
      return <path d="M86 45C86 33 78 25 66 25C52 25 43 35 42 52C42 66 46 80 53 90H65C59 82 57 74 59 66C61 56 69 48 86 45Z" fill={fill} {...line} />;
  }
}

function Ear({ t }: { t: AvatarTraits }) {
  if (t.hairStyle === 'hijab' || t.hairStyle === 'long') return null;
  return (
    <>
      <ellipse cx="56" cy="61" rx="5" ry="7" fill={t.skin} {...line} />
      <path d="M55 58q3 3 0 6" fill="none" {...line} strokeWidth={2} />
    </>
  );
}

function Eye({ t }: { t: AvatarTraits }) {
  if (t.eyes === 'happy') return <path d="M72 57q4-5 8 0" fill="none" {...line} />;
  return (
    <>
      <ellipse cx="77" cy="56" rx="2.8" ry="3.8" fill={INK} />
      {t.eyes === 'lash' && <path d="M79 52.5l2-2M80.5 54l2.5-1" fill="none" {...line} strokeWidth={2} />}
    </>
  );
}

function Brow({ t }: { t: AvatarTraits }) {
  const d = { flat: 'M72 48.5h9', raised: 'M72 49q4-4 9-1', worried: 'M72 47q4 2 9 0' }[t.brows];
  return <path d={d} fill="none" {...line} strokeWidth={2.5} />;
}

function Mouth({ t }: { t: AvatarTraits }) {
  switch (t.mouth) {
    case 'grit':
      return (
        <>
          <path d="M78 71.5h9.5v6H79q-2-3-1-6Z" fill="#fff" {...line} strokeWidth={2.2} />
          <path d="M79 74.5h8.5M82.5 72v5" fill="none" {...line} strokeWidth={1.4} />
        </>
      );
    case 'smile':
      return <path d="M80 75q4 2 7.5-1" fill="none" {...line} strokeWidth={2.5} />;
    case 'grin':
      return (
        <>
          <path d="M79 72 88 71Q88.5 79 80.5 78Z" fill="#7A2626" {...line} strokeWidth={2.2} />
          <path d="M80.3 72.6 87.3 71.8 87.3 73.6 80.8 74.3Z" fill="#fff" />
        </>
      );
    case 'o':
      return <ellipse cx="86" cy="74" rx="2.5" ry="3" fill="#7A2626" {...line} strokeWidth={2} />;
    case 'smirk':
      return <path d="M80 76q4 0 7.5-3" fill="none" {...line} strokeWidth={2.5} />;
  }
}

/**
 * A cartoon bust in side profile drawn from `seed` (lib/cartoon-avatar.ts):
 * the profile picture every account has until it is turned into a cartoon
 * of a photo.
 */
export function CartoonAvatar({ seed, className }: { seed: string; className?: string }) {
  const t = avatarTraits(seed);
  const hijab = t.hairStyle === 'hijab';
  return (
    <svg viewBox="0 0 120 120" className={cn('h-10 w-10', className)} aria-hidden>
      <rect width="120" height="120" fill={t.background} />
      {/* shoulders, turned a little towards the viewer, and the collar at the front */}
      <path d="M16 122C18 104 32 95 50 93L68 97C88 98 103 106 105 122Z" fill={t.shirt} {...line} />
      {t.collar === 'collar' ? (
        <path d="M66 94 74 104 63 107 57 96Z" fill="#fff" {...line} strokeWidth={2.5} />
      ) : (
        <path d="M54 95Q64 103 75 97" fill="none" {...line} strokeWidth={2.5} />
      )}
      <BackHair t={t} />
      {!hijab && <path d="M54 82V98Q62 101 70 98V84" fill={t.skin} {...line} />}
      <path d={HEAD} fill={t.skin} {...line} />
      <Ear t={t} />
      <FrontHair t={t} />
      <Brow t={t} />
      <Eye t={t} />
      <Mouth t={t} />
      {t.glasses && (
        <g fill="none" {...line} strokeWidth={2.5}>
          <ellipse cx="78" cy="57" rx="6" ry="5.5" fill="#fff" fillOpacity="0.25" />
          <path d="M72 56.5 58 58" />
        </g>
      )}
    </svg>
  );
}
