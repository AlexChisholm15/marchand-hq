'use client';

import { useMemo } from 'react';
import s from './screens.module.css';
import { Page } from '@/components/Shell';
import { Button, List, Section, Stat } from '@/components/ui';
import { useStore } from '@/lib/store';
import { ASSUMPTIONS, ASSUMPTION_NOTES, forecast } from '@/lib/finance';
import { addDays, fmtDate, lotLabel, money, moneyShort } from '@/lib/format';
import { CashChart } from './CashChart';

const SHIFTS = [0, 14, 28, 42];
const shiftLabel = (d: number) => (d === 0 ? 'On time' : `+${d / 7} wk`);

export function Money() {
  const { state, whatIf, setWhatIf, events } = useStore();
  const shifted = Object.values(whatIf).filter((d) => d > 0).length;
  const base = useMemo(() => forecast(state.today, state.homes, state.changes), [state]);
  const f = useMemo(() => (shifted ? forecast(state.today, state.homes, state.changes, whatIf) : base), [state, whatIf, shifted, base]);
  const homeOf = (id: string) => state.homes.find((h) => h.id === id)!;
  const a = ASSUMPTIONS;

  // Everything in the shared event record that moved cash.
  const movers = events.flatMap((e) => {
    if (e.type === 'change.approved') {
      const c = state.changes.find((x) => x.id === e.changeId);
      if (!c || c.price === null) return [];
      return [{ key: e.changeId, text: `CO #${c.number} approved, ${lotLabel(homeOf(c.homeId))}`, effect: `+${money(c.price)} at closing` }];
    }
    if (e.type === 'closing.moved') {
      const h = homeOf(e.homeId);
      return [{ key: `m-${e.homeId}`, text: `${lotLabel(h)} closing moved ${Math.round(e.days / 7)} weeks`, effect: `now ${fmtDate(h.closing!)}` }];
    }
    return [];
  });

  // All closings in the 90-day window, using the un-shifted calendar so moved rows stay put.
  const rows = base.closings;
  const delayBiggest = () => {
    const big = [...rows].sort((x, y) => y.finalPrice - x.finalPrice).slice(0, 3);
    setWhatIf(Object.fromEntries(big.map((c) => [c.homeId, 28])));
  };

  const lowTone = f.lowest.cash < a.reserveFloor ? 'red' : f.lowest.cash < a.reserveFloor * 1.4 ? 'amber' : undefined;

  return (
    <Page title="Money" sub="Cash for the next 90 days · sample numbers">
      <div className={s.stats}>
        <Stat label="Cash today" value={moneyShort(a.openingCash)} note="Bank balance. Sample." />
        <Stat label="Lowest cash, 90 days" value={moneyShort(f.lowest.cash)} tone={lowTone} note={`Week of ${fmtDate(f.lowest.start)}`} />
        <Stat label="Reserve floor" value={moneyShort(a.reserveFloor)} note="Never go below" />
        <Stat
          label="First breach"
          value={f.breach ? fmtDate(f.breach.start) : 'None'}
          tone={f.breach ? 'red' : 'green'}
          note={f.breach ? `Short ${moneyShort(a.reserveFloor - f.lowest.cash)} at the low` : 'Clears the floor all 13 weeks'}
        />
      </div>

      <div className={s.chartCard}>
        <CashChart f={f} base={shifted ? base : null} opening={a.openingCash} reserve={a.reserveFloor} />
        <div className={s.legend}>
          <span><i style={{ borderColor: 'var(--accent)' }} />Cash in bank{shifted ? ', with what-if' : ''}</span>
          {shifted > 0 && <span><i style={{ borderColor: 'var(--text-3)', borderTopStyle: 'dotted' }} />Plan</span>}
          <span><i style={{ borderColor: 'var(--red)', borderTopStyle: 'dashed' }} />Reserve floor</span>
        </div>
      </div>

      {movers.length > 0 && (
        <Section title="What moved the forecast" count={movers.length}>
          <List>
            {movers.map((m) => (
              <div key={m.key} className={s.def}><strong>{m.text}</strong><span>{m.effect}</span></div>
            ))}
          </List>
        </Section>
      )}

      <Section
        title="Closings in the next 90 days"
        count={rows.length}
        action={
          <div className={s.toolbar}>
            {shifted ? <Button variant="ghost" onClick={() => setWhatIf({})}>Clear what-if</Button> : <Button variant="ghost" onClick={delayBiggest}>Delay 3 biggest</Button>}
          </div>
        }
      >
        <p className={s.note} style={{ margin: '0 4px 8px' }}>What-if: move any closing and the forecast updates instantly. Nothing is saved to the real schedule.</p>
        <List label="Closings">
          {rows.map((c) => {
            const h = homeOf(c.homeId);
            const d = whatIf[c.homeId] ?? 0;
            return (
              <div key={c.homeId} className={s.closing}>
                <div className={s.closingHead}>
                  <div>
                    <div className={s.closingTitle}>{fmtDate(addDays(c.date, d), true)} · {lotLabel(h)}</div>
                    <div className={s.closingMeta}>
                      {h.buyer} · {money(c.finalPrice)}
                      {d > 0 && <span className={s.moved}> · moved from {fmtDate(c.date)}</span>}
                    </div>
                  </div>
                  <div className={`${s.closingMeta} num`} style={{ textAlign: 'right' }}>
                    Net to cash
                    <br />
                    <span style={{ color: 'var(--text)', fontSize: 14 }}>{moneyShort(c.receipts - c.debtRepaid)}</span>
                  </div>
                </div>
                <div className={s.seg} role="radiogroup" aria-label={`Move ${lotLabel(h)} closing`}>
                  {SHIFTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={d === n}
                      className={`${s.segBtn} ${d === n ? s.segOn : ''}`}
                      onClick={() => setWhatIf({ ...whatIf, [c.homeId]: n })}
                    >
                      {shiftLabel(n)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </List>
      </Section>

      <Section title="What each number means">
        <List>
          {[
            ['Gross receipts', money(f.grossReceipts), 'Money from buyers at closing: final price less the $20K deposit already received.'],
            ['Debt repayment', money(f.debtRepayment), 'Construction loans paid off at those closings. Not profit.'],
            ['Build spend, interest, overhead', money(f.totalSpend + f.totalInterest + f.totalOverhead), `Builder share of remaining build cost, loan interest, and ${moneyShort(a.overheadWeekly)} a week overhead.`],
            ['Net cash flow', money(f.netCashFlow), 'Receipts minus debt repayment minus all spending over 13 weeks.'],
            ['Available cash at day 90', money(f.endingCash), 'Bank balance at the end of the window.'],
            ['Liquidity', money(f.liquidity), `Available cash plus the ${moneyShort(a.creditLine)} undrawn line of credit.`],
            ['Gross margin on these closings', money(f.grossMargin), 'Final price less build cost. Before overhead and interest. This is profit, not cash.'],
          ].map(([k, v, note]) => (
            <div key={k} className={s.def}>
              <div className={s.closingHead}><strong>{k}</strong><span className="num">{v}</span></div>
              <span>{note}</span>
            </div>
          ))}
        </List>
      </Section>

      <Section title="Assumptions" collapsible defaultOpen={false}>
        <List>
          {ASSUMPTION_NOTES.map((n) => (
            <div key={n.label} className={s.def}>
              <div className={s.closingHead}><strong>{n.label}</strong><span>{n.value(a)}</span></div>
              <span>{n.note}</span>
            </div>
          ))}
        </List>
        <p className={s.note}>Every figure comes from these rules. Nothing is estimated by AI. Sample data, not Marchand&apos;s books.</p>
      </Section>
    </Page>
  );
}
