import { test } from 'node:test';
import assert from 'node:assert';
import { parseOcrReply, parseRecordReply } from './ocr';

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

test('chat drafts match category and account names', () => {
  const accounts = [{ id: 'a1', name: 'Dompet' }, { id: 'a2', name: 'GoPay' }];
  const categories = [
    { id: 'c1', name: 'Makan', type: 'expense' },
    { id: 'c2', name: 'Gaji', type: 'income' },
  ];
  const reply = '```json\n{"record":[{"type":"expense","amount":25000,"description":"Makan siang","category":"makan","account":"gopay","date":"2026-10-07"},' +
    '{"type":"income","amount":"5 jt","description":"Gaji","category":"Gaji","account":null,"date":"2026-10-07"}]}\n```';
  assert.deepEqual(parseRecordReply(reply, accounts, categories), [
    { description: 'Makan siang', amount: 25000, date: '2026-10-07', type: 'expense', categoryId: 'c1', accountId: 'a2' },
    { description: 'Gaji', amount: 5000000, date: '2026-10-07', type: 'income', categoryId: 'c2', accountId: undefined },
  ]);
  assert.equal(parseRecordReply('Pengeluaranmu bulan ini **Rp 1.200.000**.', accounts, categories), null);
});

test('Indonesian shorthand amounts', () => {
  const amounts = parseOcrReply(
    '{"items":[{"description":"a","amount":"25rb"},{"description":"b","amount":"1,5 juta"},{"description":"c","amount":"Rp 40.000"},{"description":"d","amount":"12k"}]}'
  ).items.map((i) => i.amount);
  assert.deepEqual(amounts, [25000, 1500000, 40000, 12000]);
});
