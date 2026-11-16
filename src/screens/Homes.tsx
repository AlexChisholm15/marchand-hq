'use client';

import { useMemo, useState } from 'react';
import s from './screens.module.css';
import { Page } from '@/components/Shell';
import { Empty, List, Pill, Row, SearchBox, Section, Tabs, type Tone } from '@/components/ui';
import { useStore } from '@/lib/store';
import { homesFor } from '@/lib/engine';
import { STAGES } from '@/lib/seed';
import { fmtDate } from '@/lib/format';
import type { Home } from '@/lib/types';

type Filter = 'all' | 'starting' | 'building' | 'finishing' | 'spec';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'starting', label: 'Starting' },
  { id: 'building', label: 'Building' },
  { id: 'finishing', label: 'Finishing' },
  { id: 'spec', label: 'Spec' },
];

const match = (f: Filter, h: Home) =>
  f === 'all' ||
  (f === 'spec' && h.status === 'spec') ||
  (f === 'starting' && h.stage <= 2) ||
  (f === 'building' && h.stage >= 3 && h.stage <= 6) ||
  (f === 'finishing' && h.stage >= 7);

export function stageTone(h: Home): Tone {
  if (h.behindWeeks > 0) return 'amber';
  if (h.stage >= 8) return 'green';
  return 'neutral';
}

export function Homes() {
  const { state, role } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const homes = homesFor(state, role);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return homes
      .filter((h) => match(filter, h))
      .filter((h) => !needle || `lot ${h.lot} ${h.civic} ${h.street} ${h.community} ${h.plan} ${h.buyer ?? 'spec'}`.toLowerCase().includes(needle))
      .sort((a, b) => (a.closing ?? '9999').localeCompare(b.closing ?? '9999') || b.stage - a.stage);
  }, [homes, q, filter]);

  const sub = role === 'realtor' ? `${homes.length} homes with your buyers` : `${homes.length} homes · ${homes.filter((h) => h.status === 'presold').length} sold · ${homes.filter((h) => h.status === 'spec').length} spec`;

  return (
    <Page title="Homes" sub={sub}>
      <div className={s.filters}>
        <SearchBox value={q} onChange={setQ} placeholder="Search lot, street, buyer or plan" />
        <Tabs tabs={role === 'realtor' ? FILTERS.filter((f) => f.id !== 'spec') : FILTERS} value={filter} onChange={setFilter} label="Filter by stage" />
      </div>
      <Section title={filter === 'all' ? 'By closing date' : FILTERS.find((f) => f.id === filter)!.label} count={list.length}>
        <List label="Homes">
          {list.length ? (
            list.map((h) => (
              <Row
                key={h.id}
                href={`/homes/${h.id}`}
                title={`Lot ${h.lot} · ${h.civic} ${h.street}`}
                meta={`${h.buyer ?? 'Spec home'} · ${h.plan} · ${h.community}`}
                side={<Pill tone={stageTone(h)}>{h.behindWeeks ? `${STAGES[h.stage]} · late` : STAGES[h.stage]}</Pill>}
                sideSub={<span className="num">{h.closing ? `Closes ${fmtDate(h.closing)}` : h.status === 'spec' ? 'For sale' : ''}</span>}
              />
            ))
          ) : (
            <Empty title="No homes match." next="Clear the search or pick another stage." />
          )}
        </List>
      </Section>
    </Page>
  );
}
