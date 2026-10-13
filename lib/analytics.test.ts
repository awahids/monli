import { test } from 'node:test';
import assert from 'node:assert';
import { analyticsPath, appPlatform } from './analytics';

test('analyticsPath hides ids and tokens', () => {
  assert.equal(analyticsPath('/invite/3f2b9c1e-8d4a-4b7f-9a61-2c5d8e0f1a2b'), '/invite/:id');
  assert.equal(analyticsPath('/payments/QS-1728123456'), '/payments/:id');
});

test('analyticsPath keeps plain page names', () => {
  assert.equal(analyticsPath('/transactions'), '/transactions');
  assert.equal(analyticsPath('/auth/sign-in'), '/auth/sign-in');
  assert.equal(analyticsPath('/'), '/');
});

test('appPlatform tells the apps, the installed web app and the browser apart', () => {
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
  const android = 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';
  assert.equal(appPlatform(`${iphone} QalaSakuApp`, true), 'ios');
  assert.equal(appPlatform(`${android} QalaSakuApp`, true), 'android');
  assert.equal(appPlatform(android, true), 'pwa');
  assert.equal(appPlatform(iphone, false), 'web');
});
