import { test } from 'node:test';
import assert from 'node:assert';
import { callbackPath, isAppUA } from './native';

test('the app is recognised by its user agent tag', () => {
  assert.equal(isAppUA('Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 QalaSakuApp/1.0'), true);
  assert.equal(isAppUA('Mozilla/5.0 (iPhone) Safari/604.1'), false);
  assert.equal(isAppUA(null), false);
});

test('OAuth deep links map to the callback page, nothing else does', () => {
  assert.equal(callbackPath('qalasaku://auth/callback?code=abc&next=%2Fdashboard'), '/auth/callback?code=abc&next=%2Fdashboard');
  assert.equal(callbackPath('qalasaku://auth/callback'), '/auth/callback');
  assert.equal(callbackPath('qalasaku://auth/callbackevil?code=1'), null);
  assert.equal(callbackPath('qalasaku://dashboard'), null);
  assert.equal(callbackPath('https://evil.example/auth/callback?code=1'), null);
});
