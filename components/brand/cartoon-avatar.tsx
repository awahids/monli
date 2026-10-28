import { avatarTraits, type AvatarTraits } from '@/lib/cartoon-avatar';
import { cn } from '@/lib/utils';

const INK = '#161616';
const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/**
 * The head turned a little to the right (three-quarter view), as in the
 * reference drawing lib/avatar/style-reference.png: the ear on the left, the
 * jaw running down to the chin on the right.
 */
const HEAD = 'M45 50C45 38 54 30 66 30C78 30 86 37 86 48V70C86 82 79 90 69 91C60 92 52 87 48 80C45 74 44 66 44 58Z';

function BackHair({ t }: { t: AvatarTraits }) {
  const fill = t.hairColor;
  if (t.hairStyle === 'long') {
    return <path d="M66 25C47 25 37 40 37 60L35 100C43 104 51 102 53 98V72H85L87 96C91 98 95 96 95 92L91 52C91 36 81 25 66 25Z" fill={fill} {...line} />;
  }
  if (t.hairStyle === 'bun') return <circle cx="52" cy="22" r="9" fill={fill} {...line} />;
  if (t.hairStyle === 'hijab') {
    return <path d="M65 21C44 21 33 38 33 60C33 80 40 94 26 108H100C90 96 93 82 93 62C93 38 84 21 65 21Z" fill={fill} {...line} />;
  }
  return null;
}

function FrontHair({ t }: { t: AvatarTraits }) {
  const fill = t.hairColor;
  switch (t.hairStyle) {
    case 'quiff':
      return (
        <>
          <path d="M43 63C37 53 36 43 40 37C46 28 58 22 70 17C78 13 88 12 90 20C92 28 89 38 86 47C84 41 82 37 78 36C70 37 60 40 54 44C50 47 47 53 43 63Z" fill={fill} {...line} />
          <path d="M41 36 34 33M41 36 35 40" fill="none" {...line} strokeWidth={2.5} />
        </>
      );
    case 'side':
      return <path d="M44 60C39 40 50 27 66 27C80 27 89 35 87 50C82 42 76 38 70 37C62 41 52 40 48 36C47 44 46 52 44 60Z" fill={fill} {...line} />;
    case 'curly':
      return (
        <g fill={fill} {...line}>
          <circle cx="44" cy="52" r="7" />
          <circle cx="86" cy="41" r="7" />
          <circle cx="46" cy="40" r="8" />
          <circle cx="79" cy="30" r="8" />
          <circle cx="55" cy="30" r="9" />
          <circle cx="67" cy="26" r="9" />
        </g>
      );
    case 'long':
    case 'bun':
      return <path d="M44 56C42 36 54 28 66 28C80 28 88 37 87 50C78 44 68 40 60 36C56 44 50 50 44 56Z" fill={fill} {...line} />;
    case 'buzz':
      return <path d="M44 52C44 36 54 29 66 29C79 29 86 37 86 48C80 42 72 39 64 39C56 39 49 44 44 52Z" fill={fill} {...line} />;
    case 'hijab':
      return <path d="M45 64C43 41 52 31 66 31C79 31 87 38 87 50C81 44 73 41 65 41C57 41 50 46 48 56Z" fill={fill} {...line} />;
  }
}

/** Eye centres: the far eye (right) sits a little higher and closer to the edge. */
const EYES = [
  [57, 57],
  [74, 55],
] as const;

function Eyes({ t }: { t: AvatarTraits }) {
  if (t.eyes === 'happy') {
    return <path d={EYES.map(([x, y]) => `M${x - 4} ${y + 1}q4-5 8 0`).join('')} fill="none" {...line} />;
  }
  return (
    <>
      {EYES.map(([x, y]) => (
        <ellipse key={x} cx={x} cy={y} rx="3.5" ry="4.8" fill={INK} />
      ))}
      {t.eyes === 'lash' && (
        <path
          d={EYES.map(([x, y]) => `M${x - 4} ${y - 6}q1-3 3-1M${x - 1} ${y - 7}q1-3 3-1M${x + 2} ${y - 6}q1-3 3-1`).join('')}
          fill="none"
          {...line}
          strokeWidth={1.8}
        />
      )}
    </>
  );
}

