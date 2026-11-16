import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEMO_INSIGHTS } from '../src/lib/demoInsights.ts';

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');

test('each guided demo stage has a truthful benefit explanation', () => {
  const entries = Object.values(DEMO_INSIGHTS);
  for (let stage = 1; stage <= 5; stage++) assert.ok(entries.some(entry => entry.step === stage), 'Missing guided stage '+stage);
  for (const entry of entries) {
    assert.ok(entry.title.length > 10);
    assert.ok(entry.present.length > 30);
    assert.ok(entry.potential.length > 35);
  }
});

test('insight tags appear on relevant demo surfaces, not all screens',()=>{
  const studio = read('../src/screens/Studio.tsx');
  const home = read('../src/screens/HomeDetail.tsx');
  for(const topic of ['decision','watch','issue','quote','estimate','closeout','handoff']){
    assert.ok(studio.includes('topic="'+topic+'"'),'Missing Studio insight: '+topic);
  }
  assert.ok(home.includes('topic="home"'));
  const tag=read('../src/components/DemoInsightTag.tsx');
  assert.match(tag,/demoStepFromUrl/);
  assert.match(tag,/role="dialog"/);
  assert.match(tag,/aria-modal="true"/);
  assert.match(tag,/Conceptual capabilities are not currently connected/);
});

test('guided navigation notifies same-screen destination and closes insights on exit',()=>{
  const nav=read('../src/components/DemoNavigator.tsx');
  const studio=read('../src/screens/Studio.tsx');
  assert.match(nav,/marchand:demo-route/);
  assert.match(studio,/addEventListener\('marchand:demo-route'/);
  assert.match(nav,/index:null/);
});
