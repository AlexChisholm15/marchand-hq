import test from 'node:test';
import assert from 'node:assert/strict';
import { derive, finalPrice, showerRequest, DEMO_CHANGE_ID } from '../src/lib/engine.ts';
import { forecast, ASSUMPTIONS } from '../src/lib/finance.ts';
import type { DemoEvent } from '../src/lib/types.ts';

const today = '2026-11-16';
const base = derive(today, []);
const f0 = forecast(today, base.homes, base.changes);

test('portfolio has 39 homes: 28 presold, 11 spec', () => {
  assert.equal(base.homes.length, 39);
  assert.equal(base.homes.filter((h) => h.status === 'presold').length, 28);
  assert.equal(base.homes.filter((h) => h.status === 'spec').length, 11);
  assert.equal(new Set(base.homes.map((h) => h.community + h.lot)).size, 39, 'lots are unique per community');
});

test('every weekly cash position reconciles', () => {
  let cash = ASSUMPTIONS.openingCash;
  for (const w of f0.weeks) {
    cash += w.receipts - w.debtRepaid - w.spend - w.interest - w.overhead;
    assert.equal(w.cash, cash);
  }
});

test('measures are distinct and add up', () => {
  const net = f0.grossReceipts - f0.debtRepayment - f0.totalSpend - f0.totalInterest - f0.totalOverhead;
  assert.equal(net, f0.netCashFlow);
  assert.equal(f0.liquidity, f0.endingCash + ASSUMPTIONS.creditLine);
  assert.notEqual(f0.grossReceipts, f0.netCashFlow);
});

test('deposits are never counted twice at closing', () => {
  for (const c of f0.closings) {
    const h = base.homes.find((x) => x.id === c.homeId)!;
    assert.equal(c.receipts, finalPrice(h, base.changes) - 20000);
  }
});

test('spec homes bring in no closing money', () => {
  const spec = new Set(base.homes.filter((h) => h.status === 'spec').map((h) => h.id));
  assert.equal(f0.closings.filter((c) => spec.has(c.homeId)).length, 0);
});

test('undrawn credit is never shown as cash', () => {
  const more = forecast(today, base.homes, base.changes, {}, { ...ASSUMPTIONS, creditLine: 50_000_000 });
  assert.deepEqual(more.weeks.map((w) => w.cash), f0.weeks.map((w) => w.cash));
  assert.notEqual(more.liquidity, f0.liquidity);
});

test('a delay moves timing but not contract value', () => {
  const first = f0.closings[0];
  const moved = forecast(today, base.homes, base.changes, { [first.homeId]: 14 });
  const row = moved.closings.find((c) => c.homeId === first.homeId)!;
  assert.equal(row.finalPrice, first.finalPrice);
  assert.equal(moved.grossReceipts, f0.grossReceipts);
  assert.notDeepEqual(moved.weeks.map((w) => w.receipts), f0.weeks.map((w) => w.receipts));
});

test('an approved change order raises final price, receipts and cost', () => {
  const ev: DemoEvent[] = [
    showerRequest(today),
    { type: 'change.priced', changeId: DEMO_CHANGE_ID, price: 4800, cost: 3100, at: today },
    { type: 'change.approved', changeId: DEMO_CHANGE_ID, at: today },
  ];
  const s = derive(today, ev);
  const f = forecast(today, s.homes, s.changes);
  assert.equal(f.grossReceipts - f0.grossReceipts, 4800);
  assert.equal(f.grossMargin - f0.grossMargin, 4800 - 3100);
});

test('base case clears the reserve floor; delaying the three biggest closings breaches it', () => {
  assert.equal(f0.breach, null);
  const big = [...f0.closings].sort((a, b) => b.finalPrice - a.finalPrice).slice(0, 3);
  const what = forecast(today, base.homes, base.changes, Object.fromEntries(big.map((c) => [c.homeId, 28])));
  assert.ok(what.breach, 'what-if shows a breach');
  assert.ok(what.lowest.cash < ASSUMPTIONS.reserveFloor);
});

test('forecast covers 90 days in 13 weeks', () => {
  assert.equal(f0.weeks.length, 13);
  assert.ok(f0.closings.every((c) => c.date >= today && c.date < '2027-02-15'));
});
