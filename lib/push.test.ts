import { test } from 'node:test';
import assert from 'node:assert';
import { keyBytes, pushPayload, schedulePayload } from './push';

test('schedulePayload sends ISO times in due order', () => {
  const plan = [
    { id: 2, title: 'B', body: 'b', url: '/dashboard', at: new Date('2026-03-11T13:00:00Z') },
    { id: 1, title: 'A', body: 'a', url: '/recurring', at: new Date('2026-03-11T02:00:00Z') },
  ];
  assert.deepStrictEqual(schedulePayload(plan).notifications.map((n) => [n.id, n.at]), [
    [1, '2026-03-11T02:00:00.000Z'],
    [2, '2026-03-11T13:00:00.000Z'],
  ]);
});

test('pushPayload carries only what the service worker shows', () => {
  assert.deepStrictEqual(JSON.parse(pushPayload({ title: 'T', body: 'B', url: '/budgets' })), { title: 'T', body: 'B', url: '/budgets' });
});

test('keyBytes decodes base64url without padding', () => {
  assert.deepStrictEqual(Array.from(keyBytes('AQID_-8')), [1, 2, 3, 255, 239]);
});
