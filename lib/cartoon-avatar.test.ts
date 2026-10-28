import { test } from 'node:test';
import assert from 'node:assert';
import { AVATAR_SEED_PATTERN, HAIR_STYLES, HIJAB_COLORS, avatarTraits, imageType, newAvatarSeed } from './cartoon-avatar';

test('the same seed always draws the same face', () => {
  const id = '3f1c2b9e-7a44-4d1e-9c55-0b2a6f9e1d20';
  assert.deepEqual(avatarTraits(id), avatarTraits(id));
});

test('different accounts get varied faces', () => {
  const faces = new Set(Array.from({ length: 50 }, (_, i) => JSON.stringify(avatarTraits(`user-${i}`))));
  assert.ok(faces.size >= 45, `only ${faces.size} different faces out of 50`);
  const styles = new Set(Array.from({ length: 200 }, (_, i) => avatarTraits(`user-${i}`).hairStyle));
  assert.deepEqual(Array.from(styles).sort(), [...HAIR_STYLES].sort());
});

test('a hijab takes a hijab colour', () => {
  for (let i = 0; i < 200; i++) {
    const t = avatarTraits(`user-${i}`);
    if (t.hairStyle === 'hijab') assert.ok((HIJAB_COLORS as readonly string[]).includes(t.hairColor));
  }
});

test('new seeds match the stored format', () => {
  assert.match(newAvatarSeed(), AVATAR_SEED_PATTERN);
});

test('the cartoon is stored as the type the model returned', () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webp = new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ');
  assert.equal(imageType(png), 'image/png');
  assert.equal(imageType(webp), 'image/webp');
  assert.equal(imageType(new TextEncoder().encode('<html>')), null);
});
