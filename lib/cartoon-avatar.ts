/**
 * The drawn profile picture every account gets: the reference drawing
 * (components/brand/cartoon-avatar.tsx) in colours and details picked from a
 * seed, the account id until the person picks "Acak lagi", so the same
 * account always gets the same face without storing a picture.
 */

export const SKIN_TONES = ['#F8D5C2', '#F3C4A2', '#E2AE88', '#C98D64', '#A06A45', '#7B4F34'] as const;
export const HAIR_COLORS = ['#161616', '#161616', '#3A2418', '#5B3A22', '#8A5A2B', '#A8432A'] as const;
export const HIJAB_COLORS = ['#0E8079', '#2F3E66', '#B5537A', '#6B4FBF', '#C9863A', '#556B4E'] as const;
export const SHIRT_COLORS = ['#161616', '#161616', '#0E8079', '#F9A720', '#3B6FD8', '#D9436A', '#6B4FBF', '#2E9E6A'] as const;
export const BACKGROUNDS = ['#FDF0DC', '#DDF2EF', '#ECE6FB', '#FCE4EC', '#E2ECFB', '#E7F5E1'] as const;

/** Hair styles: the reference's quiff, or a hijab (one in four). */
export const HAIR_STYLES = ['quiff', 'quiff', 'quiff', 'hijab'] as const;
export const MOUTHS = ['grit', 'smile', 'grin', 'o', 'smirk'] as const;

export type AvatarTraits = {
  skin: string;
  hairStyle: (typeof HAIR_STYLES)[number];
  /** Hair colour, or the hijab's colour with the hijab style. */
  hairColor: string;
  mouth: (typeof MOUTHS)[number];
  glasses: boolean;
  shirt: string;
  background: string;
};

/**
 * FNV-1a, salted per trait so the traits do not move together. FNV's low bits
 * depend only on the input's low bits, whatever the salt, so they are mixed
 * (murmur3's finaliser) before the `%` that picks a trait.
 */
