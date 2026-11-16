import type { Change, Home } from './types.ts';
import { addDays, daysBetween } from './format.ts';
import { approvedExtraCost, finalPrice } from './engine.ts';

// Deterministic. No AI produces or edits any number here. All inputs are sample assumptions.
export const ASSUMPTIONS = {
  openingCash: 1_600_000,
  reserveFloor: 750_000,
  creditLine: 6_000_000,
  loanShare: 0.65,
  overheadWeekly: 50_000,
  loanRate: 0.0725,
  weeks: 13,
};

export type Assumptions = typeof ASSUMPTIONS;

export const ASSUMPTION_NOTES: { label: string; value: (a: Assumptions) => string; note: string }[] = [
  { label: 'Opening cash', value: (a) => `$${(a.openingCash / 1e6).toFixed(1)}M`, note: 'Bank balance today. Sample figure.' },
  { label: 'Reserve floor', value: (a) => `$${a.reserveFloor / 1000}K`, note: 'Cash Jeff never wants to go below.' },
  { label: 'Line of credit', value: (a) => `$${a.creditLine / 1e6}M undrawn`, note: 'Counted in liquidity only. Never shown as cash.' },
  { label: 'Construction loans', value: (a) => `${Math.round(a.loanShare * 100)}% of cost`, note: 'Bank funds this share of build cost. Paid off from the buyer\'s funds at closing.' },
  { label: 'Builder cash spend', value: (a) => `${Math.round((1 - a.loanShare) * 100)}% of remaining cost`, note: 'Spread evenly until the home is finished.' },
  { label: 'Loan interest', value: (a) => `${(a.loanRate * 100).toFixed(2)}% a year`, note: 'On loan drawn to date, paid weekly.' },
  { label: 'Overhead', value: (a) => `$${a.overheadWeekly / 1000}K a week`, note: 'Salaries, office, vehicles, insurance.' },
  { label: 'Closings', value: () => 'Final price less $20K deposit', note: 'Final price includes approved change orders and HST. Deposits were received at signing, so they are never counted twice.' },
  { label: 'Spec homes', value: () => 'No sale assumed', note: 'Builder-owned homes carry costs but bring in nothing until sold.' },
];

export type Week = {
  index: number;
  start: string;
  receipts: number;
  debtRepaid: number;
  spend: number;
  interest: number;
  overhead: number;
  net: number;
  cash: number;
};

export type ClosingRow = {
  homeId: string;
  date: string;
  originalDate: string;
  finalPrice: number;
  receipts: number;
  debtRepaid: number;
  margin: number;
};

export type Forecast = {
  weeks: Week[];
  closings: ClosingRow[];
  lowest: Week;
  breach: Week | null;
  grossReceipts: number;
  debtRepayment: number;
  netCashFlow: number;
  endingCash: number;
  liquidity: number;
  grossMargin: number;
  totalSpend: number;
  totalOverhead: number;
  totalInterest: number;
};

/**
 * @param shifts what-if closing moves in days, keyed by home id (on top of moves already in the event record)
 */
export function forecast(
  today: string,
  homes: Home[],
  changes: Change[],
  shifts: Record<string, number> = {},
  a: Assumptions = ASSUMPTIONS,
): Forecast {
  const horizon = a.weeks * 7;
  const weeks: Week[] = Array.from({ length: a.weeks }, (_, i) => ({
    index: i, start: addDays(today, i * 7), receipts: 0, debtRepaid: 0, spend: 0, interest: 0, overhead: a.overheadWeekly, net: 0, cash: 0,
  }));
  const weekOf = (date: string) => Math.floor(daysBetween(today, date) / 7);
  const closings: ClosingRow[] = [];

  for (const h of homes) {
    const extraCost = approvedExtraCost(h.id, changes);
    const totalCost = h.cost + extraCost;
    const remaining = Math.max(0, totalCost - h.spent);
    const loanPayoff = Math.round(totalCost * a.loanShare);
    const closingDate = h.closing ? addDays(h.closing, shifts[h.id] ?? 0) : null;
    const finishWeek = closingDate
      ? Math.max(1, weekOf(closingDate))
      : Math.max(1, (9 - h.stage) * 4);

    // Builder cash spend on remaining work, evenly to completion.
    const cashShare = remaining * (1 - a.loanShare);
    const spendWeeks = Math.min(finishWeek, a.weeks);
    for (let w = 0; w < spendWeeks; w++) weeks[w].spend += cashShare / finishWeek;

    // Interest on loan drawn to date until the home closes (or the horizon ends).
    const drawn = h.spent * a.loanShare;
    const lastInterestWeek = closingDate ? Math.min(weekOf(closingDate), a.weeks) : a.weeks;
    for (let w = 0; w < lastInterestWeek; w++) {
      const progress = Math.min(1, (w + 1) / finishWeek);
      const loan = drawn + (loanPayoff - drawn) * progress;
      weeks[w].interest += (loan * a.loanRate) / 52;
    }

    if (closingDate && h.status === 'presold') {
      const d = daysBetween(today, closingDate);
      if (d >= 0 && d < horizon) {
        const price = finalPrice(h, changes);
        const receipts = price - h.deposit;
        const w = weekOf(closingDate);
        weeks[w].receipts += receipts;
        weeks[w].debtRepaid += loanPayoff;
        closings.push({
          homeId: h.id, date: closingDate, originalDate: h.closing!, finalPrice: price, receipts,
          debtRepaid: loanPayoff, margin: price - totalCost,
        });
      }
    }
  }

  let cash = a.openingCash;
  for (const w of weeks) {
    w.spend = Math.round(w.spend);
    w.interest = Math.round(w.interest);
    w.net = w.receipts - w.debtRepaid - w.spend - w.interest - w.overhead;
    cash += w.net;
    w.cash = cash;
  }

  const sum = (k: keyof Week) => weeks.reduce((n, w) => n + (w[k] as number), 0);
  const lowest = weeks.reduce((m, w) => (w.cash < m.cash ? w : m), weeks[0]);
  const endingCash = weeks[weeks.length - 1].cash;
  closings.sort((x, y) => x.date.localeCompare(y.date));

  return {
    weeks,
    closings,
    lowest,
    breach: weeks.find((w) => w.cash < a.reserveFloor) ?? null,
    grossReceipts: sum('receipts'),
    debtRepayment: sum('debtRepaid'),
    netCashFlow: endingCash - a.openingCash,
    endingCash,
    liquidity: endingCash + a.creditLine,
    grossMargin: closings.reduce((n, c) => n + c.margin, 0),
    totalSpend: sum('spend'),
    totalOverhead: sum('overhead'),
    totalInterest: sum('interest'),
  };
}
