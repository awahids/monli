import { test } from 'node:test';
import assert from 'node:assert';
import { splitEvenly } from './split';

test('splitEvenly adds up to the total', () => {
  assert.deepEqual(splitEvenly(300000, 3), [100000, 100000, 100000]);
  assert.deepEqual(splitEvenly(100000, 3), [33334, 33333, 33333]);
  assert.deepEqual(splitEvenly(5, 0), []);
});
