import { avatarTraits, type AvatarTraits } from '@/lib/cartoon-avatar';
import { cn } from '@/lib/utils';
import { ART } from './cartoon-avatar-art';

const INK = '#161616';
/** The reference drawing's own line weight, in its 460px space. */
const line = { stroke: INK, strokeWidth: 9, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
/** A repainted layer keeps a black edge: the stroke sits under the fill, so only its outer half shows. */
const outlined = { ...line, strokeWidth: 10, paintOrder: 'stroke' } as const;

/** Covers the reference's gritted teeth when another mouth is drawn. */
const MOUTH_PATCH = 'M206 262H298V312H206Z';

function Mouth({ t }: { t: AvatarTraits }) {
  if (t.mouth === 'grit') return null;
  return (
    <>
      <path d={MOUTH_PATCH} fill={t.skin} />
      {t.mouth === 'smile' && <path d="M218 280Q252 312 290 276" fill="none" {...line} />}
      {t.mouth === 'grin' && (
        <>
          <path d="M214 272Q252 268 292 270Q290 312 252 312Q216 312 214 272Z" fill="#7A2626" {...line} />
          <path d="M219 276Q252 273 287 275L285 285Q252 283 221 286Z" fill="#fff" />
        </>
      )}
      {t.mouth === 'o' && <ellipse cx="252" cy="288" rx="15" ry="19" fill="#7A2626" {...line} />}
      {t.mouth === 'smirk' && <path d="M222 292Q258 300 290 274" fill="none" {...line} />}
    </>
  );
}

/** A hijab over the hair, ear and neck, open around the face. */
const HIJAB =
  'M225 52C140 52 100 120 104 210C108 290 126 345 160 384L312 384C350 340 362 290 356 205C352 110 315 52 225 52Z' +
  'M182 166C214 150 282 146 306 158C320 200 324 260 318 292C306 332 272 344 242 344C206 344 186 322 179 292C173 252 175 202 182 166Z';

/**
 * The profile picture every account has until it is turned into a cartoon of
 * a photo: the reference drawing (lib/avatar/style-reference.png, traced by
 * scripts/trace-avatar.py) in colours and details picked from `seed`.
 */
export function CartoonAvatar({ seed, className }: { seed: string; className?: string }) {
  const t = avatarTraits(seed);
  return (
    <svg viewBox="0 0 460 460" className={cn('h-10 w-10', className)} aria-hidden>
      <rect width="460" height="460" fill={t.background} />
      <path d={ART.figure} fill="#fff" fillRule="evenodd" />
      <path d={ART.skin} fill={t.skin} fillRule="evenodd" />
      <path d={ART.ink} fill={INK} fillRule="evenodd" />
      {t.hairColor !== INK && t.hairStyle !== 'hijab' && <path d={ART.hair} fill={t.hairColor} fillRule="evenodd" {...outlined} />}
      {t.shirt !== INK && <path d={ART.shirt} fill={t.shirt} fillRule="evenodd" {...outlined} />}
      <Mouth t={t} />
      {t.glasses && (
        <g fill="#fff" fillOpacity="0.2" {...line}>
          <circle cx="212" cy="214" r="30" />
          <circle cx="281" cy="206" r="28" />
          <path d="M242 211Q247 207 253 208M182 216 162 228" fill="none" />
        </g>
      )}
      {t.hairStyle === 'hijab' && <path d={HIJAB} fill={t.hairColor} fillRule="evenodd" {...line} />}
    </svg>
  );
}
