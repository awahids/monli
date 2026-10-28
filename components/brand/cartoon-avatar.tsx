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

/**
 * A hijab, drawn over the drawing without its hair: snug around the face
 * (forehead just above the lashes, cheeks, under the chin), round over the
 * head, and falling wide over the shoulders and chest.
 */
const HIJAB_OUTER =
  'M246 80C178 80 136 128 136 200C136 262 142 306 152 334C134 368 108 410 88 460H384C366 412 344 370 330 334C344 294 350 250 348 200C346 126 312 80 246 80Z';
/** The face opening, laid just over the drawing's own face outline. */
const HIJAB_FACE =
  'M185 172C212 158 270 150 307 158C318 192 322 240 318 280C312 318 282 342 246 344C214 346 193 326 187 296C182 258 181 212 185 172Z';
/** The underscarf (ciput) showing as a band across the forehead. */
const HIJAB_BAND = 'M185 172C212 158 270 150 307 158L305 143C268 134 208 142 179 158Z';

function Hijab({ color }: { color: string }) {
  return (
    <>
      <path d={HIJAB_OUTER + HIJAB_FACE} fill={color} fillRule="evenodd" {...line} />
      <path d={HIJAB_BAND} fill="#000" fillOpacity="0.22" />
      <path d={HIJAB_BAND} fill="none" {...line} strokeWidth={6} />
      {/* folds where the cloth wraps under the chin and falls onto the chest */}
      <path d="M196 356Q246 380 300 350M162 360Q152 410 130 456M316 358Q328 410 350 456" fill="none" {...line} strokeWidth={6} />
    </>
  );
}

/**
 * The profile picture every account has until it is turned into a cartoon of
 * a photo: the reference drawing (lib/avatar/style-reference.png, traced by
 * scripts/trace-avatar.py) in colours and details picked from `seed`.
 */
export function CartoonAvatar({ seed, className }: { seed: string; className?: string }) {
  const t = avatarTraits(seed);
  const hijab = t.hairStyle === 'hijab';
  return (
    <svg viewBox="0 0 460 460" className={cn('h-10 w-10', className)} aria-hidden>
      <rect width="460" height="460" fill={t.background} />
      <path d={hijab ? ART.figureBare : ART.figure} fill="#fff" fillRule="evenodd" />
      <path d={ART.skin} fill={t.skin} fillRule="evenodd" />
      <path d={hijab ? ART.inkBare : ART.ink} fill={INK} fillRule="evenodd" />
      {t.hairColor !== INK && !hijab && <path d={ART.hair} fill={t.hairColor} fillRule="evenodd" {...outlined} />}
      {t.shirt !== INK && <path d={ART.shirt} fill={t.shirt} fillRule="evenodd" {...outlined} />}
      <Mouth t={t} />
      {t.glasses && (
        <g fill="#fff" fillOpacity="0.2" {...line}>
          <circle cx="212" cy="214" r="30" />
          <circle cx="281" cy="206" r="28" />
          <path d="M242 211Q247 207 253 208M182 216 162 228" fill="none" />
        </g>
      )}
      {hijab && <Hijab color={t.hairColor} />}
    </svg>
  );
}
