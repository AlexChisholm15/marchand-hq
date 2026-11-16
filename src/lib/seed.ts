import type { Change, Community, Home, Selection, Task, TradeItem, Update } from './types.ts';
import { addDays } from './format.ts';
import { DEMO_BUYER, DEMO_HOME_ID, STAFF } from './people.ts';

// ALL buyers, streets, civic numbers, lots and dollar amounts here are SAMPLE DATA.
// Price and change-order magnitudes are modelled on typical Marchand closing adjustments
// (prices include HST, $20,000 deposit, numbered change orders).

export const STAGES = [
  'Sold',
  'Permit',
  'Foundation',
  'Framing',
  'Roof & windows',
  'Rough-ins',
  'Drywall',
  'Finishes',
  'Final walkthrough',
] as const;

const SPENT_SHARE = [0.03, 0.07, 0.18, 0.33, 0.46, 0.58, 0.7, 0.84, 0.96];

const PLANS = [
  { plan: 'The Simon', style: 'Bungalow', beds: 3, baths: 2, sqft: 1480 },
  { plan: 'The Ashby', style: 'Two storey', beds: 4, baths: 2.5, sqft: 2240 },
  { plan: 'The Belmont', style: 'Bungalow', beds: 3, baths: 2, sqft: 1620 },
  { plan: 'The Cabot', style: 'Two storey', beds: 4, baths: 3.5, sqft: 2580 },
  { plan: 'The Dunmore', style: 'Split entry', beds: 4, baths: 3, sqft: 2060 },
  { plan: 'The Everett', style: 'Bungalow', beds: 2, baths: 2, sqft: 1320 },
  { plan: 'The Fairhaven', style: 'Two storey', beds: 3, baths: 2.5, sqft: 1960 },
  { plan: 'The Glenmore', style: 'Bungalow', beds: 3, baths: 3, sqft: 1760 },
] as const;

const PLACES: { community: Community; streets: string[]; lot0: number }[] = [
  { community: 'Kinloch Estates', streets: ['Heather Glen Drive', 'Thistle Run'], lot0: 712 },
  { community: 'Indigo Shores', streets: ['Cobalt Court', 'Saffron Way'], lot0: 431 },
  { community: 'Truro', streets: ['Millbrook Lane'], lot0: 108 },
  { community: 'Bridgewater', streets: ['LaHave Ridge Road'], lot0: 21 },
];

const BUYERS = [
  DEMO_BUYER, 'Priya & Sam Desai', 'Grace & Daniel Kim', 'Owen & Tess Murray', 'Hannah Leblanc',
  'Marcus & Jade Fraser', 'Claire & Rob Dorey', 'Aiden & Mia Sutherland', 'Lucas Arsenault',
  'Emma & Noah Gallant', 'Ravi & Anjali Mehta', 'Sophie & Jack Hennessey', 'Wei & Lin Zhao',
  'Isabel & Tom Reardon', 'Caleb & Ruth Boudreau', 'Fatima & Omar Haddad', 'Megan & Luke Sampson',
  'Julia Thibodeau', 'Ian & Kate MacLellan', 'Zoe & Max Cormier', 'Andre & Lea Pellerin',
  'Brooke & Evan Delaney', 'Simone & Paul Aucoin', 'Nathan & Erin Gillis', 'Chloe & Ross Vance',
  'Mason & Ella Rafuse', 'Olivia & Henry Keddy', 'Tariq & Sara Nasser',
];

// Days from "today" to closing for the 28 presold homes. The first 10 land inside the 90-day forecast.
const CLOSING_IN = [62, 12, 19, 26, 33, 41, 48, 55, 69, 83, 104, 118, 131, 145, 152, 166, 180, 194, 208, 222, 236, 250, 264, 278, 292, 306, 320, 334];

const PRESOLD_PRICES = [
  874900, 902230, 768500, 949900, 712400, 835600, 889000, 796300, 921750, 684900,
  859900, 742800, 978500, 808200, 731600, 867400, 912300, 779900, 694500, 845100,
  956800, 723300, 887600, 801500, 765200, 934400, 818900, 749700,
];

