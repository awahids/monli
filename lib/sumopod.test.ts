import { test } from 'node:test';
import assert from 'node:assert';
import { createSumopodAvatarClient, createSumopodClient, getSumopodAvatarModel, getSumopodModel } from './sumopod';

const originalKey = process.env.SUMOPOD_API_KEY;
const originalModel = process.env.SUMOPOD_MODEL;
const originalAvatarKey = process.env.SUMOPOD_AVATAR_API_KEY;
const originalAvatarModel = process.env.SUMOPOD_AVATAR_MODEL;

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

test('the cartoon from a photo has its own key, else the assistant\'s', () => {
  process.env.SUMOPOD_API_KEY = 'assistant';
  process.env.SUMOPOD_AVATAR_API_KEY = 'avatar';
  assert.equal(createSumopodAvatarClient().apiKey, 'avatar');
  delete process.env.SUMOPOD_AVATAR_API_KEY;
  assert.equal(createSumopodAvatarClient().apiKey, 'assistant');
});

test('the cartoon from a photo has its own model', () => {
  delete process.env.SUMOPOD_AVATAR_MODEL;
  assert.equal(getSumopodAvatarModel(), 'gpt-4.1-mini');
  process.env.SUMOPOD_AVATAR_MODEL = 'gpt-5-mini';
  assert.equal(getSumopodAvatarModel(), 'gpt-5-mini');
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
  if (originalAvatarKey) {
    process.env.SUMOPOD_AVATAR_API_KEY = originalAvatarKey;
  } else {
    delete process.env.SUMOPOD_AVATAR_API_KEY;
  }
  if (originalAvatarModel) {
    process.env.SUMOPOD_AVATAR_MODEL = originalAvatarModel;
  } else {
    delete process.env.SUMOPOD_AVATAR_MODEL;
  }
});

