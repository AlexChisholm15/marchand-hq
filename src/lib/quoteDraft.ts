/** Deterministic quote maths for illustrative, browser-local drafts. */
export type QuoteDraftLine = { id: string; label: string; qty: number; unit: number };
export const NS_DEMO_HST_RATE = 0.14;
const cents = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;
export function summarizeDraft(input: QuoteDraftLine[], rate = NS_DEMO_HST_RATE) {
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error('Invalid tax rate');
  const lines = input.filter(l =>
    !!l.label.trim() && Number.isInteger(l.qty) && l.qty > 0 && l.qty <= 999 &&
    Number.isFinite(l.unit) && l.unit >= 0 && l.unit <= 10000000);
  const subtotal = cents(lines.reduce((sum,l)=>sum+cents(l.qty*l.unit),0));
  const hst = cents(subtotal*rate);
  return { lines, subtotal, hst, total:cents(subtotal+hst) };
}