// Spec (builder-owned) homes: stage and list price.
const SPEC = [
  { stage: 8, price: 829900 }, { stage: 8, price: 764900 }, { stage: 7, price: 899900 },
  { stage: 6, price: 719900 }, { stage: 5, price: 849900 }, { stage: 4, price: 789900 },
  { stage: 3, price: 939900 }, { stage: 2, price: 699900 }, { stage: 1, price: 869900 },
  { stage: 1, price: 744900 }, { stage: 0, price: 909900 },
];

const COST_RATIO = [0.77, 0.79, 0.76, 0.78, 0.8, 0.75, 0.78, 0.77];

export function stageForClosing(days: number): number {
  if (days <= 14) return 8;
  if (days <= 30) return 7;
  if (days <= 50) return 6;
  if (days <= 75) return 5;
  if (days <= 95) return 4;
  if (days <= 130) return 3;
  if (days <= 170) return 2;
  if (days <= 220) return 1;
  return 0;
}

export function createHomes(today: string): Home[] {
  const homes: Home[] = [];
  const total = 39;
  const counters = PLACES.map(() => 0);
  for (let i = 0; i < total; i++) {
    const presold = i < 28;
    const placeIdx = i === 0 ? 0 : [0, 1, 0, 1, 2, 0, 1, 3, 0, 1, 2, 1][i % 12];
    const place = PLACES[placeIdx];
    const n = counters[placeIdx]++;
    const street = place.streets[n % place.streets.length];
    const plan = PLANS[i === 0 ? 0 : (i * 3) % PLANS.length];
    const spec = presold ? null : SPEC[i - 28];
    const price = presold ? PRESOLD_PRICES[i] : spec!.price;
    const closingIn = presold ? CLOSING_IN[i] : null;
    const stage = presold ? stageForClosing(closingIn!) : spec!.stage;
    const cost = Math.round((price * COST_RATIO[i % COST_RATIO.length]) / 100) * 100;
    const pm = i === 0 || i % 3 === 1 ? STAFF.pm : i % 3 === 2 ? STAFF.pmB : STAFF.pmC;
    homes.push({
      id: `h${String(i + 1).padStart(2, '0')}`,
      lot: String(place.lot0 + n * 3 + (placeIdx === 0 ? 0 : 1)),
      civic: 20 + ((i * 37) % 180),
      street,
      community: place.community,
      plan: plan.plan,
      style: plan.style,
      beds: plan.beds,
      baths: plan.baths,
      sqft: plan.sqft,
      status: presold ? 'presold' : 'spec',
      stage,
      buyer: presold ? BUYERS[i] : null,
      realtor: presold ? STAFF.realtor : null,
      pm,
      designer: i % 2 === 0 ? STAFF.designerA : STAFF.designerB,
      contractPrice: presold ? price : 0,
      listPrice: price,
      deposit: presold ? 20000 : 0,
      closing: closingIn === null ? null : addDays(today, closingIn),
      cost,
      spent: Math.round((cost * SPENT_SHARE[stage]) / 100) * 100,
      behindWeeks: i === 4 ? 2 : 0,
    });
  }
  return homes;
}

export const AT_RISK_HOME_ID = 'h05';

export function createSelections(): Selection[] {
  const demo: [string, string][] = [
    ['Kitchen cabinets', 'Warm oak shaker, to ceiling'],
    ['Countertops', 'Calacatta quartz, eased edge'],
    ['Flooring', 'Wide-plank LVP, Harbour Oak'],
    ['Primary ensuite', 'Acrylic shower base, standard glass'],
    ['Lighting', '$3,000 allowance, pot lights in living room'],
  ];
  return demo.map(([room, choice], i) => ({
    id: `s${i + 1}`,
    homeId: DEMO_HOME_ID,
    room,
    choice,
    status: 'pending',
  }));
}

