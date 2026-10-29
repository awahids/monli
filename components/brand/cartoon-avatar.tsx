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
  /** Tight curls close round the head, a few resting on the forehead. */
  curly: curls(
    [
      [188, 238], [168, 246], [146, 244], [128, 230], [118, 208], [114, 184], [118, 160], [124, 138], [138, 118], [156, 102],
      [178, 90], [204, 82], [230, 78], [256, 78], [282, 84], [304, 96], [322, 112], [334, 134], [340, 158], [338, 182], [330, 204],
    ],
    [[322, 206], [318, 186], [310, 170], [294, 162], [276, 162], [258, 166], [240, 166], [222, 170], [204, 170], [190, 176], [184, 196], [186, 220]]
  ),
  /** Short and neat, following the skull, with a fringe swept to the side. */
  short:
    'M188 238C184 226 182 218 176 216C166 212 152 216 142 224C130 204 126 178 130 156C136 126 160 104 196 96L206 90C234 82 276 84 302 98C322 110 332 132 330 158C328 178 326 192 322 206' +
    'C320 190 314 174 304 164C288 156 266 154 246 158C226 162 206 164 194 170C186 178 184 194 186 210C186 222 188 230 188 238Z',
  /** Long and straight, parted to one side, past the ears and onto the shoulders. */
  long:
    'M186 238C184 280 180 330 176 368C166 380 146 382 128 374C134 336 124 290 122 240C118 182 128 136 158 112C188 88 236 82 274 88C316 96 342 124 348 162C354 208 350 262 348 318C346 348 350 368 356 382C340 388 326 380 320 368C322 318 324 262 322 206' +
    'C316 184 306 166 292 156C276 170 252 176 228 172C208 170 192 174 186 188C182 206 186 222 186 238Z',
};
/**
 * A bald head: the skull, and skin over the hairline and temple that the
 * drawing without its hair keeps.
 */
const SKULL = 'M142 228C128 208 120 180 124 154C130 120 162 98 212 94C262 90 304 104 320 134C330 156 328 192 321 228';
const BALD = `${SKULL}L306 228L302 200L300 178L298 162L270 159L246 163L216 167L196 170L186 172L182 200L188 246L178 242L166 232L150 222Z`;
/** The light on a bald head. */
const SHINE = 'M156 136C166 120 184 110 206 108';

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
          d={`${CHIN[t.face]}C322 284 320 270 316 262C310 300 296 330 252 332C210 332 192 304 188 272C184 278 178 284 176 290Z`}
          fill={color}
          {...outlined}
        />
      )}
      {/* the moustache, with or without a beard */}
      <path d="M222 263C232 251 246 251 254 257C262 251 278 251 288 263C276 265 264 263 254 261C244 263 232 265 222 263Z" fill={color} {...outlined} strokeWidth={6} />
    </>
  );
}

function Hair({ t }: { t: AvatarTraits }) {
  if (t.hairStyle === 'bald') {
    return (
      <>
        <path d={BALD} fill={t.skin} />
        <path d={SKULL} fill="none" {...line} />
        <path d={SHINE} fill="none" {...line} stroke="#fff" strokeOpacity="0.6" strokeWidth={8} />
      </>
    );
  }
  if (t.hairStyle === 'quiff' || t.hairStyle === 'hijab') return null;
  return <path d={HAIR[t.hairStyle]} fill={t.hairColor} {...line} />;
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
