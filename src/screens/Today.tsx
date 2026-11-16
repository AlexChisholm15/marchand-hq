'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import s from './screens.module.css';
import { Page } from '@/components/Shell';
import { Button, Empty, List, Row, Section, Sheet, lateClass } from '@/components/ui';
import { useStore } from '@/lib/store';
import { todayFor } from '@/lib/engine';
import { roleById } from '@/lib/people';
import { retainTaskSelection } from '@/lib/demoSafety';
import { daysBetween, lotLabel, relDue } from '@/lib/format';
import type { Task } from '@/lib/types';
import { TaskDetail } from './TaskDetail';
import { OpsBrief } from '@/components/OpsBrief';
import { DemoRoute } from '@/components/DemoRoute';
import { ExecutiveDashboard } from '@/components/ExecutiveDashboard';

function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = matchMedia('(min-width: 1024px)');
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

export function Today() {
  const { state, role } = useStore();
  const router = useRouter();
  const wide = useWide();
  const groups = todayFor(state, role);
  const [selected, setSelected] = useState<string | null>(null);
  const r = roleById(role);

  useEffect(() => {
    const id = new URLSearchParams(location.search).get('task');
    if (id) setSelected(id);
    const handle = (event: Event) => setSelected((event as CustomEvent<string>).detail);
    window.addEventListener('marchand:open-task', handle);
    return () => window.removeEventListener('marchand:open-task', handle);
  }, []);

  // Keep a sensible selection on wide screens as work gets done.
  const all = state.tasks.filter((t) => t.role === role);
  const current = all.find((t) => t.id === selected) ?? null;
  useEffect(() => {
    if (!wide) return;
    if (!current || current.status === 'done') {
      const next = groups.now[0] ?? groups.week[0] ?? null;
      if (next && next.id !== selected) setSelected(next.id);
    }
  }, [wide, current, groups.now, groups.week, selected]);
  useEffect(() => {
    // Preserve a valid ?task= deep link on initial load and when switching roles.
    setSelected((previous) => retainTaskSelection(previous, role, state.tasks));
  }, [role, state.tasks]);

  const homeOf = (t: Task) => (t.homeId ? state.homes.find((h) => h.id === t.homeId) : undefined);
  const row = (t: Task) => {
    const h = homeOf(t);
    const late = t.status === 'open' && daysBetween(state.today, t.due) < 0;
    return (
      <Row
        key={t.id}
        title={t.title}
        meta={[h ? lotLabel(h) : null, t.owner !== r.person && role !== 'homeowner' ? t.owner : null, t.source].filter(Boolean).join(' · ')}
        side={t.status === 'done' ? 'Done' : <span className={late ? lateClass : undefined}>{relDue(state.today, t.due)}</span>}
        active={wide && t.id === selected}
        done={t.status === 'done'}
        onClick={() => setSelected(t.id)}
      />
    );
  };

  const empty = groups.now.length === 0 && groups.week.length === 0;
  const greeting = r.person.split(' ')[0];

  return (
    <Page title={role === 'owner' ? 'Executive' : role === 'coo' ? 'Operations' : 'Today'} sub={`${r.person} · ${r.title}`}>
      {role === 'owner' || role === 'coo' ? <><ExecutiveDashboard /><details className={s.briefDisclosure}><summary>Detailed operations brief &amp; copyable handoff</summary><OpsBrief /></details></> : <><DemoRoute /><OpsBrief /></>}
      <div id="mhq-task-workflow" className={s.split}>
        <div>
          {empty ? (
            <Section title="Needs you now">
              <List>
                <Empty
                  title={`You're all caught up, ${greeting}.`}
                  next="New work lands here the moment someone needs you."
                  action={<Button onClick={() => router.push(role === 'homeowner' ? '/homes/h01' : '/homes')}>{role === 'homeowner' ? 'See your home' : 'Browse homes'}</Button>}
                />
              </List>
            </Section>
          ) : (
            <>
              <Section title="Needs you now" count={groups.now.length}>
                {groups.now.length ? <List label="Needs you now">{groups.now.map(row)}</List> : <List><Empty title="Nothing urgent." next="Everything due in the next two days is done." /></List>}
              </Section>
              {groups.week.length > 0 && (
                <Section title="This week" count={groups.week.length}>
                  <List label="This week">{groups.week.map(row)}</List>
                </Section>
              )}
            </>
          )}
          {groups.done.length > 0 && (
            <Section title="Done" count={groups.done.length} collapsible defaultOpen={false}>
              <List label="Done">{groups.done.map(row)}</List>
            </Section>
          )}
        </div>
        <aside className={s.pane} aria-label="Details">
          {current ? <TaskDetail task={current} /> : <Empty title="Pick something on the left." next="Details and actions show up here." />}
        </aside>
      </div>
      {!wide && (
        <Sheet open={!!current} title={current ? (homeOf(current) ? lotLabel(homeOf(current)!) : current.source) : ''} onClose={() => setSelected(null)}>
          {current && <TaskDetail task={current} onDone={() => setSelected(null)} />}
        </Sheet>
      )}
    </Page>
  );
}
