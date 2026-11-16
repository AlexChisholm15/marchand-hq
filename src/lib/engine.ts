import type { Activity, Change, DemoEvent, Home, RoleId, State, Task, TradeItem, Update } from './types.ts';
import { addDays, daysBetween, money } from './format.ts';
import { DEMO_BUYER, DEMO_HOME_ID, STAFF } from './people.ts';
import {
  AT_RISK_HOME_ID, SHOWER_CHANGE, createChanges, createHomes, createSelections, createTasks, createTrades, createUpdates,
} from './seed.ts';

const WHO: Record<DemoEvent['type'], string> = {
  'selections.confirmed': STAFF.designerA,
  'change.requested': DEMO_BUYER,
  'change.priced': STAFF.designerA,
  'change.approved': DEMO_BUYER,
  'change.declined': DEMO_BUYER,
  'amendment.sent': STAFF.realtor,
  'amendment.signed': STAFF.coo,
  'adjustments.updated': STAFF.business,
  'trade.confirmed': STAFF.pm,
  'closing.moved': STAFF.coo,
  'task.done': '',
};

/** One shared event record → one state every role reads. Pure and deterministic. */
export function derive(today: string, events: DemoEvent[]): State {
  const homes = createHomes(today);
  const selections = createSelections();
  const changes = createChanges(today);
  const tasks = createTasks(today);
  const trades = createTrades(today);
  const updates = createUpdates(today);
  const activity: Activity[] = [];
  const closingMoves: Record<string, number> = {};
  const homeById = new Map(homes.map((h) => [h.id, h]));
  const changeById = new Map(changes.map((c) => [c.id, c]));
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  const addTask = (task: Omit<Task, 'status' | 'doneOn'>, done: string | null = null) => {
    const t: Task = { ...task, status: done ? 'done' : 'open', doneOn: done };
    taskById.set(t.id, t);
    tasks.push(t);
    return t;
  };
  const complete = (id: string, at: string) => {
    const t = taskById.get(id);
    if (t && t.status === 'open') {
      t.status = 'done';
      t.doneOn = at;
    }
  };
  const log = (e: DemoEvent, text: string, homeId: string | null) =>
    activity.push({ id: `a${activity.length + 1}`, at: e.at, who: WHO[e.type], text, homeId });

  const lot = (id: string) => `Lot ${homeById.get(id)?.lot ?? ''}`;

  // Story entry point: designer confirms selections.
  addTask({
    id: 'story-confirm', role: 'designer', homeId: DEMO_HOME_ID, title: 'Confirm finish selections',
    detail: `${DEMO_BUYER} picked finishes at Tuesday's meeting. Confirm so the buyer can review.`,
    due: today, source: 'Selections', owner: STAFF.designerA, action: 'confirm-selections', ref: DEMO_HOME_ID,
  });

  for (const e of events) {
    switch (e.type) {
      case 'selections.confirmed': {
        if (selections.every((s) => s.status === 'confirmed')) break;
        selections.forEach((s) => { if (s.homeId === e.homeId) s.status = 'confirmed'; });
        complete('story-confirm', e.at);
        addTask({
          id: 'story-request', role: 'homeowner', homeId: e.homeId, title: 'Your selections are confirmed',
          detail: 'Review your finishes. Want an upgrade? Request a change and Jorelle will price it.',
          due: today, source: 'Selections', owner: DEMO_BUYER, action: 'request-change', ref: e.homeId,
        });
        log(e, `confirmed finish selections for ${lot(e.homeId)}`, e.homeId);
        break;
      }
      case 'change.requested': {
        if (changeById.has(e.changeId)) break;
        const c: Change = {
          id: e.changeId, homeId: e.homeId, number: null, title: e.title, detail: e.detail, room: e.room,
          status: 'requested', price: null, cost: null, requestedOn: e.at, pricedOn: null, decidedOn: null,
        };
        changes.push(c);
        changeById.set(c.id, c);
        complete('story-request', e.at);
        addTask({
          id: `price-${c.id}`, role: 'designer', homeId: e.homeId, title: `Price change: ${c.title.toLowerCase()}`,
          detail: c.detail, due: today, source: 'Change order', owner: STAFF.designerA, action: 'price-change', ref: c.id,
        });
        log(e, `requested a change: ${c.title.toLowerCase()}`, e.homeId);
        break;
      }
      case 'change.priced': {
        const c = changeById.get(e.changeId);
        if (!c || c.status !== 'requested') break;
        c.status = 'priced';
        c.price = e.price;
        c.cost = e.cost;
        c.pricedOn = e.at;
        complete(`price-${c.id}`, e.at);
        if (c.homeId === DEMO_HOME_ID) {
          addTask({
            id: `approve-${c.id}`, role: 'homeowner', homeId: c.homeId, title: `Approve ${c.title.toLowerCase()}`,
            detail: `${money(e.price)} including HST. Added to your final price at closing.`,
            due: addDays(today, 1), source: 'Change order', owner: DEMO_BUYER, action: 'approve-change', ref: c.id,
          });
        }
        log(e, `priced ${c.title.toLowerCase()} at ${money(e.price)}`, c.homeId);
        break;
      }
      case 'change.approved':
      case 'change.declined': {
        const c = changeById.get(e.changeId);
        if (!c || c.status !== 'priced') break;
        complete(`approve-${c.id}`, e.at);
        c.decidedOn = e.at;
        if (e.type === 'change.declined') {
          c.status = 'declined';
          log(e, `declined ${c.title.toLowerCase()}`, c.homeId);
          break;
        }
        c.status = 'approved';
        c.number = Math.max(0, ...changes.filter((x) => x.homeId === c.homeId && x.number).map((x) => x.number!)) + 1;
        const home = homeById.get(c.homeId)!;
        const trade: TradeItem = {
          id: `trade-${c.id}`, homeId: c.homeId, trade: 'Plumbing', company: 'Harbourview Plumbing',
          scope: 'Move drain for linear drain and set curbless pan before drywall', neededBy: addDays(today, 6),
          status: 'waiting', changeId: c.id,
        };
        trades.push(trade);
        const final = finalPrice(home, changes);
        addTask({
          id: `adjust-${c.id}`, role: 'office', homeId: c.homeId, title: `Update closing adjustments: CO #${c.number}`,
          detail: `Final price is now ${money(final)}. $20,000 deposit on file. Balance due at closing ${money(final - home.deposit)}.`,
          due: today, source: 'Closing', owner: STAFF.business, action: 'update-adjustments', ref: c.id,
        });
        addTask({
          id: `trade-task-${c.id}`, role: 'pm', homeId: c.homeId, title: 'Confirm plumber before drywall',
          detail: `CO #${c.number} approved: ${c.title.toLowerCase()}. Drain must move before drywall.`,
          due: addDays(today, 2), source: 'Trades', owner: STAFF.pm, action: 'confirm-trade', ref: trade.id,
        });
        addTask({
          id: `amend-${c.id}`, role: 'realtor', homeId: c.homeId, title: `Prepare price amendment: CO #${c.number}`,
          detail: `Signed change orders 1 to ${c.number}. Final price ${money(final)}. Send to Scott to sign.`,
          due: addDays(today, 1), source: 'Change order', owner: STAFF.realtor, action: 'prepare-amendment', ref: c.id,
        });
        addTask({
          id: `ready-${c.id}`, role: 'coo', homeId: c.homeId, title: `Trade readiness: CO #${c.number} shower`,
          detail: 'Plumber must move the drain before drywall. Gerry is confirming.',
          due: addDays(today, 2), source: 'Trades', owner: STAFF.coo, action: 'done', ref: trade.id,
        });
        log(e, `approved CO #${c.number}: ${c.title.toLowerCase()} (${money(c.price!)})`, c.homeId);
        break;
      }
      case 'adjustments.updated': {
        const c = changeById.get(e.changeId);
        if (!c) break;
        complete(`adjust-${c.id}`, e.at);
        log(e, `updated closing adjustments for ${lot(c.homeId)}`, c.homeId);
        break;
      }
      case 'trade.confirmed': {
        const tr = trades.find((x) => x.id === e.tradeId);
        if (!tr || tr.status === 'ready') break;
        tr.status = 'ready';
        complete(`trade-task-${tr.changeId}`, e.at);
        const ready = taskById.get(`ready-${tr.changeId}`);
        if (ready && ready.status === 'open') ready.detail = `${tr.company} confirmed. Ready before drywall.`;
        const u: Update = {
          id: `u-${tr.id}`, homeId: tr.homeId, date: e.at, stage: 'Rough-ins',
          note: 'Your shower upgrade is booked. The plumber moves the drain this week, before drywall.',
          by: STAFF.pm, audience: 'homeowner',
        };
        updates.push(u);
        log(e, `confirmed ${tr.company.toLowerCase()} for ${lot(tr.homeId)}`, tr.homeId);
        break;
      }
      case 'amendment.sent': {
        const c = changeById.get(e.changeId);
        if (!c || taskById.get(`sign-${c.id}`)) break;
        complete(`amend-${c.id}`, e.at);
        addTask({
          id: `sign-${c.id}`, role: 'coo', homeId: c.homeId, title: `Sign price amendment: CO #${c.number}`,
          detail: `From Alex Chisholm. Final price ${money(finalPrice(homeById.get(c.homeId)!, changes))}.`,
          due: today, source: 'Change order', owner: STAFF.coo, action: 'sign-amendment', ref: c.id,
        });
        log(e, `sent the price amendment for ${lot(c.homeId)} to Scott`, c.homeId);
        break;
      }
      case 'amendment.signed': {
        const c = changeById.get(e.changeId);
        if (!c) break;
        complete(`sign-${c.id}`, e.at);
        log(e, `signed the price amendment for ${lot(c.homeId)}`, c.homeId);
        break;
      }
      case 'closing.moved': {
        const h = homeById.get(e.homeId);
        if (!h || !h.closing || closingMoves[e.homeId]) break;
        closingMoves[e.homeId] = e.days;
        h.closing = addDays(h.closing, e.days);
        complete('t-coo-1', e.at);
        log(e, `moved the ${lot(e.homeId)} closing ${Math.round(e.days / 7)} weeks: ${e.reason}`, e.homeId);
        break;
      }
      case 'task.done': {
        const t = taskById.get(e.taskId);
        if (!t || t.status === 'done') break;
        complete(e.taskId, e.at);
        activity.push({ id: `a${activity.length + 1}`, at: e.at, who: t.owner, text: `finished: ${t.title.toLowerCase()}`, homeId: t.homeId });
        break;
      }
    }
  }

  return { today, homes, selections, changes, tasks, trades, updates, activity: activity.reverse(), closingMoves };
}

