import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Jeff / Scott five-minute demo retains five navigable steps', () => {
  const dashboard = read('../src/components/ExecutiveDashboard.tsx');
  for (const destination of [
    '/studio?tab=decisions',
    '/studio?tab=issues',
    '/homes/',
    '/studio?tab=quote',
    '/studio?tab=closeout'
  ]) assert.ok(dashboard.includes(destination), `Missing demo destination: ${destination}`);
  assert.match(dashboard, /Run the 5-minute demo/);
  assert.match(dashboard, /setRole\(who\);router\.push\(href\)/);
});
test('floating demo assistant retains honest sample-data fallback', () => {
  const floating = read('../src/components/FloatingAsk.tsx');
  const intelligence = read('../src/components/Intelligence.tsx');
  assert.match(floating, /<AskContent \/>/);
  assert.match(intelligence, /demoAnswer\(question/);
  assert.match(intelligence, /mode:'demo'/);
  assert.match(intelligence, /Live AI requires a provider connection/);
  assert.match(intelligence, /Real Marchand records are not connected/);
});
test('AI API fails explicitly when unconfigured and restricts response to demo context', () => {
  const route = read('../src/app/api/intelligence/route.ts');
  assert.match(route, /if \(!key\).*status: 503/);
  assert.match(route, /fictional sample data/);
  assert.match(route, /Never claim to have accessed live Marchand records/);
});