function hash(seed: string, salt: string): number {
  let h = 0x811c9dc5;
  for (const ch of `${salt}:${seed}`) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function pick<T>(list: readonly T[], seed: string, salt: string): T {
  return list[hash(seed, salt) % list.length];
}

export function avatarTraits(seed: string): AvatarTraits {
  const hairStyle = pick(HAIR_STYLES, seed, 'hair');
  return {
    skin: pick(SKIN_TONES, seed, 'skin'),
    hairStyle,
    hairColor: pick(hairStyle === 'hijab' ? HIJAB_COLORS : HAIR_COLORS, seed, 'hair-color'),
    mouth: pick(MOUTHS, seed, 'mouth'),
    glasses: hash(seed, 'glasses') % 4 === 0,
    shirt: pick(SHIRT_COLORS, seed, 'shirt'),
    background: pick(BACKGROUNDS, seed, 'background'),
  };
}

/** A fresh seed for "Acak lagi": short, so it fits the profile column comfortably. */
export function newAvatarSeed(): string {
  return crypto.randomUUID().slice(0, 8);
}

export const AVATAR_SEED_PATTERN = /^[0-9a-f]{8}$/;

/** What can be read from a photo: everything a drawn avatar shows but its background. */
export type PhotoTraits = Omit<AvatarTraits, 'background'>;

/**
 * The words the AI picks from when it reads a photo (app/api/profile/avatar),
 * each standing for one of the drawing's colours or details.
 */
export const PHOTO_CHOICES = {
  skin: {
    'very light': SKIN_TONES[0],
    light: SKIN_TONES[1],
    'light tan': SKIN_TONES[2],
    tan: SKIN_TONES[3],
    brown: SKIN_TONES[4],
    'dark brown': SKIN_TONES[5],
  },
  hair: { black: HAIR_COLORS[0], 'dark brown': HAIR_COLORS[2], brown: HAIR_COLORS[3], 'light brown': HAIR_COLORS[4], red: HAIR_COLORS[5] },
  hijab: {
    teal: HIJAB_COLORS[0],
    navy: HIJAB_COLORS[1],
    pink: HIJAB_COLORS[2],
    purple: HIJAB_COLORS[3],
    mustard: HIJAB_COLORS[4],
    olive: HIJAB_COLORS[5],
  },
  top: {
    black: SHIRT_COLORS[0],
    teal: SHIRT_COLORS[2],
    yellow: SHIRT_COLORS[3],
    blue: SHIRT_COLORS[4],
    pink: SHIRT_COLORS[5],
    purple: SHIRT_COLORS[6],
    green: SHIRT_COLORS[7],
  },
  expression: { grit: 'grit', smile: 'smile', grin: 'grin', o: 'o', smirk: 'smirk' },
} as const;

const choices = (list: object) => Object.keys(list).map((k) => `"${k}"`).join(', ');

/** Asks a vision model which of the drawing's details fit the person in the photo. */
export const PHOTO_TRAITS_PROMPT = `The photo is turned into a simple cartoon avatar drawn from a fixed set of colours and details. Pick the ones closest to the person in the photo and reply with JSON only:
{"face": true, "skin": ..., "hijab": ..., "hair": ..., "glasses": ..., "top": ..., "expression": ...}
- face: false when there is no single clearly visible human face (then leave out the rest).
- skin: one of ${choices(PHOTO_CHOICES.skin)}.
- hijab: the colour of their hijab or other head covering, one of ${choices(PHOTO_CHOICES.hijab)}, or null when their hair shows.
- hair: their hair colour, one of ${choices(PHOTO_CHOICES.hair)} (grey, white or blond: "light brown"; bald or shaved: "black").
- glasses: true or false.
- top: the colour of their clothes, one of ${choices(PHOTO_CHOICES.top)} (white, grey or dark clothes: "black").
- expression: "smile" (closed-mouth smile or neutral), "grin" (open-mouth laugh), "grit" (wide smile showing clenched teeth), "smirk" (lopsided smile) or "o" (surprised, open mouth).`;

/**
 * The traits in the AI's reply, null when it saw no face, undefined when the
 * reply is not the JSON asked for. A detail it got wrong falls back to the
 * most common one rather than failing the whole photo.
 */
export function parsePhotoTraits(reply: string): PhotoTraits | null | undefined {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(reply.match(/\{[\s\S]*\}/)?.[0] ?? '');
  } catch {
    return undefined;
  }
  if (!data || typeof data !== 'object') return undefined;
  if (data.face === false) return null;
  const read = <T extends Record<string, string>>(list: T, key: unknown, fallback: keyof T): T[keyof T] =>
    list[(typeof key === 'string' && key in list ? key : fallback) as keyof T];
  const hijab = typeof data.hijab === 'string' && data.hijab in PHOTO_CHOICES.hijab;
  return {
    skin: read(PHOTO_CHOICES.skin, data.skin, 'light tan'),
    hairStyle: hijab ? 'hijab' : 'quiff',
    hairColor: hijab ? read(PHOTO_CHOICES.hijab, data.hijab, 'teal') : read(PHOTO_CHOICES.hair, data.hair, 'black'),
    mouth: read(PHOTO_CHOICES.expression, data.expression, 'smile'),
    glasses: data.glasses === true,
    shirt: read(PHOTO_CHOICES.top, data.top, 'black'),
  };
}

/**
 * A seed whose drawing has `wanted`, so an avatar read from a photo is kept
 * like any other drawn avatar: as its seed. Seeds are tried in turn from a
 * random one; the rarest look turns up about once in 25,000 seeds.
 */
export function seedForTraits(wanted: PhotoTraits): string {
  const start = Math.floor(Math.random() * 0x100000000);
  for (let i = 0; i < 5_000_000; i++) {
    const seed = ((start + i) >>> 0).toString(16).padStart(8, '0');
    const t = avatarTraits(seed);
    if (
      t.skin === wanted.skin &&
      t.hairStyle === wanted.hairStyle &&
      t.hairColor === wanted.hairColor &&
      t.mouth === wanted.mouth &&
      t.glasses === wanted.glasses &&
      t.shirt === wanted.shirt
    ) {
      return seed;
    }
  }
  throw new Error('No seed draws these traits');
}
