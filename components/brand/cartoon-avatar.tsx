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
 * Curls: a bump of half a circle between each pair of points, outwards along
 * the outer edge and upwards along the hairline, so they never hang over the
 * eyes.
 */
function curls(outer: [number, number][], hairline: [number, number][]) {
  const all = [...outer, ...hairline, outer[0]];
  let d = `M${all[0][0]} ${all[0][1]}`;
  for (let i = 1; i < all.length; i++) {
    const [x0, y0] = all[i - 1];
    const [x, y] = all[i];
    const r = Math.round(Math.hypot(x - x0, y - y0) / 2);
    d += `A${r} ${r} 0 0 ${i < outer.length ? 1 : 0} ${x} ${y}`;
  }
  return d + 'Z';
}

const HAIR = {
  /** Curls all round, standing out from the head and over the forehead. */
  curly: curls(
    [
      [186, 236], [160, 244], [134, 236], [114, 210], [104, 178], [108, 146], [120, 116], [142, 90], [170, 72], [202, 60],
      [236, 56], [270, 60], [302, 72], [328, 94], [346, 124], [354, 158], [350, 192], [338, 222],
    ],
    [[322, 206], [320, 190], [314, 176], [302, 166], [288, 162], [274, 162], [260, 164], [246, 166], [232, 170], [218, 172], [204, 174], [192, 180], [186, 196], [184, 214]]
  ),
  /** Close cut, following the skull. */
  short:
    'M186 238C182 228 178 222 172 220C160 214 148 220 140 226C126 196 122 162 130 136C144 100 190 80 244 80C296 80 326 106 332 146C334 170 330 190 322 206' +
    'C320 184 314 162 300 152C276 146 236 152 206 160C190 166 182 176 182 196C182 214 186 226 186 238Z',
  /** Long hair: parted on top, falling past the ears onto the shoulders on both sides. */
  long:
    'M186 238C184 280 176 330 172 372C160 384 140 386 124 378C130 340 120 290 118 240C114 180 124 130 152 102C182 74 232 66 272 72C316 80 344 110 352 152C358 200 352 260 350 320C348 350 352 372 360 388C342 392 326 384 320 370C322 320 324 260 322 206' +
    'C316 180 306 160 290 150C276 168 250 176 226 170C206 168 190 172 184 186C182 204 186 220 186 238Z',
};
/** The lines inside the hair that show its texture. */
const HAIR_LINES = {
  curly: 'M150 120Q160 108 172 114M138 168Q150 160 158 172M204 92Q218 84 228 96M262 88Q276 82 286 94M314 120Q326 116 332 128M326 166Q336 164 338 176M128 214Q138 206 148 214',
  short: 'M160 124Q190 106 222 104M250 102Q284 104 308 122M142 184Q148 160 158 146',
  long: 'M290 150Q300 124 280 96M336 200Q340 280 338 350M150 140Q136 220 144 360',
};

/**
 * A bald head: the skull, and skin over the hairline and temple that the
 * drawing without its hair keeps.
 */
const SKULL = 'M140 226C124 196 122 160 134 130C152 94 196 78 246 80C292 82 322 104 328 140C332 166 326 200 321 228';
const BALD = `${SKULL}L306 228L302 200L300 178L298 162L270 159L246 163L216 167L196 170L186 172L182 200L186 238L178 236L160 232L144 234Z`;
/** The top of the ear, which the hair covered in the reference. */
const EAR_TOP = 'M142 236C144 226 156 222 168 226C172 228 176 232 178 236';

/** The reference's own jaw, below the ear (left) and the cheekbone (right). */
const JAW_INSIDE = 'M188 252L308 250L314 286L302 314L284 328L250 336L216 330L198 316L188 290Z';
const JAWS = {
  round: 'M171 276C172 306 190 336 236 346C278 352 316 336 330 300C338 276 336 240 322 206',
  square: 'M171 276C172 296 176 316 188 330C204 344 236 350 270 346C300 342 322 330 330 306C336 280 334 240 322 206',
};
/** The bottom of each jaw, for a beard to follow. */
const CHIN = {
  oval: 'M176 290C182 312 204 340 246 342C280 342 304 322 316 296',
  round: 'M174 290C180 318 200 338 236 346C278 352 312 336 326 300',
  square: 'M174 290C176 312 184 324 192 332C208 344 238 350 270 346C300 342 320 330 328 302',
};

function Jaw({ t }: { t: AvatarTraits }) {
  if (t.face === 'oval') return null;
  const jaw = JAWS[t.face];
  return (
    <>
      <path d={`${jaw}L308 250L188 252Z${JAW_INSIDE}`} fill={t.skin} fillRule="evenodd" />
      <path d={jaw} fill="none" {...line} />
    </>
  );
}

function FacialHair({ t }: { t: AvatarTraits }) {
  if (t.facialHair === 'none') return null;
  const color = t.hairStyle === 'bald' || t.hairStyle === 'hijab' ? INK : t.hairColor;
  return (
    <>
      {t.facialHair === 'beard' && (
        <path
          d={`${CHIN[t.face]}C322 280 318 266 314 256C306 290 292 318 252 322C214 322 196 300 190 270C184 276 178 282 176 290Z`}
          fill={color}
          {...outlined}
        />
      )}
      {/* the moustache, with or without a beard */}
      <path d="M212 268C224 252 244 254 252 262C262 252 284 252 294 266C282 274 262 270 252 268C240 272 222 276 212 268Z" fill={color} {...outlined} strokeWidth={6} />
    </>
  );
}

function Hair({ t }: { t: AvatarTraits }) {
  if (t.hairStyle === 'bald') {
    return (
      <>
        <path d={BALD} fill={t.skin} />
        <path d={SKULL + EAR_TOP} fill="none" {...line} />
      </>
    );
  }
  if (t.hairStyle === 'quiff' || t.hairStyle === 'hijab') return null;
  return (
    <>
      <path d={HAIR[t.hairStyle]} fill={t.hairColor} {...line} />
      <path d={HAIR_LINES[t.hairStyle]} fill="none" {...line} strokeWidth={5} stroke={t.hairColor === INK ? '#4a4a4a' : INK} />
    </>
  );
}

/**
 * The profile picture every account has: the reference drawing (lib/avatar/style-reference.png, traced by
 * scripts/trace-avatar.py) in colours and details picked from `seed`.
 */
export function CartoonAvatar({ seed, className }: { seed: string; className?: string }) {
  const t = avatarTraits(seed);
  const hijab = t.hairStyle === 'hijab';
  const quiff = t.hairStyle === 'quiff';
  return (
    <svg viewBox="0 0 460 460" className={cn('h-10 w-10', className)} aria-hidden>
      <rect width="460" height="460" fill={t.background} />
      <path d={quiff ? ART.figure : ART.figureBare} fill="#fff" fillRule="evenodd" />
      <path d={ART.skin} fill={t.skin} fillRule="evenodd" />
      <path d={quiff ? ART.ink : ART.inkBare} fill={INK} fillRule="evenodd" />
      {t.hairColor !== INK && quiff && <path d={ART.hair} fill={t.hairColor} fillRule="evenodd" {...outlined} />}
      {t.shirt !== INK && <path d={ART.shirt} fill={t.shirt} fillRule="evenodd" {...outlined} />}
      <Jaw t={t} />
      <Mouth t={t} />
      <FacialHair t={t} />
      <Hair t={t} />
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
