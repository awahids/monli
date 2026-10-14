import { test } from 'node:test';
import assert from 'node:assert';
import { PRO_PLANS, TRIAL_DAYS, YEARLY_SAVING, extendProUntil, trialDaysLeft, trialEnd } from './plans';

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

test('paying adds the period on top of PRO time left, or from now', () => {
  const now = new Date('2026-10-13T00:00:00Z');
  // FREE or expired: from now.
  assert.equal(extendProUntil(null, 1, now), '2026-11-13T00:00:00.000Z');
  assert.equal(extendProUntil('2026-09-01T00:00:00Z', 12, now), '2027-10-13T00:00:00.000Z');
  // Mid-trial or mid-period: the days left are kept.
  assert.equal(extendProUntil('2026-10-20T00:00:00Z', 1, now), '2026-11-20T00:00:00.000Z');
});

test('the yearly plan is cheaper than twelve months', () => {
  assert.ok(PRO_PLANS.yearly.price < PRO_PLANS.monthly.price * 12);
  assert.equal(YEARLY_SAVING, 18);
});
