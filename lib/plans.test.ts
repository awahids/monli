import { test } from 'node:test';
import assert from 'node:assert';
import { TRIAL_DAYS, trialDaysLeft, trialEnd } from './plans';

test('a trial ends TRIAL_DAYS after it starts', () => {
  const start = new Date('2026-10-08T10:00:00Z');
  assert.equal(trialEnd(start).toISOString(), '2026-10-22T10:00:00.000Z');
  assert.equal(trialDaysLeft(trialEnd(start).toISOString(), start), TRIAL_DAYS);
});

test('days left round up, never go below zero, and are null off-trial', () => {
  const now = new Date('2026-10-08T10:00:00Z');
  assert.equal(trialDaysLeft('2026-10-08T11:00:00Z', now), 1);
  assert.equal(trialDaysLeft('2026-10-10T09:00:00Z', now), 2);
  assert.equal(trialDaysLeft('2026-10-07T10:00:00Z', now), 0);
  assert.equal(trialDaysLeft(null, now), null);
});
