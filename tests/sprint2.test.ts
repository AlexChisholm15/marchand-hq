import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {derive} from '../src/lib/engine.ts';
import {forecast} from '../src/lib/finance.ts';
const read=(f:string)=>readFileSync(new URL(f,import.meta.url),'utf8');

test('Jeff and Scott get executive cockpit without losing standard task actions',()=>{
 const today=read('../src/screens/Today.tsx');
 assert.match(today,/<ExecutiveDashboard \/>/);
 assert.match(today,/<TaskDetail task=/);
 assert.match(today,/<DemoRoute \/>/);
 assert.match(today,/<OpsBrief \/>/);
 assert.match(today,/marchand:open-task/);
});
test('Executive cockpit has real route actions for project map and demo studio',()=>{
 const src=read('../src/components/ExecutiveDashboard.tsx');
 for(const route of ['/homes/','/studio?tab=decisions','/studio?tab=quote','/studio?tab=issues','/studio?tab=closeout'])assert.ok(src.includes(route),route);
 assert.match(src,/setRole\('owner'\)/);assert.match(src,/setRole\('coo'\)/);
 assert.match(src,/setFilter\('delayed'\)/);
 assert.match(src,/setQueueView/);
 assert.match(src,/setSpotIndex/);
});
test('Dashboard KPIs are derived from same deterministic demo state as project pages',()=>{
 const state=derive('2026-11-16',[]);
 const delayed=state.homes.filter(h=>h.behindWeeks>0).length;
 const sold=state.homes.filter(h=>h.status==='presold').length;
 const changes=state.changes.filter(c=>c.status==='requested'||c.status==='priced').length;
 assert.ok(delayed>=0&&delayed<=state.homes.length);
 assert.equal(sold,28);
 assert.ok(changes>=0);
 const cash=forecast(state.today,state.homes,state.changes);
 assert.equal(cash.weeks.length,13);
 const dashboard=read('../src/components/ExecutiveDashboard.tsx');
 assert.match(dashboard,/forecast\(state.today,state.homes,state.changes\)/);
 assert.match(dashboard,/pending=state.changes.filter/);
});
test('No private Gmail, actual client addresses or external writes in new cockpit',()=>{
 const text=read('../src/components/ExecutiveDashboard.tsx');
 assert.doesNotMatch(text,/@gmail\.com|@marchandhomes\.ca|Celebration Drive|Curtis Drive|Zaffre Drive|mail\.google/i);
 assert.doesNotMatch(text,/fetch\(|XMLHttpRequest|axios\./);
 assert.match(text,/DEMO ONLY/);
});
test('Portfolio, executive queue and graphical cash horizon are present in all theme contexts',()=>{
 const jsx=read('../src/components/ExecutiveDashboard.tsx'),css=read('../src/components/ExecutiveDashboard.module.css');
 for(const key of ['mapTile','hero','lens','tourSteps','kpi','panel','chart']){assert.ok(jsx.includes('s.'+key));assert.ok(css.includes('.'+key));}
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css, /var\(--accent\)/);
});
test('New sessions enter dark Marchand theme; saved roles and edits retain v6 storage',()=>{
 const store=read('../src/lib/store.tsx'),layout=read('../src/app/layout.tsx');
 assert.match(store,/theme: 'dark', palette: 'marchand63'/);
 assert.match(store,/const KEY = 'marchand-hq-v6'/);
 assert.match(layout,/appleWebApp/);
});
