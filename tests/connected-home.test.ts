import test from 'node:test';
import assert from 'node:assert/strict';
import { derive, todayFor, finalPrice, approvedExtras, isSuperseded, activeApprovedChanges } from '../src/lib/engine.ts';
import { DEMO_HOME_ID } from '../src/lib/people.ts';
import type { DemoEvent } from '../src/lib/types.ts';

const today = '2026-11-16';
const SPEC = { finish: 'Tile, linear drain', size: '60x32 curbless pan', location: 'Primary ensuite shower' };
const LINES = [{ id: 'l1', label: 'Tile and pan', qty: 1, unit: 4210.53 }];

const openIds = (ev: DemoEvent[], role: Parameters<typeof todayFor>[1]) => {
  const g = todayFor(derive(today, ev), role);
  return [...g.now, ...g.week].map((t) => t.id);
};

test('one buyer-requested shower becomes one versioned, spec-carrying change', () => {
  const events: DemoEvent[] = [
    { type: 'change.requested', changeId: 'c-shw', homeId: DEMO_HOME_ID, title: 'Tiled walk-in shower in ensuite', detail: '', room: 'Primary ensuite', at: today },
    { type: 'change.priced', changeId: 'c-shw', price: 4800, cost: 3100, spec: SPEC, lines: LINES, at: today },
    { type: 'change.approved', changeId: 'c-shw', at: today },
  ];
  const s = derive(today, events);
  const c = s.changes.find((x) => x.id === 'c-shw')!;
  assert.equal(c.status, 'approved');
  assert.deepEqual(c.spec, SPEC);
  assert.deepEqual(c.lines, LINES);
  assert.equal(isSuperseded('c-shw', s.changes), false);
  assert.equal(activeApprovedChanges(DEMO_HOME_ID, s.changes).filter((x) => x.spec).length, 1);

  const trade = s.trades.find((t) => t.changeId === 'c-shw')!;
  assert.equal(trade.trade, 'Plumbing');
  assert.equal(trade.company, 'Harbourview Plumbing');
  assert.match(trade.scope, /Tile, linear drain/);

  const pmTask = s.tasks.find((t) => t.id === `trade-task-c-shw`)!;
  assert.match(pmTask.detail, /Tile, linear drain/);

  const officeTask = s.tasks.find((t) => t.id === 'adjust-c-shw')!;
  assert.doesNotMatch(officeTask.detail, /revises/);
});

test('a declined revision never changes the active spec or the closing amount', () => {
  const base: DemoEvent[] = [
    { type: 'change.requested', changeId: 'c-shw', homeId: DEMO_HOME_ID, title: 'Shower v1', detail: '', room: 'Primary ensuite', at: today },
    { type: 'change.priced', changeId: 'c-shw', price: 4800, cost: 3100, spec: SPEC, lines: LINES, at: today },
    { type: 'change.approved', changeId: 'c-shw', at: today },
  ];
  const before = derive(today, base);
  const home0 = before.homes.find((h) => h.id === DEMO_HOME_ID)!;
  const priceBefore = finalPrice(home0, before.changes);

  const withDeclinedRevision: DemoEvent[] = [
    ...base,
    { type: 'change.requested', changeId: 'c-shw-v2', homeId: DEMO_HOME_ID, title: 'Shower v2 (larger pan)', detail: '', room: 'Primary ensuite', supersedes: 'c-shw', at: today },
    { type: 'change.priced', changeId: 'c-shw-v2', price: 6200, cost: 4000, spec: { ...SPEC, size: '72x36 curbless pan' }, lines: LINES, at: today },
    { type: 'change.declined', changeId: 'c-shw-v2', at: today },
  ];
  const s = derive(today, withDeclinedRevision);
  const original = s.changes.find((c) => c.id === 'c-shw')!;
  const revision = s.changes.find((c) => c.id === 'c-shw-v2')!;
  assert.equal(revision.status, 'declined');
  assert.equal(isSuperseded('c-shw', s.changes), false, 'declined revision must not supersede the active approved spec');
  assert.deepEqual(original.spec, SPEC, 'original spec is untouched by a declined revision');

  const home = s.homes.find((h) => h.id === DEMO_HOME_ID)!;
  assert.equal(finalPrice(home, s.changes), priceBefore, 'declined revision must not alter the closing amount');
  assert.equal(activeApprovedChanges(DEMO_HOME_ID, s.changes).filter((c) => c.spec).length, 1);
});

