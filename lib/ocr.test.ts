import { test } from 'node:test';
import assert from 'node:assert';
import { parseOcrReply } from './ocr';

test('reads a bank history reply wrapped in a code fence', () => {
  const reply = '```json\n{"items":[{"description":"ANDI WIBOWO","amount":"-Rp40.000","date":"2026-10-02","type":"expense"},' +
    '{"description":"KOMPLEK BCI C01-05","amount":90000,"date":"2026-10-02","type":"expense"},' +
    '{"description":"Gaji","amount":1500000,"date":"2026-10-01","type":"income"}],"total":0,"date":null}\n```';
  const { items } = parseOcrReply(reply);
  assert.deepEqual(items, [
    { description: 'ANDI WIBOWO', amount: 40000, date: '2026-10-02', type: 'expense' },
    { description: 'KOMPLEK BCI C01-05', amount: 90000, date: '2026-10-02', type: 'expense' },
    { description: 'Gaji', amount: 1500000, date: '2026-10-01', type: 'income' },
  ]);
});

test('reads a receipt, drops empty rows and bad dates', () => {
  const { items, total, date } = parseOcrReply(
    'Here you go: {"items":[{"description":"Kopi","amount":25000},{"description":"Diskon","amount":0}],"total":"25.000","date":"07/10/2026"}'
  );
  assert.deepEqual(items, [{ description: 'Kopi', amount: 25000, date: undefined, type: 'expense' }]);
  assert.equal(total, 25000);
  assert.equal(date, null);
});

test('a negative amount is never income', () => {
  const { items } = parseOcrReply('{"items":[{"description":"x","amount":-5000,"type":"income"}]}');
  assert.equal(items[0].type, 'expense');
});

test('garbage gives an empty result', () => {
  assert.deepEqual(parseOcrReply('maaf, tidak terbaca'), { items: [], total: 0, date: null });
});