export function createChanges(today: string): Change[] {
  const c = (
    id: string, homeId: string, number: number, title: string, room: string, price: number, cost: number, ago: number,
  ): Change => ({
    id, homeId, number, title, detail: '', room, status: 'approved', price, cost,
    requestedOn: addDays(today, -ago - 6), pricedOn: addDays(today, -ago - 3), decidedOn: addDays(today, -ago),
  });
  return [
    c('c01', DEMO_HOME_ID, 1, 'Remove utility room window', 'Utility', -750, -400, 70),
    c('c02', DEMO_HOME_ID, 2, 'Upgraded trim package', 'Whole home', 4295, 2900, 44),
    c('c03', DEMO_HOME_ID, 3, 'Garage heater rough-in', 'Garage', 600, 380, 21),
    c('c04', 'h02', 11, 'Lighting allowance overage', 'Lighting', 537, 340, 9),
    c('c05', 'h02', 12, 'Quartz waterfall island', 'Kitchen', 7362, 4900, 5),
    c('c06', 'h03', 4, 'Pot lights, living room', 'Lighting', 1500, 900, 14),
    c('c07', 'h04', 6, 'Basement bathroom rough-in', 'Basement', 2200, 1450, 18),
    c('c08', 'h06', 3, 'Extended rear deck', 'Exterior', 4800, 3300, 11),
    c('c09', 'h07', 8, 'Ducted heat pump upgrade', 'Mechanical', 11577, 8200, 26),
    {
      id: 'c10', homeId: 'h09', number: null, title: 'Kitchen island extension', detail: 'Add 24 inches with seating overhang.',
      room: 'Kitchen', status: 'requested', price: null, cost: null, requestedOn: addDays(today, -1), pricedOn: null, decidedOn: null,
    },
  ];
}

export function createTasks(today: string): Task[] {
  const t = (
    id: string, role: Task['role'], homeId: string | null, title: string, detail: string, due: number,
    source: Task['source'], owner: string, action: Task['action'] = 'done', ref: string | null = null, done = false,
  ): Task => ({
    id, role, homeId, title, detail, due: addDays(today, due), source, owner, action, ref,
    status: done ? 'done' : 'open', doneOn: done ? addDays(today, due) : null,
  });
  return [
    // Jeff
    t('t-own-1', 'owner', null, 'Check the 90-day cash low point', 'Closings are bunched this quarter. See where cash bottoms out.', 0, 'Cash', STAFF.owner, 'open-money'),
    t('t-own-2', 'owner', 'h29', 'Spec home unsold 120 days: review price', 'Listed with no firm offer. Scott suggests a $15,000 reduction.', 2, 'Sales', STAFF.owner),
    t('t-own-3', 'owner', null, 'Approve Truro phase 2 servicing quote', 'Engineering estimate from Trevor. Needed before spring tender.', 5, 'Office', STAFF.owner),
    t('t-own-4', 'owner', null, 'Signed off October closings', '', -3, 'Closing', STAFF.owner, 'done', null, true),
    // Scott
    t('t-coo-1', 'coo', AT_RISK_HOME_ID, 'Closing at risk: drywall 2 weeks behind', 'Taper short-staffed. Move closing 3 weeks so the buyer can plan.', 0, 'Site', STAFF.coo, 'move-closing', AT_RISK_HOME_ID),
    t('t-coo-2', 'coo', 'h12', 'Sign offer: deposit is in', 'Offer from Chisholm Group. $20,000 deposit received by Sandy.', 1, 'Sales', STAFF.coo),
    t('t-coo-3', 'coo', 'h21', 'Confirm excavation start', 'Surveyor pins the house Wednesday. Excavator ready next week.', 3, 'Site', STAFF.coo),
    t('t-coo-4', 'coo', 'h03', 'Approved framing inspection', '', -1, 'Site', STAFF.coo, 'done', null, true),
    // Office
    t('t-off-1', 'office', 'h02', 'Closing package to lawyer', 'Closes in 12 days. Final adjustments signed.', 1, 'Closing', STAFF.business),
    t('t-off-2', 'office', 'h12', 'Verify $20,000 deposit receipt', 'Receipt sent by Chisholm Group. Match to bank.', 0, 'Office', STAFF.business),
    t('t-off-3', 'office', 'h21', 'Permit in: notify buyer\'s lawyer', 'Permit issued. Lawyer asked to be told.', 2, 'Office', STAFF.admin),
    t('t-off-4', 'office', 'h03', 'Filed executable agreement', '', -2, 'Office', STAFF.admin, 'done', null, true),
    // Designer
    t('t-des-1', 'designer', 'h09', 'Selections meeting: kitchen and countertops', 'Thursday 10:00 at the design centre.', 3, 'Selections', STAFF.designerA),
    t('t-des-2', 'designer', 'h03', 'Send final change order for signature', 'Closes in 19 days. Final adjustments go 2 to 4 weeks out.', 1, 'Change order', STAFF.designerA),
    t('t-des-3', 'designer', 'h05', 'Lighting selections booked', '', -1, 'Selections', STAFF.designerA, 'done', null, true),
    // Project manager
    t('t-pm-1', 'pm', 'h02', 'Pre-closing walkthrough', 'Buyer walkthrough with deficiency list.', 2, 'Site', STAFF.pm),
    t('t-pm-2', 'pm', 'h04', 'Book insulation inspection', 'Insulation complete Friday.', 1, 'Site', STAFF.pm),
    t('t-pm-3', 'pm', 'h07', 'Posted weekly site update', '', -1, 'Site', STAFF.pm, 'done', null, true),
    // Homeowner
    t('t-ho-1', 'homeowner', DEMO_HOME_ID, 'Pick a pre-drywall walkthrough time', 'Gerry will walk you through wiring and plumbing before drywall.', 4, 'Site', DEMO_BUYER),
    // Realtor
    t('t-rea-1', 'realtor', 'h21', 'Buyer asks: is the permit in?', 'Yes. Office confirmed this morning. Let the buyer know.', 0, 'Sales', STAFF.realtor),
    t('t-rea-2', 'realtor', 'h12', 'Deposit receipt sent to Sandy', '', -1, 'Office', STAFF.realtor, 'done', null, true),
  ];
}

