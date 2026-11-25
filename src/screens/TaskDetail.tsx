'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import s from './screens.module.css';
import { Button, Field, Pill, inputClass, type Tone } from '@/components/ui';
import { useStore } from '@/lib/store';
import { DEMO_CHANGE_ID, approvedExtras, finalPrice, showerRequest } from '@/lib/engine';
import { forecast } from '@/lib/finance';
import { SHOWER_CHANGE, STAGES } from '@/lib/seed';
import { addDays, daysBetween, fmtDate, fmtDateLong, homeLabel, money, moneyShort, relDue } from '@/lib/format';
import type { Change, DemoEvent, Home, State, Task } from '@/lib/types';

export function dueTone(today: string, due: string): Tone {
  const n = daysBetween(today, due);
  if (n < 0) return 'red';
  if (n === 0) return 'amber';
  return 'neutral';
}

export function HomeLink({ home }: { home: Home }) {
  return (
    <Link href={`/homes/${home.id}`} className={s.homeLink}>
      <span className={s.homeLinkText}>
        {homeLabel(home)}
        <span>
          {home.plan} · {home.community} · {STAGES[home.stage]}
        </span>
      </span>
      <ChevronRight size={16} aria-hidden style={{ color: 'var(--text-3)' }} />
    </Link>
  );
}

function KV({ rows }: { rows: [string, string, ('strong' | 'new')?][] }) {
  return (
    <div className={s.box}>
      {rows.map(([k, v, tone]) => (
        <div key={k} className={`${s.kv} ${tone === 'strong' ? s.kvStrong : ''} ${tone === 'new' ? s.kvNew : ''}`}>
          <span>{k}</span>
          <span>{v}</span>
        </div>
      ))}
    </div>
  );
}

const coRange = (state: State, homeId: string) => {
  const nums = state.changes.filter((c) => c.homeId === homeId && c.status === 'approved' && c.number).map((c) => c.number!);
  return nums.length ? `1 to ${Math.max(...nums)}` : 'none';
};

export function PriceForm({ change, onDone }: { change: Change; onDone?: () => void }) {
  const { dispatch, state } = useStore();
  const preset = change.id === DEMO_CHANGE_ID;
  const [price, setPrice] = useState(preset ? String(SHOWER_CHANGE.price) : '');
  const [cost, setCost] = useState(preset ? String(SHOWER_CHANGE.cost) : '');
  const p = Number(price.replace(/[^0-9.-]/g, ''));
  const c = Number(cost.replace(/[^0-9.-]/g, ''));
  const valid = p > 0 && c >= 0;
  return (
    <>
      <Field label="Price to homeowner, including HST">
        <input className={inputClass} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$0" />
      </Field>
      <Field label="Cost to Marchand (internal, never shown to buyers)">
        <input className={inputClass} inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="$0" />
      </Field>
      {valid && <p className={s.detailText}>Margin {money(p - c)} · {Math.round(((p - c) / p) * 100)}%</p>}
      <div className={s.actions}>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() => {
            dispatch({ type: 'change.priced', changeId: change.id, price: p, cost: c, at: state.today });
            onDone?.();
          }}
        >
          Send price to homeowner
        </Button>
      </div>
    </>
  );
}

export function ApproveBlock({ change, home, onDone }: { change: Change; home: Home; onDone?: () => void }) {
  const { dispatch, state } = useStore();
  const now = finalPrice(home, state.changes);
  const revises = change.supersedes ? state.changes.find((c) => c.id === change.supersedes) : undefined;
  return (
    <>
      {revises && (
        <p className={s.note}>This replaces {revises.number ? `CO #${revises.number}` : revises.title}{revises.price !== null ? ` (${money(revises.price)})` : ''} if you approve it.</p>
      )}
      {change.spec && (
        <KV rows={[['Install spec', `${change.spec.finish} · ${change.spec.size} · ${change.spec.location}`]]} />
      )}
      <KV
        rows={[
          ['This change', money(change.price ?? 0), 'strong'],
          ['Your price today', money(now)],
          ['New final price', money(now + (change.price ?? 0)), 'new'],
          ['Closing date', home.closing ? fmtDateLong(home.closing) : 'Not set'],
        ]}
      />
      <p className={s.detailText}>Paid at closing with your final balance. Nothing to pay today.</p>
      <div className={s.actions}>
        <Button variant="primary" onClick={() => { dispatch({ type: 'change.approved', changeId: change.id, at: state.today }); onDone?.(); }}>
          Approve {money(change.price ?? 0)}
        </Button>
        <Button onClick={() => { dispatch({ type: 'change.declined', changeId: change.id, at: state.today }); onDone?.(); }}>Not now</Button>
      </div>
    </>
  );
}

