import { test } from 'node:test';
import assert from 'node:assert';
import { APP_VERSION, CHANGELOG } from './changelog';

test('one entry per day, newest first, version matches the date', () => {
  const dates = CHANGELOG.map((e) => e.date);
  assert.deepEqual(dates, Array.from(new Set(dates)).sort().reverse());
  for (const e of CHANGELOG) {
    assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(e.version, e.date.replace(/-/g, '.'));
    assert.ok(e.items.length > 0, `${e.version} has no items`);
  }
  assert.equal(APP_VERSION, CHANGELOG[0].version);
});
