import { test } from 'node:test';
import assert from 'node:assert';
import { createSumopodClient, getSumopodModel } from './sumopod';

const originalKey = process.env.SUMOPOD_API_KEY;
const originalModel = process.env.SUMOPOD_MODEL;

test('createSumopodClient throws without API key', () => {
  delete process.env.SUMOPOD_API_KEY;
  assert.throws(() => createSumopodClient());
});

test('createSumopodClient returns client when API key is set', () => {
  process.env.SUMOPOD_API_KEY = 'test';
  const client = createSumopodClient();
  assert.ok(client);
});

test('getSumopodModel validates supported models', () => {
  delete process.env.SUMOPOD_MODEL;
  assert.equal(getSumopodModel(), 'gpt-4o-mini');
  process.env.SUMOPOD_MODEL = 'gpt-4o';
  assert.equal(getSumopodModel(), 'gpt-4o');
  process.env.SUMOPOD_MODEL = 'deepseek-chat';
  assert.equal(getSumopodModel(), 'gpt-4o-mini');
});

test.after(() => {
  if (originalKey) {
    process.env.SUMOPOD_API_KEY = originalKey;
  } else {
    delete process.env.SUMOPOD_API_KEY;
  }
  if (originalModel) {
    process.env.SUMOPOD_MODEL = originalModel;
  } else {
    delete process.env.SUMOPOD_MODEL;
  }
});