export const approvedExtras = (homeId: string, changes: Change[]) =>
  changes.filter((c) => c.homeId === homeId && c.status === 'approved').reduce((n, c) => n + (c.price ?? 0), 0);

export const approvedExtraCost = (homeId: string, changes: Change[]) =>
  changes.filter((c) => c.homeId === homeId && c.status === 'approved').reduce((n, c) => n + (c.cost ?? 0), 0);

export const finalPrice = (h: Home, changes: Change[]) =>
  (h.status === 'presold' ? h.contractPrice : h.listPrice) + approvedExtras(h.id, changes);

export type TodayGroups = { now: Task[]; week: Task[]; done: Task[] };

export function todayFor(state: State, role: RoleId): TodayGroups {
  const mine = state.tasks.filter((t) => t.role === role);
  const open = mine.filter((t) => t.status === 'open').sort((a, b) => a.due.localeCompare(b.due));
  const now = open.filter((t) => daysBetween(state.today, t.due) <= 1);
  const week = open.filter((t) => daysBetween(state.today, t.due) > 1 && daysBetween(state.today, t.due) <= 7);
  const done = mine.filter((t) => t.status === 'done').sort((a, b) => (b.doneOn ?? '').localeCompare(a.doneOn ?? ''));
  return { now, week, done };
}

