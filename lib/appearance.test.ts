import { test } from 'node:test';
import assert from 'node:assert';
import { effectiveTheme, parseAccent } from './appearance';

test('parseAccent falls back to teal for unknown values', () => {
  assert.equal(parseAccent('violet'), 'violet');
  assert.equal(parseAccent('purple'), 'teal');
  assert.equal(parseAccent(null), 'teal');
});

test('PRO themes need PRO; Klasik is for everyone', () => {
  assert.equal(effectiveTheme('soft', true), 'soft');
  assert.equal(effectiveTheme('soft', false), 'classic');
  assert.equal(effectiveTheme('classic', false), 'classic');
  assert.equal(effectiveTheme('neon', true), 'classic');
  assert.equal(effectiveTheme(null, true), 'classic');
});
