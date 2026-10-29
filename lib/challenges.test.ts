import { test } from 'node:test';
import assert from 'node:assert';
import { challengeProgress, kantoMood, recordingStreak, slipsLeft, type Challenge } from './challenges';

const days = (...d: string[]) => new Set(d);
const week: Challenge = { id: 'c', categoryId: 'snacks', lengthDays: 7, targetDays: 5, startDate: '2026-10-26' };

test('the streak counts days in a row with something recorded, alive until today is over', () => {
  const recorded = days('2026-10-26', '2026-10-27', '2026-10-28');
  assert.deepEqual(recordingStreak(recorded, '2026-10-28'), { days: 3, recordedToday: true });
  assert.deepEqual(recordingStreak(recorded, '2026-10-29'), { days: 3, recordedToday: false });
  assert.deepEqual(recordingStreak(recorded, '2026-10-30'), { days: 0, recordedToday: false });
  assert.deepEqual(recordingStreak(days('2026-10-24', '2026-10-28'), '2026-10-28'), { days: 1, recordedToday: true });
});

test('a challenge counts clean days that are over, and slips including today', () => {
  const p = challengeProgress(week, days('2026-10-27', '2026-10-29'), '2026-10-29');
  assert.deepEqual(p.days, ['free', 'slip', 'free', 'slip', 'future', 'future', 'future']);
  assert.deepEqual([p.freeDays, p.slipDays, p.status, p.endDate, p.slipToday], [2, 2, 'active', '2026-11-01', true]);
  assert.equal(slipsLeft(week, p), 0);
  const clean = challengeProgress(week, days(), '2026-10-28');
  assert.deepEqual(clean.days.slice(0, 3), ['free', 'free', 'today']);
  assert.equal(clean.freeDays, 2);
});

test('won once enough days pass clean, lost once the target is out of reach', () => {
  assert.equal(challengeProgress(week, days('2026-10-26'), '2026-11-01').status, 'won'); // 5 clean days by Saturday
  assert.equal(challengeProgress(week, days('2026-10-26', '2026-10-27'), '2026-10-31').status, 'active');
  assert.equal(challengeProgress(week, days('2026-10-26', '2026-10-27', '2026-10-28'), '2026-10-28').status, 'lost');
  // Over with only 4 clean days.
  assert.equal(challengeProgress(week, days('2026-10-26', '2026-10-27', '2026-11-01'), '2026-11-02').status, 'lost');
  // Spending outside the challenge does not count.
  assert.equal(challengeProgress(week, days('2026-10-20', '2026-11-05'), '2026-11-02').status, 'won');
});

test('Kanto cheers a win or a kept streak, and is sad about a slip today', () => {
  const today = '2026-10-29';
  const keptStreak = { days: 3, recordedToday: true };
  assert.equal(kantoMood(keptStreak, [], today), 'cheer');
  assert.equal(kantoMood({ days: 3, recordedToday: false }, [], today), 'idle');
  assert.equal(kantoMood(keptStreak, [{ status: 'active', slipToday: true, endDate: '2026-11-01' }], today), 'sad');
  assert.equal(kantoMood({ days: 0, recordedToday: false }, [{ status: 'won', slipToday: false, endDate: '2026-10-28' }], today), 'cheer');
  // An old loss is forgotten.
  assert.equal(kantoMood({ days: 0, recordedToday: false }, [{ status: 'lost', slipToday: false, endDate: '2026-10-20' }], today), 'idle');
});
