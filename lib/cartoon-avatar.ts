/**
 * The drawn profile picture every account gets: an Open Peeps illustration
 * (components/brand/cartoon-avatar.tsx) in colours and details picked from a
 * seed, the account id until the person picks "Acak lagi", so the same
 * account always gets the same face without storing a picture.
 */

import { createAvatar } from '@dicebear/core';
import * as openPeeps from '@dicebear/open-peeps';

export const SKIN_TONES = ['#F8D5C2', '#F3C4A2', '#E2AE88', '#C98D64', '#A06A45', '#7B4F34'] as const;
export const HAIR_COLORS = ['#161616', '#161616', '#3A2418', '#5B3A22', '#8A5A2B', '#A8432A'] as const;
export const HIJAB_COLORS = ['#0E8079', '#2F3E66', '#B5537A', '#6B4FBF', '#C9863A', '#556B4E'] as const;
export const SHIRT_COLORS = ['#161616', '#161616', '#0E8079', '#F9A720', '#3B6FD8', '#D9436A', '#6B4FBF', '#2E9E6A'] as const;
export const BACKGROUNDS = ['#FDF0DC', '#DDF2EF', '#ECE6FB', '#FCE4EC', '#E2ECFB', '#E7F5E1'] as const;

/** Hair styles, listed as often as each should turn up in drawn avatars (a hijab about one in four). */
export const HAIR_STYLES = ['quiff', 'quiff', 'curly', 'curly', 'curlyLong', 'short', 'short', 'medium', 'long', 'bald', 'hijab', 'hijab', 'hijab'] as const;
export const FACIAL_HAIR = ['none', 'none', 'none', 'none', 'mustache', 'beard'] as const;
/** The looks drawn without a moustache or beard. */
const BEARDLESS: readonly string[] = ['hijab', 'long', 'curlyLong'];
export const MOUTHS = ['grit', 'smile', 'grin', 'o', 'smirk'] as const;

export type AvatarTraits = {
  skin: string;
  hairStyle: (typeof HAIR_STYLES)[number];
  /** Hair colour, or the hijab's colour with the hijab style. */
  hairColor: string;
  /** Always "none" under a hijab or with long hair (BEARDLESS). */
  facialHair: (typeof FACIAL_HAIR)[number];
  mouth: (typeof MOUTHS)[number];
  glasses: boolean;
  shirt: string;
  background: string;
};

/**
 * Each trait is one digit of a number in mixed radix, read in this order. A
 * hijab's colours and hair colours come in the same number, so one digit
 * picks from whichever the style needs.
 */
const GLASSES = [true, false, false, false] as const;
const DIGITS: number[] = [
  SKIN_TONES.length,
  HAIR_STYLES.length,
  HAIR_COLORS.length,
  FACIAL_HAIR.length,
  MOUTHS.length,
  GLASSES.length,
  SHIRT_COLORS.length,
  BACKGROUNDS.length,
];
/** How many looks there are: a seed above it draws the same look as one below. */
const LOOKS = DIGITS.reduce((a, b) => a * b);