export function RequestBlock({ homeId, onDone }: { homeId: string; onDone?: () => void }) {
  const { dispatch, state } = useStore();
  const [custom, setCustom] = useState(false);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const asked = state.changes.some((c) => c.id === DEMO_CHANGE_ID);
  const send = (e: DemoEvent) => { dispatch(e); onDone?.(); };
  return (
    <>
      {!asked && !custom && (
        <button type="button" className={s.suggest} onClick={() => send(showerRequest(state.today))}>
          <strong>Upgrade: {SHOWER_CHANGE.title.toLowerCase()}</strong>
          <span>{SHOWER_CHANGE.detail}</span>
        </button>
      )}
      {(custom || asked) && (
        <>
          <Field label="What would you like to change?">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Add pot lights in the bedroom" data-autofocus />
          </Field>
          <Field label="Details (optional)">
            <textarea className={inputClass} value={detail} onChange={(e) => setDetail(e.target.value)} />
          </Field>
        </>
      )}
      <div className={s.actions}>
        {custom || asked ? (
          <Button
            variant="primary"
            disabled={title.trim().length < 3}
            onClick={() => send({ type: 'change.requested', changeId: `c-${Date.now()}`, homeId, title: title.trim(), detail: detail.trim(), room: 'General', at: state.today })}
          >
            Send to designer
          </Button>
        ) : (
          <>
            <Button variant="primary" onClick={() => send(showerRequest(state.today))}>Request shower upgrade</Button>
            <Button onClick={() => setCustom(true)}>Something else</Button>
          </>
        )}
      </div>
    </>
  );
}

