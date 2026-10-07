import { test } from 'node:test';
import assert from 'node:assert';
import { PAGE_ROWS, selectAll } from './select-all';

const table = Array.from({ length: 2 * PAGE_ROWS + 5 }, (_, i) => i);
const capped = (from: number, to: number) =>
  Promise.resolve({ data: table.slice(from, Math.min(to + 1, from + PAGE_ROWS)), error: null });

test('reads past the per-request row cap', async () => {
  const { data } = await selectAll(capped);
  assert.equal(data?.length, table.length);
  assert.equal(data?.[table.length - 1], table.length - 1);
});

test('stops after a short page and on errors', async () => {
  let calls = 0;
  const { data } = await selectAll((from, to) => (calls++, Promise.resolve({ data: [1, 2].slice(from, to + 1), error: null })));
  assert.deepEqual(data, [1, 2]);
  assert.equal(calls, 1);
  const failed = await selectAll(() => Promise.resolve({ data: null, error: { message: 'boom' } }));
  assert.deepEqual(failed, { data: null, error: { message: 'boom' } });
});
