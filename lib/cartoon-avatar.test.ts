import { test } from 'node:test';
import assert from 'node:assert';
import {
  AVATAR_SEED_PATTERN,
  FACE_SHAPES,
  FACIAL_HAIR,
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
  const shapes = new Set(Array.from({ length: 200 }, (_, i) => avatarTraits(`user-${i}`).face));
  assert.deepEqual(Array.from(shapes).sort(), Array.from(new Set(FACE_SHAPES)).sort());
  const beards = new Set(Array.from({ length: 200 }, (_, i) => avatarTraits(`user-${i}`).facialHair));
  assert.deepEqual(Array.from(beards).sort(), Array.from(new Set(FACIAL_HAIR)).sort());
});

test('a stored seed is read as a number, the same way every time', () => {
  assert.deepEqual(avatarTraits('00000000'), avatarTraits('00000000'));
  assert.equal(avatarTraits('00000000').hairStyle, HAIR_STYLES[0]);
  assert.equal(avatarTraits('ffffffff').background !== undefined, true);
});

test('a hijab takes a hijab colour and no beard', () => {
  for (let i = 0; i < 400; i++) {
    const t = avatarTraits(`user-${i}`);
    if (t.hairStyle === 'hijab') {
      assert.ok((HIJAB_COLORS as readonly string[]).includes(t.hairColor));
      assert.equal(t.facialHair, 'none');
    }
  }
});

test('new seeds match the stored format', () => {
  assert.match(newAvatarSeed(), AVATAR_SEED_PATTERN);
});

test('the AI\'s reply becomes the drawing\'s traits', () => {
  const reply = '```json\n{"face": true, "skin": "brown", "hijab": "navy", "hair": "black", "hairStyle": "curly", "faceShape": "round", "facialHair": "beard", "glasses": true, "top": "green", "expression": "grin"}\n```';
  assert.deepEqual(parsePhotoTraits(reply), {
    skin: PHOTO_CHOICES.skin.brown,
    hairStyle: 'hijab',
    hairColor: PHOTO_CHOICES.hijab.navy,
    face: 'round',
    facialHair: 'none',
    mouth: 'grin',
    glasses: true,
    shirt: PHOTO_CHOICES.top.green,
  });
  assert.deepEqual(parsePhotoTraits('{"face": true, "skin": "dark brown", "hijab": null, "hair": "black", "hairStyle": "curly", "faceShape": "square", "facialHair": "mustache", "glasses": false, "top": "blue", "expression": "smile"}'), {
    skin: PHOTO_CHOICES.skin['dark brown'],
    hairStyle: 'curly',
    hairColor: PHOTO_CHOICES.hair.black,
    face: 'square',
    facialHair: 'mustache',
    mouth: 'smile',
    glasses: false,
    shirt: PHOTO_CHOICES.top.blue,
  });
  // An older reply, or details outside the lists, fall back to the most common ones.
  assert.deepEqual(parsePhotoTraits('{"face": true, "skin": "tan", "hijab": null, "hair": "red", "hairStyle": "mohawk", "faceShape": "heart", "glasses": false, "top": "white", "expression": "frown"}'), {
    skin: PHOTO_CHOICES.skin.tan,
    hairStyle: 'quiff',
    hairColor: PHOTO_CHOICES.hair.red,
    face: 'oval',
    facialHair: 'none',
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
    for (const face of FACE_SHAPES) {
      for (const hairStyle of Object.values(PHOTO_CHOICES.hairStyle)) {
        for (const hairColor of Object.values(PHOTO_CHOICES.hair)) {
          for (const facialHair of Object.values(PHOTO_CHOICES.facialHair)) {
            looks.push({ skin, hairStyle, hairColor, face, facialHair, mouth: 'o', glasses: true, shirt: PHOTO_CHOICES.top.purple });
          }
        }
      }
      for (const hairColor of Object.values(PHOTO_CHOICES.hijab)) {
        looks.push({ skin, hairStyle: 'hijab', hairColor, face, facialHair: 'none', mouth: 'smirk', glasses: false, shirt: PHOTO_CHOICES.top.green });
      }
    }
  }
  looks.push({ skin: PHOTO_CHOICES.skin.light, hairStyle: 'quiff', hairColor: PHOTO_CHOICES.hair.black, face: 'oval', facialHair: 'none', mouth: 'smile', glasses: false, shirt: PHOTO_CHOICES.top.black });
  for (const look of looks) {
    const seed = seedForTraits(look);
    assert.match(seed, AVATAR_SEED_PATTERN);
    const { background, ...drawn } = avatarTraits(seed);
    assert.ok(background);
    assert.deepEqual(drawn, look);
  }
});
