import { test } from 'node:test';
import assert from 'node:assert';
import { checkPin, makeLock } from './app-lock';

test('a PIN lock accepts only its own PIN and never stores it', async () => {
  const lock = await makeLock('123456');
  assert.ok(!JSON.stringify(lock).includes('123456'));
  assert.equal(await checkPin(lock, '123456'), true);
  assert.equal(await checkPin(lock, '654321'), false);
  // Same PIN, new salt: a different hash.
  assert.notEqual((await makeLock('123456')).hash, lock.hash);
});
