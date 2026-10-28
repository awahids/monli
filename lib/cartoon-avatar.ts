/**
 * The drawn profile picture every account gets: a cartoon bust turned a
 * little to the right, with bold outlines and flat colours
 * (components/brand/cartoon-avatar.tsx). Its looks come from a seed, the account id until the person picks "Acak lagi", so the
 * same account always gets the same face without storing a picture.
 */

export const SKIN_TONES = ['#FAD7C0', '#F3C4A2', '#E2AE88', '#C98D64', '#A06A45', '#7B4F34'] as const;
export const HAIR_COLORS = ['#161616', '#3A2418', '#5B3A22', '#8A5A2B', '#A8432A'] as const;
export const HIJAB_COLORS = ['#0E8079', '#2F3E66', '#B5537A', '#6B4FBF', '#C9863A', '#556B4E'] as const;
export const SHIRT_COLORS = ['#161616', '#0E8079', '#F9A720', '#3B6FD8', '#D9436A', '#6B4FBF', '#2E9E6A'] as const;
export const BACKGROUNDS = ['#FDF0DC', '#DDF2EF', '#ECE6FB', '#FCE4EC', '#E2ECFB', '#E7F5E1'] as const;

export const HAIR_STYLES = ['quiff', 'side', 'curly', 'long', 'bun', 'buzz', 'hijab'] as const;
export const EYES = ['dot', 'lash', 'happy'] as const;
export const BROWS = ['flat', 'raised', 'worried'] as const;
export const MOUTHS = ['grit', 'smile', 'grin', 'o', 'smirk'] as const;
export const COLLARS = ['collar', 'crew'] as const;

export type AvatarTraits = {
  skin: string;
  hairStyle: (typeof HAIR_STYLES)[number];
  /** Hair colour, or the hijab's colour with the hijab style. */
  hairColor: string;
  eyes: (typeof EYES)[number];
  brows: (typeof BROWS)[number];
  mouth: (typeof MOUTHS)[number];
  glasses: boolean;
  shirt: string;
  collar: (typeof COLLARS)[number];
  background: string;
};

/** FNV-1a, salted per trait so the traits do not move together. */
function hash(seed: string, salt: string): number {
  let h = 0x811c9dc5;
  for (const ch of `${salt}:${seed}`) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193);
  }
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
    eyes: pick(EYES, seed, 'eyes'),
    brows: pick(BROWS, seed, 'brows'),
    mouth: pick(MOUTHS, seed, 'mouth'),
    glasses: hash(seed, 'glasses') % 4 === 0,
    shirt: pick(SHIRT_COLORS, seed, 'shirt'),
    collar: pick(COLLARS, seed, 'collar'),
    background: pick(BACKGROUNDS, seed, 'background'),
  };
}

/** A fresh seed for "Acak lagi": short, so it fits the profile column comfortably. */
export function newAvatarSeed(): string {
  return crypto.randomUUID().slice(0, 8);
}

export const AVATAR_SEED_PATTERN = /^[0-9a-f]{8}$/;

/**
 * Asks the image model to redraw the photo (first image) in the style of the
 * reference drawing (second image, lib/avatar/style-reference.png).
 */
export const CARTOON_PROMPT = `Redraw the person in the first image as a cartoon portrait in exactly the drawing style of the second image: bold black outlines of even thickness, flat solid colours with no gradients or shading, simple rounded shapes and a friendly, slightly exaggerated expression. Use the same pose and framing as the second image: head and shoulders, the face turned slightly to the right in three-quarter view with both eyes and one ear (on the left) visible, on a plain white background.
Keep what makes the person recognisable: face shape, skin tone, hairstyle and hair colour, glasses, beard, hijab or other head covering, and the colour of their top.
The second image only shows the drawing style: do not copy its face, hair, expression or clothes. One person only, no text.`;

/** The cartoon's file type from its first bytes, or null when it is neither. */
export function imageType(bytes: Uint8Array): 'image/png' | 'image/webp' | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...Array.from(bytes.slice(from, to)));
  if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}
