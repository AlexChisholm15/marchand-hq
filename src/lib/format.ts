const DAY = 86_400_000;

const toUTC = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));

export const addDays = (iso: string, days: number): string =>
  new Date(toUTC(iso) + days * DAY).toISOString().slice(0, 10);

export const daysBetween = (from: string, to: string): number => Math.round((toUTC(to) - toUTC(from)) / DAY);

export const localToday = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const fmtDate = (iso: string, withDay = false): string => {
  const d = new Date(toUTC(iso));
  const base = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  return withDay ? `${DAYS[d.getUTCDay()]}, ${base}` : base;
};

export const fmtDateLong = (iso: string): string => {
  const d = new Date(toUTC(iso));
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};

export const relDue = (today: string, due: string): string => {
  const n = daysBetween(today, due);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n < 0) return `${-n} days late`;
  if (n < 7) return DAYS[new Date(toUTC(due)).getUTCDay()];
  return fmtDate(due);
};

export const money = (n: number): string =>
  (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-CA');

export const moneyShort = (n: number): string => {
  const a = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(a >= 10_000_000 ? 1 : 2).replace(/\.?0+$/, '')}M`;
  if (a >= 10_000) return `${sign}$${Math.round(a / 1000)}K`;
  return money(n);
};

export const homeLabel = (h: { lot: string; street: string; civic: number }) => `Lot ${h.lot} · ${h.civic} ${h.street}`;
export const lotLabel = (h: { lot: string }) => `Lot ${h.lot}`;
