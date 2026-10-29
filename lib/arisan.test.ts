import { test } from 'node:test';
import assert from 'node:assert';
import { arisanReminders, arisanSchedule, currentRound, myUnpaidRounds, potSize, roundDate, shuffleTurns, type Arisan } from './arisan';

const members = [
  { id: 'a', name: 'Bu Sari', turn: 1, isMe: false },
  { id: 'b', name: 'Saya', turn: 2, isMe: true },
  { id: 'c', name: 'Pak Budi', turn: 3, isMe: false },
];
const arisan: Arisan = { id: 'x', name: 'RT 05', amount: 100_000, frequency: 'monthly', startDate: '2026-01-31', members, payments: [] };

test('rounds fall each week or month, keeping the day or the month\'s last', () => {
  assert.deepEqual([1, 2, 3, 4].map((r) => roundDate('2026-01-31', 'monthly', r)), ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  assert.deepEqual([1, 2, 3].map((r) => roundDate('2026-10-29', 'weekly', r)), ['2026-10-29', '2026-11-05', '2026-11-12']);
});

test('the schedule gives each round its receiver and how many have paid', () => {
  const a = { ...arisan, payments: [{ memberId: 'a', round: 1, paidOn: '2026-01-31' }, { memberId: 'b', round: 1, paidOn: '2026-01-31' }] };
  assert.deepEqual(
    arisanSchedule(a).map((r) => [r.round, r.date, r.receiver?.name, r.paid]),
    [
      [1, '2026-01-31', 'Bu Sari', 2],
      [2, '2026-02-28', 'Saya', 0],
      [3, '2026-03-31', 'Pak Budi', 0],
    ]
  );
  assert.equal(potSize(a), 300_000);
});

test('the current round is the latest started, until the last is over and paid', () => {
  assert.equal(currentRound(arisan, '2026-01-01')!.round, 1);
  assert.equal(currentRound(arisan, '2026-03-01')!.round, 2);
  assert.equal(currentRound(arisan, '2026-05-01')!.round, 3);
  const allPaid = { ...arisan, payments: members.flatMap((m) => [1, 2, 3].map((round) => ({ memberId: m.id, round, paidOn: '2026-03-31' }))) };
  assert.equal(currentRound(allPaid, '2026-05-01'), null);
});

test('the user\'s unpaid rounds and reminders', () => {
  const a = { ...arisan, payments: [{ memberId: 'b', round: 1, paidOn: '2026-01-31' }] };
  assert.deepEqual(myUnpaidRounds(a, '2026-03-01').map((r) => r.round), [2]);
  assert.deepEqual(
    arisanReminders([a], '2026-02-01', '2026-04-30').map((r) => [r.kind, r.round.round]),
    [
      ['receive', 2],
      ['pay', 3],
    ]
  );
  // Not a member: nothing to remind.
  assert.deepEqual(arisanReminders([{ ...a, members: members.map((m) => ({ ...m, isMe: false })) }], '2026-02-01', '2026-04-30'), []);
});

test('shuffling the turns keeps every member once', () => {
  let seed = 1;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const out = shuffleTurns(['a', 'b', 'c', 'd', 'e'], random);
  assert.deepEqual([...out].sort(), ['a', 'b', 'c', 'd', 'e']);
  assert.notDeepEqual(out, ['a', 'b', 'c', 'd', 'e']);
});
