'use client';

import { useState } from 'react';
import s from './screens.module.css';
import { Page } from '@/components/Shell';
import { Button, Empty, List, Pill, Row, Section, Sheet, Tabs, type Tone } from '@/components/ui';
import { useStore } from '@/lib/store';
import { changesFor, finalPrice, isSuperseded } from '@/lib/engine';
import { DEMO_HOME_ID, canSeeInternal } from '@/lib/people';
import { fmtDate, lotLabel, money } from '@/lib/format';
import type { Change, ChangeStatus } from '@/lib/types';
import { ApproveBlock, HomeLink, PriceForm, RequestBlock } from './TaskDetail';

export const changeTone = (st: ChangeStatus): Tone => ({ requested: 'amber', priced: 'accent', approved: 'green', declined: 'neutral' })[st] as Tone;
export const changeLabel = (st: ChangeStatus) => ({ requested: 'Needs price', priced: 'Awaiting buyer', approved: 'Approved', declined: 'Declined' })[st];

export function ChangeSheetBody({ change, onDone }: { change: Change; onDone?: () => void }) {
  const { state, role } = useStore();
  const home = state.homes.find((h) => h.id === change.homeId)!;
  const internal = canSeeInternal(role);
  const revises = change.supersedes ? state.changes.find((c) => c.id === change.supersedes) : undefined;
  const supersededBy = state.changes.find((c) => c.supersedes === change.id && c.status === 'approved');
  const nextTask = state.tasks.find((t) => t.ref === change.id && t.status === 'open');
  return (
    <div>
      <div className={s.detailTop}>
        <Pill tone={changeTone(change.status)}>{changeLabel(change.status)}</Pill>
        {change.number && <Pill>CO #{change.number}</Pill>}
        {supersededBy && <Pill tone="neutral">Superseded by CO #{supersededBy.number}</Pill>}
      </div>
      <h2 className={s.detailTitle}>{change.title}</h2>
      {change.detail && <p className={s.detailText}>{change.detail}</p>}
      {revises && <p className={s.note}>Revises {revises.number ? `CO #${revises.number}` : revises.title}{revises.price !== null ? ` (${money(revises.price)})` : ''}.</p>}
      {role !== 'homeowner' && <HomeLink home={home} />}
      <div className={s.box}>
        <div className={s.kv}><span>Room</span><span>{change.room}</span></div>
        <div className={s.kv}><span>Requested</span><span>{fmtDate(change.requestedOn)}</span></div>
        {change.spec && <div className={s.kv}><span>Install spec</span><span>{change.spec.finish} · {change.spec.size} · {change.spec.location}</span></div>}
        {change.price !== null && <div className={`${s.kv} ${s.kvStrong}`}><span>Price incl. HST</span><span>{money(change.price)}</span></div>}
        {internal && change.cost !== null && <div className={s.kv}><span>Cost to Marchand</span><span>{money(change.cost)}</span></div>}
        {internal && change.cost !== null && change.price !== null && <div className={s.kv}><span>Margin</span><span>{money(change.price - change.cost)}</span></div>}
        {change.status === 'approved' && !supersededBy && <div className={s.kv}><span>Home final price</span><span>{money(finalPrice(home, state.changes))}</span></div>}
        {internal && nextTask && <div className={s.kv}><span>Next step</span><span>{nextTask.owner}</span></div>}
      </div>
      {change.status === 'requested' && role === 'designer' && <PriceForm change={change} onDone={onDone} />}
      {change.status === 'priced' && role === 'homeowner' && <ApproveBlock change={change} home={home} onDone={onDone} />}
      {change.status === 'requested' && role !== 'designer' && <p className={s.note}>Waiting on {home.designer} to price it.</p>}
      {change.status === 'priced' && role !== 'homeowner' && <p className={s.note}>Waiting on the buyer to approve.</p>}
    </div>
  );
}

type Filter = 'open' | 'approved' | 'all';

export function Changes() {
  const { state, role } = useStore();
  const [filter, setFilter] = useState<Filter>('open');
  const [open, setOpen] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const all = changesFor(state, role);
  const list = all.filter((c) => filter === 'all' || (filter === 'open' ? c.status === 'requested' || c.status === 'priced' : c.status === 'approved'));
  const change = state.changes.find((c) => c.id === open) ?? null;
  const homeowner = role === 'homeowner';
  const openCount = all.filter((c) => c.status === 'requested' || c.status === 'priced').length;

  return (
    <Page title="Changes" sub={homeowner ? 'Upgrades and changes to your home' : `${openCount} open · selections, pricing and approvals`}>
      <div className={s.filters}>
        <Tabs tabs={[{ id: 'open', label: `Open (${openCount})` }, { id: 'approved', label: 'Approved' }, { id: 'all', label: 'All' }]} value={filter} onChange={setFilter} label="Filter changes" />
        {homeowner && <Button variant="primary" block onClick={() => setAsking(true)}>Request a change</Button>}
      </div>
      <Section title={filter === 'open' ? 'Open' : filter === 'approved' ? 'Approved' : 'All changes'} count={list.length}>
        <List label="Changes">
          {list.length ? (
            list.map((c) => {
              const h = state.homes.find((x) => x.id === c.homeId)!;
              return (
                <Row
                  key={c.id}
                  title={`${c.number ? `CO #${c.number} · ` : ''}${c.title}`}
                  meta={homeowner ? c.room : `${lotLabel(h)} · ${h.buyer ?? 'Spec'} · ${c.room}`}
                  side={<Pill tone={changeTone(c.status)}>{changeLabel(c.status)}</Pill>}
                  sideSub={<span className="num">{c.price !== null ? money(c.price) : fmtDate(c.requestedOn)}</span>}
                  onClick={() => setOpen(c.id)}
                />
              );
            })
          ) : (
            <Empty
              title={filter === 'open' ? 'No open changes.' : 'Nothing here yet.'}
              next={homeowner ? 'Want an upgrade? Request a change and your designer will price it.' : 'New requests from buyers land here first.'}
            />
          )}
        </List>
      </Section>
      <Sheet open={!!change} title={change?.number ? `Change order #${change.number}` : 'Change request'} onClose={() => setOpen(null)}>
        {change && <ChangeSheetBody change={change} onDone={() => setOpen(null)} />}
      </Sheet>
      <Sheet open={asking} title="Request a change" onClose={() => setAsking(false)}>
        <p className={s.detailText}>Your designer prices it and you approve before anything changes.</p>
        <RequestBlock homeId={DEMO_HOME_ID} onDone={() => setAsking(false)} />
      </Sheet>
    </Page>
  );
}