export function createTrades(today: string): TradeItem[] {
  return [
    { id: 'tr1', homeId: 'h04', trade: 'Insulation', company: 'Bayside Insulation', scope: 'Blown attic and walls', neededBy: addDays(today, 3), status: 'ready', changeId: null },
    { id: 'tr2', homeId: AT_RISK_HOME_ID, trade: 'Drywall', company: 'Northline Drywall', scope: 'Board and tape, main floor', neededBy: addDays(today, 2), status: 'waiting', changeId: null },
    { id: 'tr3', homeId: 'h06', trade: 'Electrical', company: 'Brightway Electric', scope: 'Rough-in inspection prep', neededBy: addDays(today, 5), status: 'ready', changeId: null },
  ];
}

export function createUpdates(today: string): Update[] {
  return [
    { id: 'u1', homeId: DEMO_HOME_ID, date: addDays(today, -26), stage: 'Framing', note: 'Framing is complete and passed inspection. Roof trusses are on.', by: STAFF.pm, audience: 'homeowner' },
    { id: 'u2', homeId: DEMO_HOME_ID, date: addDays(today, -12), stage: 'Roof & windows', note: 'Shingles are on and windows are installed. The house is closed in.', by: STAFF.pm, audience: 'homeowner' },
    { id: 'u3', homeId: DEMO_HOME_ID, date: addDays(today, -3), stage: 'Rough-ins', note: 'Plumbing and electrical rough-ins started this week.', by: STAFF.pm, audience: 'homeowner' },
    { id: 'u4', homeId: AT_RISK_HOME_ID, date: addDays(today, -2), stage: 'Drywall', note: 'Taper crew short two people. Drywall finish running about two weeks late.', by: STAFF.pm, audience: 'team' },
  ];
}

export const SHOWER_CHANGE = {
  title: 'Tiled walk-in shower in ensuite',
  detail: 'Replace the acrylic base with a tiled curbless shower, linear drain and glass panel.',
  room: 'Primary ensuite',
  price: 4800,
  cost: 3100,
};