export function TaskDetail({ task, onDone }: { task: Task; onDone?: () => void }) {
  const { state, dispatch, role } = useStore();
  const router = useRouter();
  const home = task.homeId ? state.homes.find((h) => h.id === task.homeId) ?? null : null;
  const change = task.ref ? state.changes.find((c) => c.id === task.ref) ?? null : null;
  const trade = task.ref ? state.trades.find((t) => t.id === task.ref) ?? null : null;
  const done = task.status === 'done';
  const at = state.today;
  const fire = (e: DemoEvent) => { dispatch(e); onDone?.(); };
  const openHome = home ? <Button onClick={() => router.push(`/homes/${home.id}`)}>Open home</Button> : null;

  let body: ReactNode = null;
  let actions: ReactNode = null;

  if (!done) {
    switch (task.action) {
      case 'confirm-selections': {
        const sel = state.selections.filter((x) => x.homeId === task.ref);
        body = <KV rows={sel.map((x) => [x.room, x.choice] as [string, string])} />;
        actions = (
          <>
            <Button variant="primary" onClick={() => fire({ type: 'selections.confirmed', homeId: task.ref!, at })}>Confirm selections</Button>
            {openHome}
          </>
        );
        break;
      }
      case 'request-change':
        body = <RequestBlock homeId={task.ref!} onDone={onDone} />;
        break;
      case 'price-change':
        if (change) {
          body = (
            <>
              <div className={s.quote}>{change.title}{change.detail ? `. ${change.detail}` : ''}</div>
              <div className={s.actions}>
                <Button
                  variant="primary"
                  onClick={() => { onDone?.(); router.push(`/studio?tab=quote&home=${change.homeId}&link=${change.id}`); }}
                >
                  Build a linked quote in Quote Studio
                </Button>
              </div>
              <p className={s.note}>Or price it directly, without a structured install spec:</p>
              <PriceForm change={change} onDone={onDone} />
            </>
          );
        }
        break;
      case 'approve-change':
        if (change && home) body = <ApproveBlock change={change} home={home} onDone={onDone} />;
        break;
      case 'update-adjustments':
        if (home && change) {
          const fp = finalPrice(home, state.changes);
          body = (
            <KV
              rows={[
                ['Source change', `${change.number ? `CO #${change.number} · ` : ''}${change.title}`],
                ['Contract price', money(home.contractPrice)],
                [`Change orders ${coRange(state, home.id)}`, money(approvedExtras(home.id, state.changes))],
                ['Final price', money(fp), 'strong'],
                ['Deposit on file', money(home.deposit)],
                ['Balance due at closing', money(fp - home.deposit), 'new'],
                ['Closing date', fmtDateLong(home.closing!)],
              ]}
            />
          );
          actions = <><Button variant="primary" onClick={() => fire({ type: 'adjustments.updated', changeId: change.id, at })}>Mark adjustments updated</Button>{openHome}</>;
        }
        break;
      case 'confirm-trade':
        if (trade) {
          const tradeChange = trade.changeId ? state.changes.find((c) => c.id === trade.changeId) : null;
          body = (
            <>
              {tradeChange?.spec && home && (
                <KV
                  rows={[
                    ['Lot', `Lot ${home.lot}`],
                    ['Location', tradeChange.spec.location],
                    ['Approved spec', `${tradeChange.spec.finish} · ${tradeChange.spec.size}`],
                    ['Revision', tradeChange.number ? `CO #${tradeChange.number}` : 'Not yet numbered'],
                    ['Approved', tradeChange.decidedOn ? fmtDate(tradeChange.decidedOn) : '—'],
                  ]}
                />
              )}
              <KV rows={[['Trade', `${trade.trade} · ${trade.company}`], ['Work', trade.scope], ['Needed by', fmtDate(trade.neededBy, true)], ['Status', trade.status === 'ready' ? 'Ready' : 'Waiting on confirmation']]} />
            </>
          );
          actions = <><Button variant="primary" onClick={() => fire({ type: 'trade.confirmed', tradeId: trade.id, at })}>{trade.trade} confirmed</Button>{openHome}</>;
        }
        break;
      case 'prepare-amendment':
      case 'sign-amendment':
        if (home && change) {
          body = (
            <div className={s.quote}>
              Amendment to the Agreement of Purchase and Sale, {homeLabel(home)}: purchase price to be {money(finalPrice(home, state.changes))} to reflect
              signed change orders {coRange(state, home.id)}. All other terms unchanged.
            </div>
          );
          actions =
            task.action === 'prepare-amendment' ? (
              <><Button variant="primary" onClick={() => fire({ type: 'amendment.sent', changeId: change.id, at })}>Send to Scott to sign</Button>{openHome}</>
            ) : (
              <><Button variant="primary" onClick={() => fire({ type: 'amendment.signed', changeId: change.id, at })}>Sign amendment</Button>{openHome}</>
            );
        }
        break;
      case 'move-closing':
        if (home?.closing) {
          body = (
            <KV
              rows={[
                ['Buyer', home.buyer ?? ''],
                ['Closing now', fmtDateLong(home.closing)],
                ['Proposed', fmtDateLong(addDays(home.closing, 21)), 'new'],
                ['Stage', `${STAGES[home.stage]} · ${home.behindWeeks} weeks behind`],
              ]}
            />
          );
          actions = (
            <>
              <Button variant="primary" onClick={() => fire({ type: 'closing.moved', homeId: home.id, days: 21, reason: 'drywall running late', at })}>Move closing 3 weeks</Button>
              <Button onClick={() => fire({ type: 'task.done', taskId: task.id, at })}>Keep the date</Button>
            </>
          );
        }
        break;
      case 'open-money': {
        const f = forecast(state.today, state.homes, state.changes);
        body = <KV rows={[['Lowest cash in 90 days', `${moneyShort(f.lowest.cash)} · week of ${fmtDate(f.lowest.start)}`, 'strong'], ['Closings in 90 days', String(f.closings.length)]]} />;
        actions = <><Button variant="primary" onClick={() => { onDone?.(); router.push('/money'); }}>Open Money</Button><Button onClick={() => fire({ type: 'task.done', taskId: task.id, at })}>Mark done</Button></>;
        break;
      }
      default:
        actions = <><Button variant="primary" onClick={() => fire({ type: 'task.done', taskId: task.id, at })}>Mark done</Button>{openHome}</>;
    }
  }

  return (
    <div>
      <div className={s.detailTop}>
        <Pill tone="accent">{task.source}</Pill>
        {done ? <Pill tone="green">Done {task.doneOn ? relDue(state.today, task.doneOn).toLowerCase() : ''}</Pill> : <Pill tone={dueTone(state.today, task.due)}>Due {relDue(state.today, task.due).toLowerCase()}</Pill>}
      </div>
      <h2 className={s.detailTitle}>{task.title}</h2>
      {task.detail && <p className={s.detailText}>{task.detail}</p>}
      {home && role !== 'homeowner' && <HomeLink home={home} />}
      {body}
      {actions && <div className={s.actions}>{actions}</div>}
      {done && home && <div className={s.actions}>{openHome}</div>}
    </div>
  );
}
