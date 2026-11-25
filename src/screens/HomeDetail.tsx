'use client';

import { useState } from 'react';
import s from './screens.module.css';
import { Page } from '@/components/Shell';
import { Empty, List, Pill, Row, Section, Sheet, StageList, Tabs, Timeline } from '@/components/ui';
import { useStore } from '@/lib/store';
import { approvedExtraCost, approvedExtras, finalPrice, isSuperseded } from '@/lib/engine';
import { canSeeInternal } from '@/lib/people';
import { STAGES } from '@/lib/seed';
import { ASSUMPTIONS } from '@/lib/finance';
import { daysBetween, fmtDate, fmtDateLong, money, relDue } from '@/lib/format';
import { stageTone } from './Homes';
import { ChangeSheetBody, changeTone, changeLabel } from './Changes';
import { TaskDetail } from './TaskDetail';

type Tab = 'overview' | 'selections' | 'changes' | 'updates' | 'money';

export function HomeDetail({ id }: { id: string }) {
  const { state, role } = useStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [openChange, setOpenChange] = useState<string | null>(null);
  const [openTask, setOpenTask] = useState<string | null>(null);
  const home = state.homes.find((h) => h.id === id);
  if (!home) {
    return (
      <Page title="Home not found" back="/homes">
        <Empty title="This home isn't in the sample portfolio." next="Go back to Homes and pick another." />
      </Page>
    );
  }
  const internal = canSeeInternal(role);
  const owner = role === 'homeowner';
  const changes = state.changes.filter((c) => c.homeId === id).sort((a, b) => (b.number ?? 99) - (a.number ?? 99));
  const selections = state.selections.filter((x) => x.homeId === id);
  const updates = state.updates.filter((u) => u.homeId === id && (internal || u.audience === 'homeowner')).sort((a, b) => b.date.localeCompare(a.date));
  const trades = state.trades.filter((t) => t.homeId === id && t.status !== 'superseded');
  const installed = state.changes.filter((c) => c.homeId === id && c.status === 'approved' && c.spec && !isSuperseded(c.id, state.changes));
  const myTasks = state.tasks.filter((t) => t.homeId === id && t.role === role && t.status === 'open');
  const fp = finalPrice(home, state.changes);
  const moved = state.closingMoves[id];
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'selections', label: 'Selections' },
    { id: 'changes', label: 'Changes' },
    { id: 'updates', label: 'Updates' },
    ...(internal ? [{ id: 'money' as Tab, label: 'Money' }] : []),
  ];
  const daysToClose = home.closing ? daysBetween(state.today, home.closing) : null;
  const title = owner ? 'Your home' : `Lot ${home.lot}`;
  const sub = owner ? `${home.plan} · ${home.civic} ${home.street}` : `${home.civic} ${home.street} · ${home.community}`;
  const task = state.tasks.find((t) => t.id === openTask) ?? null;
  const change = state.changes.find((c) => c.id === openChange) ?? null;

  return (
    <Page title={title} sub={sub} back={owner ? undefined : '/homes'}>
      <div className={s.hero}>
        <div className={s.heroRow}>
          <div>
            <div className={s.heroLabel}>{home.closing ? (owner ? 'Your closing date' : 'Closing') : 'Status'}</div>
            <div className={s.heroValue}>{home.closing ? fmtDateLong(home.closing) : 'Spec home, for sale'}</div>
            {daysToClose !== null && (
              <div className={s.heroLabel} style={{ marginTop: 2 }}>
                {daysToClose} days away{moved ? ` · moved ${Math.round(moved / 7)} weeks` : ''}
              </div>
            )}
          </div>
          <Pill tone={stageTone(home)}>{home.behindWeeks ? `${home.behindWeeks} weeks behind` : STAGES[home.stage]}</Pill>
        </div>
        <div className={s.heroBar}>
          <Timeline stage={home.stage} />
        </div>
        <div className={s.facts}>
          {!owner && <div className={s.fact}><span>Buyer</span><strong>{home.buyer ?? 'Not sold'}</strong></div>}
          <div className={s.fact}><span>Plan</span><strong>{home.plan} · {home.style}</strong></div>
          <div className={s.fact}><span>Project manager</span><strong>{home.pm}</strong></div>
          <div className={s.fact}><span>Designer</span><strong>{home.designer}</strong></div>
          {owner && <div className={s.fact}><span>Size</span><strong>{home.beds} bed · {home.baths} bath · {home.sqft.toLocaleString('en-CA')} sq ft</strong></div>}
        </div>
      </div>

      <div className={s.tabsWrap}>
        <Tabs tabs={tabs} value={tab} onChange={setTab} label="Home sections" />
      </div>

      {tab === 'overview' && (
        <>
          {myTasks.length > 0 && (
            <Section title={owner ? 'Waiting on you' : 'Your open items here'} count={myTasks.length}>
              <List>{myTasks.map((t) => <Row key={t.id} title={t.title} meta={t.source} side={relDue(state.today, t.due)} onClick={() => setOpenTask(t.id)} />)}</List>
            </Section>
          )}
          <Section title={owner ? 'Latest from your build' : 'Latest update'}>
            {updates[0] ? (
              <List>
                <div className={s.update}>
                  <div className={s.updateHead}><span>{updates[0].stage} · {updates[0].by}</span><span>{fmtDate(updates[0].date)}</span></div>
                  <p className={s.updateNote}>{updates[0].note}</p>
                </div>
              </List>
            ) : (
              <List><Empty title="No updates yet." next={owner ? 'Gerry posts updates as each stage wraps up.' : 'Post one when the next stage starts.'} /></List>
            )}
          </Section>
          {internal && installed.length > 0 && (
            <Section title="Current approved installation" count={installed.length}>
              <List>
                {installed.map((c) => (
                  <div key={c.id} className={s.update}>
                    <div className={s.updateHead}><span>Lot {home.lot} · {c.spec!.location}</span><span>CO #{c.number} · {fmtDate(c.decidedOn!)}</span></div>
                    <p className={s.updateNote}>{c.spec!.finish} · {c.spec!.size}</p>
                  </div>
                ))}
              </List>
            </Section>
          )}
          {internal && trades.length > 0 && (
            <Section title="Trade readiness" count={trades.length}>
              <List>
                {trades.map((t) => (
                  <Row key={t.id} title={`${t.trade} · ${t.company}`} meta={t.scope} side={<Pill tone={t.status === 'ready' ? 'green' : 'amber'}>{t.status === 'ready' ? 'Ready' : 'Waiting'}</Pill>} sideSub={`By ${fmtDate(t.neededBy)}`} onClick={() => setTab('updates')} />
                ))}
              </List>
            </Section>
          )}
          <Section title="Build stages">
            <List><div style={{ padding: '8px 16px' }}><StageList stage={home.stage} /></div></List>
          </Section>
        </>
      )}

      {tab === 'selections' && (
        <Section title="Finish selections" count={selections.length}>
          <List>
            {selections.length ? (
              selections.map((x) => (
                <div key={x.id} className={s.update}>
                  <div className={s.updateHead}><span>{x.room}</span><Pill tone={x.status === 'confirmed' ? 'green' : 'amber'}>{x.status === 'confirmed' ? 'Confirmed' : 'Being finalized'}</Pill></div>
                  <p className={s.updateNote}>{x.choice}</p>
                </div>
              ))
            ) : (
              <Empty title="Selections are on file." next={`${home.designer} keeps the full list. Changes show in the Changes tab.`} />
            )}
          </List>
        </Section>
      )}

      {tab === 'changes' && (
        <>
          <Section title="Price">
            <List>
              <div className={s.kv}><span>{home.status === 'presold' ? 'Contract price' : 'List price'}</span><span className="num">{money(home.status === 'presold' ? home.contractPrice : home.listPrice)}</span></div>
              <div className={s.kv}><span>Approved changes</span><span className="num">{money(approvedExtras(id, state.changes))}</span></div>
              <div className={`${s.kv} ${s.kvStrong}`}><span>Final price</span><span className="num">{money(fp)}</span></div>
            </List>
          </Section>
          <Section title="Change orders" count={changes.length}>
            <List>
              {changes.length ? (
                changes.map((c) => (
                  <Row
                    key={c.id}
                    title={`${c.number ? `CO #${c.number} · ` : ''}${c.title}`}
                    meta={c.room}
                    side={<Pill tone={changeTone(c.status)}>{changeLabel(c.status)}</Pill>}
                    sideSub={<span className="num">{c.price !== null ? money(c.price) : 'Not priced'}</span>}
                    onClick={() => setOpenChange(c.id)}
                  />
                ))
              ) : (
                <Empty title="No changes yet." next="Requests from the buyer show up here." />
              )}
            </List>
          </Section>
          {internal && (
            <Section title="History" count={state.activity.filter((a) => a.homeId === id).length}>
              <List>
                {state.activity.filter((a) => a.homeId === id).length ? (
                  state.activity.filter((a) => a.homeId === id).map((a) => (
                    <div key={a.id} className={s.activity}>
                      {a.who} {a.text}
                      <span>{fmtDate(a.at)}</span>
                    </div>
                  ))
                ) : (
                  <Empty title="No history yet." next="Actions on this home's changes show up here." />
                )}
              </List>
            </Section>
          )}
        </>
      )}

      {tab === 'updates' && (
        <>
          <Section title="Updates" count={updates.length}>
            <List>
              {updates.length ? updates.map((u) => (
                <div key={u.id} className={s.update}>
                  <div className={s.updateHead}><span>{u.stage} · {u.by}{internal && u.audience === 'team' ? ' · team only' : ''}</span><span>{fmtDate(u.date)}</span></div>
                  <p className={s.updateNote}>{u.note}</p>
                </div>
              )) : <Empty title="No updates yet." next="Updates appear as each stage wraps up." />}
            </List>
          </Section>
          {internal && trades.length > 0 && (
            <Section title="Trades">
              <List>
                {trades.map((t) => (
                  <div key={t.id} className={s.update}>
                    <div className={s.updateHead}><span>{t.trade} · {t.company}</span><Pill tone={t.status === 'ready' ? 'green' : 'amber'}>{t.status === 'ready' ? 'Ready' : 'Waiting'}</Pill></div>
                    <p className={s.updateNote}>{t.scope}. Needed by {fmtDate(t.neededBy, true)}.</p>
                  </div>
                ))}
              </List>
            </Section>
          )}
        </>
      )}

      {tab === 'money' && internal && (
        <Section title="Home economics">
          <List>
            {[
              ['Final price (incl. HST)', money(fp)],
              ['Deposit received', money(home.deposit)],
              ['Build cost incl. changes', money(home.cost + approvedExtraCost(id, state.changes))],
              ['Spent to date', money(home.spent)],
              ['Construction loan at closing', money(Math.round((home.cost + approvedExtraCost(id, state.changes)) * ASSUMPTIONS.loanShare))],
              ['Gross margin', `${money(fp - home.cost - approvedExtraCost(id, state.changes))} · ${Math.round(((fp - home.cost - approvedExtraCost(id, state.changes)) / fp) * 100)}%`],
            ].map(([k, v], i) => (
              <div key={k} className={`${s.kv} ${i === 5 ? s.kvStrong : ''}`}><span>{k}</span><span className="num">{v}</span></div>
            ))}
          </List>
          <p className={s.note}>Sample numbers. Gross margin is before overhead and interest. Loan assumed at {Math.round(ASSUMPTIONS.loanShare * 100)}% of cost.</p>
        </Section>
      )}

      <Sheet open={!!change} title={change?.number ? `Change order #${change.number}` : 'Change request'} onClose={() => setOpenChange(null)}>
        {change && <ChangeSheetBody change={change} onDone={() => setOpenChange(null)} />}
      </Sheet>
      <Sheet open={!!task} title={task?.source ?? ''} onClose={() => setOpenTask(null)}>
        {task && <TaskDetail task={task} onDone={() => setOpenTask(null)} />}
      </Sheet>
    </Page>
  );
}
