import { test } from 'node:test';
import assert from 'node:assert';
import { createHash } from 'crypto';
import { isValidSignature, mapStatus } from './midtrans';

test('mapStatus only treats settled or accepted captures as paid', () => {
  assert.equal(mapStatus('settlement'), 'success');
  assert.equal(mapStatus('capture', 'accept'), 'success');
  assert.equal(mapStatus('capture', 'challenge'), 'pending');
  assert.equal(mapStatus('pending'), 'pending');
  assert.equal(mapStatus('expire'), 'failed');
  assert.equal(mapStatus('cancel'), 'failed');
  assert.equal(mapStatus('deny'), 'failed');
});

test('isValidSignature verifies the Midtrans notification hash', () => {
  const original = process.env.MIDTRANS_SERVER_KEY;
  process.env.MIDTRANS_SERVER_KEY = 'server-key';
  const payload = {
    order_id: 'order-1',
    status_code: '200',
    gross_amount: '9000.00',
  };
  const signature_key = createHash('sha512')
    .update('order-1' + '200' + '9000.00' + 'server-key')
    .digest('hex');

  assert.equal(isValidSignature({ ...payload, signature_key }), true);
  assert.equal(
    isValidSignature({ ...payload, gross_amount: '1.00', signature_key }),
    false
  );
  assert.equal(isValidSignature(payload), false);

  if (original === undefined) delete process.env.MIDTRANS_SERVER_KEY;
  else process.env.MIDTRANS_SERVER_KEY = original;
});
