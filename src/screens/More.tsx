'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import s from './screens.module.css';
import { Page } from '@/components/Shell';
import { Button, List, Pill, Row, Section, Sheet, Tabs } from '@/components/ui';
import { useStore } from '@/lib/store';
import { ROLES } from '@/lib/people';
import { STORY } from '@/lib/engine';
import type { Palette } from '@/lib/store';
import { fmtDate, lotLabel } from '@/lib/format';

const COLOURWAYS: {id:Palette;label:string;hex:string}[]=[
  {id:'cobalt',label:'Cobalt',hex:'#315dce'},{id:'copper',label:'Copper',hex:'#a35b35'},
  {id:'forest',label:'Forest',hex:'#327d62'},{id:'plum',label:'Plum',hex:'#8852ae'},
  {id:'slate',label:'Slate',hex:'#4b6681'},{id:'rose',label:'Rose',hex:'#a84969'},
  {id:'marchand63',label:'Marchand 63',hex:'#a87936'},{id:'panther',label:'Panther Red',hex:'#bd3542'},
  {id:'architect',label:'Architect',hex:'#426b69'},{id:'blackgold',label:'Black & Gold',hex:'#826b3c'},
  {id:'coastal',label:'Coastal',hex:'#237a8f'},{id:'city',label:'City',hex:'#5565a1'}
];

export function More() {
  const { role, setRole, theme, setTheme, palette, setPalette, guide, setGuide, reset, state, story } = useStore();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const activity = state.activity.slice(0, 12);
  return (
    <Page title="More" sub="Settings and demo controls">
      <Section title="Workspaces · Jeff & Scott">
        <List label="Functional demo tools">
          <Row title="Decision desk" meta="Owner decisions, Scott's blockers and closing watch" href="/studio?tab=decisions" />
          <Row title="Quote Studio" meta="Editable extras, running totals and CSV export" href="/studio?tab=quote" />
          <Row title="Closing desk" meta="Sample handoff checklist and current tasks" href="/studio?tab=closeout" />
          <Row title="Site issues" meta="Log, assign, resolve and reopen demo blockers" href="/studio?tab=issues" />
        </List>
      </Section>
      <Section title="View as">
        <List label="Roles">
          {ROLES.map((r) => (
            <Row
              key={r.id}
              title={r.person}
              meta={r.title}
              active={r.id === role}
              side={r.id === role ? <Check size={18} aria-label="Current role" /> : undefined}
              onClick={() => { setRole(r.id); router.push('/'); }}
            />
          ))}
        </List>
      </Section>

      <Section title="Demo">
        <List>
          <div className={s.setting}>
            <div className={s.settingText}>
              Demo guide
              <span>Shows the next story step on Today. {Math.min(story, STORY.length)} of {STORY.length} done.</span>
            </div>
            <button type="button" role="switch" aria-checked={guide} aria-label="Demo guide" className={s.switch} onClick={() => setGuide(!guide)} />
          </div>
          <div className={s.setting}>
            <div className={s.settingText}>
              Reset demo
              <span>Back to the start of the story. Takes one tap.</span>
            </div>
            <Button variant="danger" onClick={() => setConfirm(true)}>Reset</Button>
          </div>
        </List>
      </Section>

      <Section title="Appearance">
        <Tabs
          tabs={[{ id: 'system', label: 'Automatic' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }]}
          value={theme}
          onChange={setTheme}
          label="Theme"
        />
        <div className={s.paletteGrid} role="group" aria-label="Choose colourway">
          {COLOURWAYS.map(c=><button type="button" key={c.id} className={palette===c.id?s.paletteActive:s.paletteButton} aria-pressed={palette===c.id} onClick={()=>setPalette(c.id)}>
            <span className={s.paletteSwatch} style={{background:c.hex}} />{c.label}
          </button>)}
        </div>
      </Section>

      <Section title="Shared activity" count={state.activity.length}>
        <List>
          {activity.length ? (
            activity.map((a) => {
              const h = a.homeId ? state.homes.find((x) => x.id === a.homeId) : null;
              return (
                <div key={a.id} className={s.activity}>
                  {a.who} {a.text}
                  <span>{fmtDate(a.at)}{h ? ` · ${lotLabel(h)}` : ''}</span>
                </div>
              );
            })
          ) : (
            <div className={s.activity}>
              Nothing yet.
              <span>Every action from every role lands here, in one shared record.</span>
            </div>
          )}
        </List>
      </Section>

      <Section title="About">
        <List>
          <div className={s.activity}>
            <Pill tone="amber">Sample data</Pill>
            <span style={{ marginTop: 8 }}>
              Staff are Marchand&apos;s own team. Buyers, addresses, lots and dollar figures are made up. Permissions are a demo: there are no real logins.
            </span>
          </div>
        </List>
      </Section>
      <p className={s.about}>Marchand HQ · V6 Sprint 1 · sample-data demo</p>

      <Sheet open={confirm} title="Reset the demo?" onClose={() => setConfirm(false)}>
        <p className={s.detailText}>Clears every change made in this session and starts the story again as the designer.</p>
        <div className={s.actions}>
          <Button
            variant="primary"
            onClick={() => {
              reset();
              setRole('designer');
              setConfirm(false);
              router.push('/');
            }}
          >
            Reset demo
          </Button>
          <Button onClick={() => setConfirm(false)}>Cancel</Button>
        </div>
      </Sheet>
    </Page>
  );
}
