import { test } from 'node:test';
import assert from 'node:assert';
import {
  AVATAR_SEED_PATTERN,
  HAIR_STYLES,
  HIJAB_COLORS,
  PHOTO_CHOICES,
  avatarTraits,
  newAvatarSeed,
  parsePhotoTraits,
  seedForTraits,
  type PhotoTraits,
} from './cartoon-avatar';

test('the same seed always draws the same face', () => {
  const id = '3f1c2b9e-7a44-4d1e-9c55-0b2a6f9e1d20';
  assert.deepEqual(avatarTraits(id), avatarTraits(id));
});

test('different accounts get varied faces', () => {
  const faces = new Set(Array.from({ length: 50 }, (_, i) => JSON.stringify(avatarTraits(`user-${i}`))));
  assert.ok(faces.size >= 45, `only ${faces.size} different faces out of 50`);
  const styles = new Set(Array.from({ length: 200 }, (_, i) => avatarTraits(`user-${i}`).hairStyle));
  assert.deepEqual(Array.from(styles).sort(), Array.from(new Set(HAIR_STYLES)).sort());
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

test('the AI\'s reply becomes the drawing\'s traits', () => {
  const reply = '```json\n{"face": true, "skin": "brown", "hijab": "navy", "hair": "black", "glasses": true, "top": "green", "expression": "grin"}\n```';
  assert.deepEqual(parsePhotoTraits(reply), {
    skin: PHOTO_CHOICES.skin.brown,
    hairStyle: 'hijab',
    hairColor: PHOTO_CHOICES.hijab.navy,
    mouth: 'grin',
    glasses: true,
    shirt: PHOTO_CHOICES.top.green,
  });
  assert.deepEqual(parsePhotoTraits('{"face": true, "skin": "tan", "hijab": null, "hair": "red", "glasses": false, "top": "white", "expression": "frown"}'), {
    skin: PHOTO_CHOICES.skin.tan,
    hairStyle: 'quiff',
    hairColor: PHOTO_CHOICES.hair.red,
    mouth: 'smile',
    glasses: false,
    shirt: PHOTO_CHOICES.top.black,
  });
  assert.equal(parsePhotoTraits('{"face": false}'), null);
  assert.equal(parsePhotoTraits('Sorry, I cannot help with that.'), undefined);
});

test('every look read from a photo has a seed that draws it', () => {
  const looks: PhotoTraits[] = [];
  for (const skin of Object.values(PHOTO_CHOICES.skin)) {
    for (const [hairStyle, colors] of [['quiff', PHOTO_CHOICES.hair], ['hijab', PHOTO_CHOICES.hijab]] as const) {
      for (const hairColor of Object.values(colors)) {
        looks.push({ skin, hairStyle, hairColor, mouth: 'o', glasses: true, shirt: PHOTO_CHOICES.top.purple });
      }
    }
  }
  looks.push({ skin: PHOTO_CHOICES.skin.light, hairStyle: 'quiff', hairColor: PHOTO_CHOICES.hair.black, mouth: 'smile', glasses: false, shirt: PHOTO_CHOICES.top.black });
  for (const look of looks) {
    const seed = seedForTraits(look);
    assert.match(seed, AVATAR_SEED_PATTERN);
    const { background, ...drawn } = avatarTraits(seed);
    assert.ok(background);
    assert.deepEqual(drawn, look);
  }
});
