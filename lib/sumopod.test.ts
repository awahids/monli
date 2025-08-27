import { test } from 'node:test';
import assert from 'node:assert';
import { createSumopodClient } from './sumopod';

const originalKey = process.env.SUMOPOD_API_KEY;

test('createSumopodClient throws without API key', () => {
  delete process.env.SUMOPOD_API_KEY;
  assert.throws(() => createSumopodClient());
});

test('createSumopodClient returns client when API key is set', () => {
  process.env.SUMOPOD_API_KEY = 'test';
  const client = createSumopodClient();
  assert.ok(client);
});

test.after(() => {
  if (originalKey) {
    process.env.SUMOPOD_API_KEY = originalKey;
  } else {
    delete process.env.SUMOPOD_API_KEY;
  }
});

