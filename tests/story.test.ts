import test from 'node:test';
import assert from 'node:assert/strict';
import { derive, todayFor, storyProgress, showerRequest, finalPrice, DEMO_CHANGE_ID, STORY } from '../src/lib/engine.ts';
import { DEMO_HOME_ID } from '../src/lib/people.ts';
import { AT_RISK_HOME_ID } from '../src/lib/seed.ts';
import type { ActionKind, DemoEvent, RoleId } from '../src/lib/types.ts';

const today = '2026-11-16';
const open = (ev: DemoEvent[], role: RoleId) => {
  const g = todayFor(derive(today, ev), role);
  return [...g.now, ...g.week];
};
const ids = (ev: DemoEvent[], role: RoleId) => open(ev, role).map((t) => t.id);

const steps: DemoEvent[] = [
  { type: 'selections.confirmed', homeId: DEMO_HOME_ID, at: today },
  showerRequest(today),
  { type: 'change.priced', changeId: DEMO_CHANGE_ID, price: 4800, cost: 3100, at: today },
  { type: 'change.approved', changeId: DEMO_CHANGE_ID, at: today },
  { type: 'adjustments.updated', changeId: DEMO_CHANGE_ID, at: today },
  { type: 'trade.confirmed', tradeId: `trade-${DEMO_CHANGE_ID}`, at: today },
  { type: 'amendment.sent', changeId: DEMO_CHANGE_ID, at: today },
  { type: 'closing.moved', homeId: AT_RISK_HOME_ID, days: 21, reason: 'drywall running late', at: today },
];
const upTo = (n: number) => steps.slice(0, n);

test('start: designer must confirm selections, story at step 0', () => {
  assert.ok(ids([], 'designer').includes('story-confirm'));
  assert.ok(!ids([], 'homeowner').includes('story-request'));
  assert.equal(storyProgress([]), 0);
});

test('1. designer confirms → homeowner can request a change', () => {
  const s = derive(today, upTo(1));
  assert.ok(s.selections.every((x) => x.status === 'confirmed'));
  assert.ok(ids(upTo(1), 'homeowner').includes('story-request'));
  assert.ok(!ids(upTo(1), 'designer').includes('story-confirm'));
});

test('2. homeowner requests shower → designer must price it', () => {
  assert.ok(ids(upTo(2), 'designer').includes(`price-${DEMO_CHANGE_ID}`));
  assert.equal(derive(today, upTo(2)).changes.find((c) => c.id === DEMO_CHANGE_ID)!.status, 'requested');
});

test('3. designer prices → homeowner approves in one tap', () => {
  assert.ok(ids(upTo(3), 'homeowner').includes(`approve-${DEMO_CHANGE_ID}`));
});

test('4. approval fans out to office, PM, Scott and the realtor', () => {
  const s = derive(today, upTo(4));
  const c = s.changes.find((x) => x.id === DEMO_CHANGE_ID)!;
  assert.equal(c.status, 'approved');
  assert.equal(c.number, 4, 'numbered after CO #1 to #3');
  const home = s.homes.find((h) => h.id === DEMO_HOME_ID)!;
  assert.equal(finalPrice(home, s.changes), 874900 - 750 + 4295 + 600 + 4800);
  assert.ok(ids(upTo(4), 'office').includes(`adjust-${DEMO_CHANGE_ID}`));
  assert.ok(ids(upTo(4), 'pm').includes(`trade-task-${DEMO_CHANGE_ID}`));
  assert.ok(ids(upTo(4), 'coo').includes(`ready-${DEMO_CHANGE_ID}`));
  assert.ok(ids(upTo(4), 'realtor').includes(`amend-${DEMO_CHANGE_ID}`));
  assert.equal(s.trades.find((t) => t.changeId === DEMO_CHANGE_ID)!.status, 'waiting');
});

test('6. PM confirms plumber → trade ready and homeowner gets an update', () => {
  const s = derive(today, upTo(6));
  assert.equal(s.trades.find((t) => t.changeId === DEMO_CHANGE_ID)!.status, 'ready');
  assert.ok(s.updates.some((u) => u.homeId === DEMO_HOME_ID && u.audience === 'homeowner' && /shower/i.test(u.note)));
});

test('7. realtor sends amendment → Scott must sign', () => {
  assert.ok(ids(upTo(7), 'coo').includes(`sign-${DEMO_CHANGE_ID}`));
});

test('8. Scott moves the at-risk closing 3 weeks', () => {
  const before = derive(today, []).homes.find((h) => h.id === AT_RISK_HOME_ID)!.closing!;
  const after = derive(today, upTo(8)).homes.find((h) => h.id === AT_RISK_HOME_ID)!.closing!;
  assert.equal(after > before, true);
  assert.equal(storyProgress(upTo(8)), 8);
  assert.equal(STORY.length, 9);
});

test('replaying an event twice changes nothing', () => {
  const once = derive(today, steps);
  const twice = derive(today, [...steps, ...steps]);
  assert.deepEqual(twice.changes, once.changes);
  assert.deepEqual(twice.homes, once.homes);
  assert.equal(twice.tasks.length, once.tasks.length);
});

test('reset returns to the exact starting state', () => {
  assert.deepEqual(derive(today, []), derive(today, []));
});

test('every open task in every role has a real action (no dead taps)', () => {
  const known: ActionKind[] = ['done', 'confirm-selections', 'request-change', 'price-change', 'approve-change', 'prepare-amendment', 'sign-amendment', 'update-adjustments', 'confirm-trade', 'move-closing', 'open-money'];
  const roles: RoleId[] = ['owner', 'coo', 'office', 'designer', 'pm', 'homeowner', 'realtor'];
  for (let n = 0; n <= steps.length; n++) {
    for (const r of roles) {
      for (const t of open(upTo(n), r)) assert.ok(known.includes(t.action), `${r}: ${t.title}`);
    }
  }
  for (const r of roles) assert.ok(open([], r).length > 0, `${r} has something to do on first load`);
});