/**
 * FNV-1a, its output mixed (murmur3's finaliser) so that every digit read
 * from it depends on the whole seed.
 */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (const ch of seed) {
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

/**
 * A seed of eight hex digits ("Acak lagi", or a look read from a photo) is
 * the number itself, so seedForTraits can write one; any other seed (the
 * account id) is hashed.
 */
export function avatarTraits(seed: string): AvatarTraits {
  let n = AVATAR_SEED_PATTERN.test(seed) ? parseInt(seed, 16) : hash(seed);
  const [skin, hairStyle, hairColor, facialHair, mouth, glasses, shirt, background] = DIGITS.map((radix) => {
    const digit = n % radix;
    n = Math.floor(n / radix);
    return digit;
  });
  const style = HAIR_STYLES[hairStyle];
  return {
    skin: SKIN_TONES[skin],
    hairStyle: style,
    hairColor: (style === 'hijab' ? HIJAB_COLORS : HAIR_COLORS)[hairColor],
    facialHair: BEARDLESS.includes(style) ? 'none' : FACIAL_HAIR[facialHair],
    mouth: MOUTHS[mouth],
    glasses: GLASSES[glasses],
    shirt: SHIRT_COLORS[shirt],
    background: BACKGROUNDS[background],
  };
}

/** The Open Peeps pieces that draw each trait. */
const HEADS: Record<AvatarTraits['hairStyle'], string> = {
  quiff: 'pomp',
  curly: 'afro',
  curlyLong: 'longCurly',
  short: 'short2',
  medium: 'medium1',
  long: 'long',
  bald: 'noHair1',
  hijab: 'hijab',
};
const FACES: Record<AvatarTraits['mouth'], string> = { grit: 'smileBig', smile: 'smile', grin: 'smileBig', o: 'awe', smirk: 'cute' };
const BEARDS = { mustache: 'moustache9', beard: 'full' } as const;
/** Open Peeps draws the head (hair or hijab, and its outline) in this black. */
const PEEPS_INK = 'fill="#000"';

/** The avatar as SVG markup. */
export function avatarSvg(t: AvatarTraits): string {
  const hex = (color: string) => color.slice(1).toLowerCase();
  const svg = createAvatar(openPeeps, {
    seed: 'qala',
    head: [HEADS[t.hairStyle]] as openPeeps.Options['head'],
    face: [FACES[t.mouth]] as openPeeps.Options['face'],
    facialHair: t.facialHair === 'none' ? [] : ([BEARDS[t.facialHair]] as openPeeps.Options['facialHair']),
    facialHairProbability: t.facialHair === 'none' ? 0 : 100,
    accessories: ['glasses'],
    accessoriesProbability: t.glasses ? 100 : 0,
    maskProbability: 0,
    skinColor: [hex(t.skin)],
    clothingColor: [hex(t.shirt)],
    backgroundColor: [hex(t.background)],
  }).toString();
  if (t.hairColor === HAIR_COLORS[0]) return svg;
  // The head is the group placed after the body; recolour its black for brown hair or the hijab's colour.
  const head = svg.indexOf('<g transform=');
  const end = svg.indexOf('</g></g>', head);
  if (head < 0 || end < 0) return svg;
  return svg.slice(0, head) + svg.slice(head, end).replaceAll(PEEPS_INK, `fill="${t.hairColor}"`) + svg.slice(end);
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
  hairStyle: { quiff: 'quiff', curly: 'curly', 'long curly': 'curlyLong', short: 'short', medium: 'medium', long: 'long', bald: 'bald' },
  facialHair: { none: 'none', mustache: 'mustache', beard: 'beard' },
} as const;

const choices = (list: object) => Object.keys(list).map((k) => `"${k}"`).join(', ');

/** Asks a vision model which of the drawing's details fit the person in the photo. */
export const PHOTO_TRAITS_PROMPT = `The photo is turned into a simple cartoon avatar drawn from a fixed set of colours and details. Look closely at the person's hair texture and length, and pick the ones closest to the person in the photo. Reply with JSON only:
{"face": true, "skin": ..., "hijab": ..., "hair": ..., "hairStyle": ..., "facialHair": ..., "glasses": ..., "top": ..., "expression": ...}
- face: false when there is no single clearly visible human face (then leave out the rest).
- skin: one of ${choices(PHOTO_CHOICES.skin)}.
- hijab: the colour of their hijab or other head covering, one of ${choices(PHOTO_CHOICES.hijab)}, or null when their hair shows.
- hair: their hair colour, one of ${choices(PHOTO_CHOICES.hair)} (grey, white or blond: "light brown"; bald or shaved: "black").
- hairStyle: "curly" (curly, coily or afro hair above the shoulders), "long curly" (curly or wavy hair to the shoulders or below), "short" (straight hair cut close, crew cut or buzz cut), "quiff" (short at the sides, longer and swept up on top), "medium" (straight hair from the ears to the chin, such as a bob), "long" (straight hair to the shoulders or below) or "bald" (bald or shaved).
- facialHair: "beard" (a beard, with or without moustache), "mustache" (moustache only) or "none".
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
  const hairStyle = hijab ? 'hijab' : read(PHOTO_CHOICES.hairStyle, data.hairStyle, 'quiff');
  return {
    skin: read(PHOTO_CHOICES.skin, data.skin, 'light tan'),
    hairStyle,
    hairColor: hijab ? read(PHOTO_CHOICES.hijab, data.hijab, 'teal') : read(PHOTO_CHOICES.hair, data.hair, 'black'),
    facialHair: BEARDLESS.includes(hairStyle) ? 'none' : read(PHOTO_CHOICES.facialHair, data.facialHair, 'none'),
    mouth: read(PHOTO_CHOICES.expression, data.expression, 'smile'),
    glasses: data.glasses === true,
    shirt: read(PHOTO_CHOICES.top, data.top, 'black'),
  };
}

/**
 * A seed whose drawing has `wanted`, so an avatar read from a photo is kept
 * like any other drawn avatar: as its seed. The look's digits are written out
 * (avatarTraits reads them back) and the background is picked at random.
 */
export function seedForTraits(wanted: PhotoTraits): string {
  const index = (list: readonly unknown[], value: unknown) => {
    const i = list.indexOf(value);
    if (i < 0) throw new Error(`No drawing has ${String(value)}`);
    return i;
  };
  const digits = [
    index(SKIN_TONES, wanted.skin),
    index(HAIR_STYLES, wanted.hairStyle),
    index(wanted.hairStyle === 'hijab' ? HIJAB_COLORS : HAIR_COLORS, wanted.hairColor),
    index(FACIAL_HAIR, wanted.facialHair),
    index(MOUTHS, wanted.mouth),
    index(GLASSES, wanted.glasses),
    index(SHIRT_COLORS, wanted.shirt),
    Math.floor(Math.random() * BACKGROUNDS.length),
  ];
  let n = 0;
  for (let i = DIGITS.length - 1; i >= 0; i--) n = n * DIGITS[i] + digits[i];
  // Any multiple of LOOKS on top draws the same look, so seeds do not give away the look.
  n += LOOKS * Math.floor(Math.random() * Math.floor(0x100000000 / LOOKS));
  return n.toString(16).padStart(8, '0');
}
