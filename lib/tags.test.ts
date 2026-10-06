import { test } from 'node:test';
import assert from 'node:assert';
import { suggestTags, tokenize, type TagHistoryRow } from './tags';

const history: TagHistoryRow[] = [
  { note: 'Makan siang kantor', categoryId: 'food', tags: ['kantor'] },
  { note: 'Makan siang', categoryId: 'food', tags: ['kantor', 'makan-siang'] },
  { note: 'Kopi', categoryId: 'food', tags: ['ngopi'] },
  { note: 'Bensin motor', categoryId: 'transport', tags: ['motor'] },
  { note: 'Servis motor', categoryId: 'transport', tags: ['motor', 'servis'] },
];

test('tokenize keeps 3+ letter words, lowercased', () => {
  assert.deepEqual(tokenize('Makan di KFC, 2x'), ['makan', 'kfc']);
  assert.deepEqual(tokenize(null), []);
});

test('suggestTags ranks tags from notes sharing words', () => {
  assert.deepEqual(suggestTags(history, { note: 'makan siang bareng' }).slice(0, 2), ['kantor', 'makan-siang']);
});

test('suggestTags uses the category when the note is empty', () => {
  assert.deepEqual(suggestTags(history, { categoryId: 'transport' }), ['motor', 'servis']);
});

test('suggestTags boosts tags named in the note', () => {
  assert.equal(suggestTags(history, { note: 'ganti oli motor', categoryId: 'food' })[0], 'motor');
});

test('suggestTags skips tags already added and returns nothing without input', () => {
  assert.ok(!suggestTags(history, { categoryId: 'transport', exclude: ['MOTOR'] }).includes('motor'));
  assert.deepEqual(suggestTags(history, {}), []);
  assert.deepEqual(suggestTags([], { note: 'apa saja' }), []);
});