export function homesFor(state: State, role: RoleId): Home[] {
  if (role === 'homeowner') return state.homes.filter((h) => h.id === DEMO_HOME_ID);
  if (role === 'realtor') return state.homes.filter((h) => h.realtor === STAFF.realtor);
  return state.homes;
}

export function changesFor(state: State, role: RoleId): Change[] {
  const ids = new Set(homesFor(state, role).map((h) => h.id));
  return state.changes.filter((c) => ids.has(c.homeId)).sort((a, b) => {
    const rank = (c: Change) => ({ requested: 0, priced: 1, approved: 2, declined: 3 })[c.status];
    return rank(a) - rank(b) || (b.decidedOn ?? b.requestedOn).localeCompare(a.decidedOn ?? a.requestedOn);
  });
}

export const STORY = [
  { role: 'designer' as RoleId, text: 'Designer confirms finish selections' },
  { role: 'homeowner' as RoleId, text: 'Homeowner requests a shower upgrade' },
  { role: 'designer' as RoleId, text: 'Designer prices it' },
  { role: 'homeowner' as RoleId, text: 'Homeowner approves in one tap' },
  { role: 'office' as RoleId, text: 'Office sees deposit and closing impact' },
  { role: 'pm' as RoleId, text: 'Project manager confirms the plumber' },
  { role: 'realtor' as RoleId, text: 'Realtor sends the price amendment' },
  { role: 'coo' as RoleId, text: 'Scott moves an at-risk closing' },
  { role: 'owner' as RoleId, text: 'Jeff runs a what-if on Money' },
];

/** Number of story steps completed, derived from the event record. */
export function storyProgress(events: DemoEvent[]): number {
  const has = (t: DemoEvent['type'], pred: (e: DemoEvent) => boolean = () => true) => events.some((e) => e.type === t && pred(e));
  const steps = [
    has('selections.confirmed'),
    has('change.requested'),
    has('change.priced'),
    has('change.approved'),
    has('adjustments.updated'),
    has('trade.confirmed'),
    has('amendment.sent'),
    has('closing.moved', (e) => e.type === 'closing.moved' && e.homeId === AT_RISK_HOME_ID),
  ];
  let n = 0;
  while (n < steps.length && steps[n]) n++;
  return n;
}

export const DEMO_CHANGE_ID = 'c-shower';

export const showerRequest = (at: string): DemoEvent => ({
  type: 'change.requested', changeId: DEMO_CHANGE_ID, homeId: DEMO_HOME_ID,
  title: SHOWER_CHANGE.title, detail: SHOWER_CHANGE.detail, room: SHOWER_CHANGE.room, at,
});