test('an approved revision supersedes the prior one: exactly one active spec, net delta, no duplicate tasks', () => {
  const events: DemoEvent[] = [
    { type: 'change.requested', changeId: 'c-shw', homeId: DEMO_HOME_ID, title: 'Shower v1', detail: '', room: 'Primary ensuite', at: today },
    { type: 'change.priced', changeId: 'c-shw', price: 4800, cost: 3100, spec: SPEC, lines: LINES, at: today },
    { type: 'change.approved', changeId: 'c-shw', at: today },
    { type: 'adjustments.updated', changeId: 'c-shw', at: today },
    { type: 'amendment.sent', changeId: 'c-shw', at: today },
    { type: 'change.requested', changeId: 'c-shw-v2', homeId: DEMO_HOME_ID, title: 'Shower v2 (larger pan)', detail: '', room: 'Primary ensuite', supersedes: 'c-shw', at: today },
    { type: 'change.priced', changeId: 'c-shw-v2', price: 6200, cost: 4000, spec: { ...SPEC, size: '72x36 curbless pan' }, lines: LINES, at: today },
    { type: 'change.approved', changeId: 'c-shw-v2', at: today },
  ];
  const s = derive(today, events);
  const original = s.changes.find((c) => c.id === 'c-shw')!;
  const revision = s.changes.find((c) => c.id === 'c-shw-v2')!;
  assert.equal(original.status, 'approved', 'history is preserved: original stays approved');
  assert.equal(revision.status, 'approved');
  assert.equal(isSuperseded('c-shw', s.changes), true);
  assert.equal(isSuperseded('c-shw-v2', s.changes), false);

  const active = activeApprovedChanges(DEMO_HOME_ID, s.changes).filter((c) => c.spec);
  assert.equal(active.length, 1, 'exactly one active approved spec for this thread');
  assert.equal(active[0].id, 'c-shw-v2');

  const home = s.homes.find((h) => h.id === DEMO_HOME_ID)!;
  // Net final price reflects only the revision's price, not both stacked.
  assert.equal(finalPrice(home, s.changes), 874900 - 750 + 4295 + 600 + 6200);
  assert.equal(approvedExtras(DEMO_HOME_ID, s.changes), approvedExtras(DEMO_HOME_ID, s.changes.filter((c) => c.id !== 'c-shw')));

  // No duplicate open financial-adjustment task: the prior one is closed, exactly one open for the revision.
  const openAdjust = s.tasks.filter((t) => t.role === 'office' && t.source === 'Closing' && t.action === 'update-adjustments' && t.status === 'open' && t.homeId === DEMO_HOME_ID);
  assert.equal(openAdjust.length, 1);
  assert.equal(openAdjust[0].id, 'adjust-c-shw-v2');
  assert.match(openAdjust[0].detail, /revises CO #\d+/);
  assert.match(openAdjust[0].detail, /Delta/);

  const doneAdjust = s.tasks.find((t) => t.id === 'adjust-c-shw')!;
  assert.equal(doneAdjust.status, 'done', 'the superseded thread\'s open adjustment task is closed, not left dangling');

  // No duplicate PM trade item: the prior one is retired, exactly one active (non-superseded) trade for this thread.
  const priorTrade = s.trades.find((t) => t.id === 'trade-c-shw')!;
  assert.equal(priorTrade.status, 'superseded');
  const newTrade = s.trades.find((t) => t.id === 'trade-c-shw-v2')!;
  assert.equal(newTrade.status, 'waiting');
  assert.match(newTrade.scope, /72x36 curbless pan/);

  // No duplicate PM task either.
  const openPmTasks = s.tasks.filter((t) => t.role === 'pm' && t.homeId === DEMO_HOME_ID && t.source === 'Trades' && t.status === 'open');
  assert.equal(openPmTasks.length, 1);
  assert.equal(openPmTasks[0].id, 'trade-task-c-shw-v2');
});

test('replaying the revision chain twice is still idempotent', () => {
  const events: DemoEvent[] = [
    { type: 'change.requested', changeId: 'c-shw', homeId: DEMO_HOME_ID, title: 'Shower v1', detail: '', room: 'Primary ensuite', at: today },
    { type: 'change.priced', changeId: 'c-shw', price: 4800, cost: 3100, spec: SPEC, lines: LINES, at: today },
    { type: 'change.approved', changeId: 'c-shw', at: today },
    { type: 'change.requested', changeId: 'c-shw-v2', homeId: DEMO_HOME_ID, title: 'Shower v2', detail: '', room: 'Primary ensuite', supersedes: 'c-shw', at: today },
    { type: 'change.priced', changeId: 'c-shw-v2', price: 6200, cost: 4000, spec: SPEC, lines: LINES, at: today },
    { type: 'change.approved', changeId: 'c-shw-v2', at: today },
  ];
  const once = derive(today, events);
  const twice = derive(today, [...events, ...events]);
  assert.deepEqual(twice.changes, once.changes);
  assert.deepEqual(twice.trades, once.trades);
  assert.equal(twice.tasks.length, once.tasks.length);
});

test('a second, unrelated home\'s changes stay isolated (no cross-lot leakage)', () => {
  const events: DemoEvent[] = [
    { type: 'change.requested', changeId: 'c-shw', homeId: DEMO_HOME_ID, title: 'Shower', detail: '', room: 'Primary ensuite', at: today },
    { type: 'change.priced', changeId: 'c-shw', price: 4800, cost: 3100, spec: SPEC, lines: LINES, at: today },
    { type: 'change.approved', changeId: 'c-shw', at: today },
    { type: 'change.requested', changeId: 'c-other', homeId: 'h02', title: 'Kitchen vent upgrade', detail: '', room: 'Kitchen', at: today },
    { type: 'change.priced', changeId: 'c-other', price: 1200, cost: 800, spec: { finish: 'Stainless', size: '600 CFM', location: 'Kitchen hood' }, lines: LINES, at: today },
    { type: 'change.approved', changeId: 'c-other', at: today },
  ];
  const s = derive(today, events);
  assert.equal(activeApprovedChanges(DEMO_HOME_ID, s.changes).some((c) => c.id === 'c-other'), false);
  assert.equal(activeApprovedChanges('h02', s.changes).some((c) => c.id === 'c-shw'), false);
  assert.equal(isSuperseded('c-shw', s.changes), false);
  assert.equal(isSuperseded('c-other', s.changes), false);
  const h02 = s.homes.find((h) => h.id === 'h02')!;
  // h02's own pre-seeded approved change orders (c04, c05) plus the new one.
  assert.equal(finalPrice(h02, s.changes), h02.listPrice + 537 + 7362 + 1200);
});

test('existing saved demo changes (pre-seeded, no spec or revision) keep working unchanged', () => {
  const s = derive(today, []);
  const seeded = s.changes.filter((c) => ['c01', 'c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08', 'c09'].includes(c.id));
  assert.equal(seeded.length, 9);
  for (const c of seeded) {
    assert.equal(isSuperseded(c.id, s.changes), false);
    assert.equal(c.spec ?? null, null);
  }
  const home = s.homes.find((h) => h.id === DEMO_HOME_ID)!;
  assert.equal(approvedExtras(DEMO_HOME_ID, s.changes), -750 + 4295 + 600);
});
