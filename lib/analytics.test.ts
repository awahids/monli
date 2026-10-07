import { test } from 'node:test';
import assert from 'node:assert';
import { analyticsPath } from './analytics';

test('analyticsPath hides ids and tokens', () => {
  assert.equal(analyticsPath('/invite/3f2b9c1e-8d4a-4b7f-9a61-2c5d8e0f1a2b'), '/invite/:id');
  assert.equal(analyticsPath('/payments/QS-1728123456'), '/payments/:id');
});

test('analyticsPath keeps plain page names', () => {
  assert.equal(analyticsPath('/transactions'), '/transactions');
  assert.equal(analyticsPath('/auth/sign-in'), '/auth/sign-in');
  assert.equal(analyticsPath('/'), '/');
});