function Brows({ t }: { t: AvatarTraits }) {
  // The lashes in the reference take the brows' place.
  if (t.eyes === 'lash') return null;
  const d = {
    flat: 'M53 48h8M70 46h8',
    raised: 'M53 49q4-4 8-1M70 47q4-4 8-1',
    worried: 'M53 47q4 2 8 0M70 46q4 2 8-1',
  }[t.brows];
  return <path d={d} fill="none" {...line} strokeWidth={2.5} />;
}

function Mouth({ t }: { t: AvatarTraits }) {
  switch (t.mouth) {
    case 'grit':
      return (
        <g transform="rotate(-4 66 76)">
          <rect x="54" y="70.5" width="24" height="11" rx="5.5" fill="#fff" {...line} strokeWidth={2.5} />
          <path d="M55 76h22M60 71v10M66 70.5v11M72 71v10" fill="none" {...line} strokeWidth={1.6} />
        </g>
      );
    case 'smile':
      return <path d="M58 76q8 6 16-1" fill="none" {...line} />;
    case 'grin':
      return (
        <>
          <path d="M56 72h20q0 11-10 11T56 72Z" fill="#7A2626" {...line} strokeWidth={2.5} />
          <path d="M57.5 73h17l-1 3h-15Z" fill="#fff" />
        </>
      );
    case 'o':
      return <ellipse cx="66" cy="77" rx="3.5" ry="4.5" fill="#7A2626" {...line} strokeWidth={2.5} />;
    case 'smirk':
      return <path d="M59 77q8 3 15-3" fill="none" {...line} />;
  }
}

/**
 * A cartoon bust drawn from `seed` (lib/cartoon-avatar.ts), posed like the
 * reference drawing: the profile picture every account has until it is
 * turned into a cartoon of a photo.
 */
export function CartoonAvatar({ seed, className }: { seed: string; className?: string }) {
  const t = avatarTraits(seed);
  const hijab = t.hairStyle === 'hijab';
  return (
    <svg viewBox="0 0 120 120" className={cn('h-10 w-10', className)} aria-hidden>
      <rect width="120" height="120" fill={t.background} />
      {/* shirt and collar */}
      <path d="M14 122C16 106 30 97 47 95L64 104 81 95C97 97 106 106 108 122Z" fill={t.shirt} {...line} />
      {t.collar === 'collar' ? (
        <>
          <path d="M47 94 63 104 53 110 41 99Z" fill="#fff" {...line} strokeWidth={2.5} />
          <path d="M81 94 65 104 75 109 86 98Z" fill="#fff" {...line} strokeWidth={2.5} />
        </>
      ) : (
        <path d="M50 96Q64 106 78 96" fill="none" {...line} strokeWidth={2.5} />
      )}
      <BackHair t={t} />
      {!hijab && (
        <>
          <path d="M51 82 53 99Q64 104 76 99V86" fill={t.skin} {...line} />
          <ellipse cx="42" cy="62" rx="5" ry="7" fill={t.skin} {...line} />
          <path d="M41 59q3 3 0 6" fill="none" {...line} strokeWidth={2} />
        </>
      )}
      <path d={HEAD} fill={t.skin} {...line} />
      <FrontHair t={t} />
      <Brows t={t} />
      <Eyes t={t} />
      <path d="M68 59q2.5 6 .5 8q-2 1-4.5 0" fill="none" {...line} strokeWidth={2.2} />
      <Mouth t={t} />
      {t.glasses && (
        <g fill="#fff" fillOpacity="0.25" {...line} strokeWidth={2.5}>
          <circle cx="57" cy="57" r="7.5" />
          <circle cx="74" cy="55" r="7" />
          <path d="M64.5 56.5h2M49.5 58 45 59.5" fill="none" />
        </g>
      )}
    </svg>
  );
}
